import { NextResponse } from "next/server";
import { getOfficeLocation } from "@/lib/office";
import { getWalkTimes } from "@/lib/routes";
import { LUNCH_TYPES, MAX_WALK_MINUTES, SEARCH_RADIUS_METERS } from "@/lib/constants";

// Vercel serverless function (Node.js runtime). Single source of truth for
// "find lunch spots near the office" — used by Explore, Surprise Me, and
// manual add/lookup. Adapted from the bar app's /api/places route: same
// Firestore-backed 24h search cache, same exact-match ranking for manual
// adds, but location bias is always the office (not user-supplied), and
// every result is checked against the real Google-Routes walking time and
// tagged with walkMinutes/walkMeters so the client can enforce (or, for
// manual adds, warn about) the 20-minute cutoff.
//
// Required env vars (Vercel Project Settings -> Environment Variables):
//   GOOGLE_MAPS_API_KEY   (Places API (New) + Routes API + Geocoding API,
//                          all enabled on the same key/project)
//   FIREBASE_PROJECT_ID   (for the shared Places + walk-time caches)

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_COLLECTION = "placesSearchCache";

const PRICE_LEVEL_RANK: Record<string, number> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

const EXACT_MATCH_THRESHOLD = 0.45;

function normalizeName(s: string): string {
  return String(s || "")
    .toLowerCase()
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function nameSimilarity(a: string, b: string): number {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.85;
  const ta = na.split(" ");
  const tb = nb.split(" ");
  const tbSet = new Set(tb);
  let overlap = 0;
  for (const t of ta) if (tbSet.has(t)) overlap++;
  return (2 * overlap) / (ta.length + tb.length);
}

function stripApostrophes(s: string): string {
  return s
    .replace(/[‘’ʼ]/g, "'")
    .replace(/'/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildExactQueries(query: string, neighborhood: string, address: string): string[] {
  const q = query.trim();
  const nb = neighborhood.trim();
  const addr = address.trim();
  const join = (parts: string[]) => parts.filter(Boolean).join(", ");
  const variants = [
    join([q, nb, addr]),
    join([stripApostrophes(q), nb, addr]),
    join([q, nb]),
    join([q, addr]),
    join([q, "New York, NY"]),
  ].filter((s) => s.length > 0);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of variants) {
    const key = v.toLowerCase().replace(/\s+/g, " ");
    if (!seen.has(key)) {
      seen.add(key);
      out.push(v);
    }
  }
  return out;
}

function laxStatusOk(status: string): boolean {
  return !/^CLOSED/.test(status || "");
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function scoreExactCandidate(p: RawPlace, ctx: LookupContext): number {
  let score = nameSimilarity(p.displayName || "", ctx.query);
  const nb = normalizeName(ctx.neighborhood);
  const addr = normalizeName(ctx.address);
  const nameAndAddr = normalizeName(`${p.displayName || ""} ${p.formattedAddress || ""}`);
  if (nb && nameAndAddr.includes(nb)) score += 0.15;
  if (addr && nameAndAddr.includes(addr)) score += 0.15;
  const status = p.businessStatus || "";
  if (status === "OPERATIONAL") score += 0.1;
  else if (/^CLOSED/.test(status)) score -= 0.3;
  if (Number.isFinite(p.latitude) && Number.isFinite(p.longitude)) {
    const d = haversineMeters(ctx.center.latitude, ctx.center.longitude, p.latitude as number, p.longitude as number);
    score += 0.02 * Math.max(0, 1 - d / ctx.radius);
  }
  return score;
}

function hashString(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash.toString(16);
}
function cacheKeyFor(textQuery: string): string {
  const normalized = textQuery.trim().toLowerCase().replace(/\s+/g, " ");
  const slug = normalized
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 60)
    .replace(/^-+|-+$/g, "");
  return `${slug || "q"}-${hashString(normalized)}`;
}

type FsValue =
  | { nullValue: null }
  | { stringValue: string }
  | { booleanValue: boolean }
  | { integerValue: string }
  | { doubleValue: number }
  | { arrayValue: { values?: FsValue[] } }
  | { mapValue: { fields?: Record<string, FsValue> } };

function toFirestoreValue(value: unknown): FsValue {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toFirestoreValue) } };
  if (typeof value === "object") {
    const fields: Record<string, FsValue> = {};
    for (const k of Object.keys(value as Record<string, unknown>))
      fields[k] = toFirestoreValue((value as Record<string, unknown>)[k]);
    return { mapValue: { fields } };
  }
  return { nullValue: null };
}
function fromFirestoreValue(v: FsValue | undefined | null): unknown {
  if (!v) return null;
  if ("nullValue" in v) return null;
  if ("stringValue" in v) return v.stringValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("integerValue" in v) return parseInt(v.integerValue, 10);
  if ("doubleValue" in v) return v.doubleValue;
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(fromFirestoreValue);
  if ("mapValue" in v) {
    const out: Record<string, unknown> = {};
    const fields = v.mapValue.fields || {};
    for (const k of Object.keys(fields)) out[k] = fromFirestoreValue(fields[k]);
    return out;
  }
  return null;
}
function docToObject(doc: { fields?: Record<string, FsValue> }): Record<string, unknown> {
  const fields = (doc && doc.fields) || {};
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(fields)) out[k] = fromFirestoreValue(fields[k]);
  return out;
}
function firestoreDocUrl(projectId: string, docId: string): string {
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${CACHE_COLLECTION}/${docId}`;
}
async function readCache(projectId: string, docId: string): Promise<Record<string, unknown> | null> {
  try {
    const response = await fetch(firestoreDocUrl(projectId, docId));
    if (response.status === 404) return null;
    if (!response.ok) return null;
    return docToObject(await response.json());
  } catch (e) {
    console.error("Firestore cache read error", e);
    return null;
  }
}
async function writeCache(projectId: string, docId: string, data: Record<string, unknown>): Promise<void> {
  try {
    const fields: Record<string, FsValue> = {};
    for (const k of Object.keys(data)) fields[k] = toFirestoreValue(data[k]);
    const response = await fetch(firestoreDocUrl(projectId, docId), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields }),
    });
    if (!response.ok) console.error("Firestore cache write failed", response.status, await response.text());
  } catch (e) {
    console.error("Firestore cache write error", e);
  }
}

interface RawPlace {
  displayName?: string;
  formattedAddress?: string;
  latitude?: number | null;
  longitude?: number | null;
  placeId?: string | null;
  mapsLink?: string;
  businessStatus?: string;
  priceLevel?: string;
  types?: string[];
  rating?: number | null;
}

interface LookupContext {
  apiKey: string;
  projectId: string | undefined;
  maxResultCount: number;
  exactLookup: boolean;
  query: string;
  neighborhood: string;
  address: string;
  center: { latitude: number; longitude: number };
  radius: number;
}

interface ShapedPlace {
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  placeId: string | null;
  mapsLink: string;
  rating: number | null;
  types: string[];
  priceLevel: string;
}

class PlacesApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function filterAndShape(rawPlaces: RawPlace[], ctx: LookupContext): ShapedPlace[] {
  let list: RawPlace[];
  if (ctx.exactLookup) {
    list = rawPlaces
      .map((p) => ({ p, score: scoreExactCandidate(p, ctx) }))
      .filter((x) => laxStatusOk(x.p.businessStatus || "") && x.score >= EXACT_MATCH_THRESHOLD)
      .sort((a, b) => b.score - a.score || (a.p.displayName || "").localeCompare(b.p.displayName || ""))
      .map((x) => x.p);
  } else {
    list = rawPlaces
      .filter((p) => p.businessStatus === "OPERATIONAL")
      .filter((p) => (p.types || []).some((t) => LUNCH_TYPES.includes(t)))
      .filter((p) => {
        const rank = PRICE_LEVEL_RANK[p.priceLevel || ""];
        return rank === undefined || rank <= 2; // keep it to reasonable lunch prices
      });
  }
  return list.slice(0, ctx.maxResultCount).map((p) => ({
    name: p.displayName || ctx.query,
    address: p.formattedAddress || "",
    latitude: p.latitude ?? null,
    longitude: p.longitude ?? null,
    placeId: p.placeId || null,
    mapsLink: p.mapsLink || (p.placeId ? `https://www.google.com/maps/place/?q=place_id:${p.placeId}` : ""),
    rating: typeof p.rating === "number" ? p.rating : null,
    types: p.types || [],
    priceLevel: p.priceLevel || "",
  }));
}

async function queryGooglePlaces(textQuery: string, ctx: LookupContext): Promise<RawPlace[]> {
  const requestBody: Record<string, unknown> = {
    textQuery,
    maxResultCount: ctx.maxResultCount,
    locationBias: { circle: { center: ctx.center, radius: ctx.radius } },
  };
  if (!ctx.exactLookup) requestBody.includedType = "restaurant";

  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": ctx.apiKey,
      "X-Goog-FieldMask": [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.location",
        "places.businessStatus",
        "places.priceLevel",
        "places.types",
        "places.googleMapsUri",
        "places.rating",
      ].join(","),
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    console.error("Places API error", response.status, await response.text());
    throw new PlacesApiError("Places API request failed", 502);
  }

  const data = await response.json();
  const places = Array.isArray(data.places) ? data.places : [];
  return places.map(
    (p: Record<string, unknown>): RawPlace => ({
      displayName: (p.displayName as { text?: string } | undefined)?.text || "",
      formattedAddress: String(p.formattedAddress || ""),
      latitude: (p.location as { latitude?: number | null } | undefined)?.latitude ?? null,
      longitude: (p.location as { longitude?: number | null } | undefined)?.longitude ?? null,
      placeId: p.id ? String(p.id) : null,
      mapsLink: String(p.googleMapsUri || ""),
      businessStatus: String(p.businessStatus || ""),
      priceLevel: String(p.priceLevel || ""),
      types: Array.isArray(p.types) ? (p.types as string[]) : [],
      rating: typeof p.rating === "number" ? p.rating : null,
    }),
  );
}

async function fetchOrCachePlaces(
  textQuery: string,
  ctx: LookupContext,
  cacheDocId: string | null,
): Promise<{ rawPlaces: RawPlace[] }> {
  if (cacheDocId && ctx.projectId) {
    const cached = await readCache(ctx.projectId, cacheDocId);
    if (cached && Array.isArray(cached.places)) {
      const fresh = typeof cached.timestamp === "number" && Date.now() - cached.timestamp < CACHE_TTL_MS;
      const places = cached.places as unknown[];
      if (fresh && places.length > 0) return { rawPlaces: cached.places as RawPlace[] };
    }
  }
  const rawPlaces = await queryGooglePlaces(textQuery, ctx);
  if (rawPlaces.length > 0 && cacheDocId && ctx.projectId) {
    await writeCache(ctx.projectId, cacheDocId, { places: rawPlaces, timestamp: Date.now(), query: textQuery });
  }
  return { rawPlaces };
}

async function runExactLookup(ctx: LookupContext): Promise<ShapedPlace[]> {
  const queries = buildExactQueries(ctx.query, ctx.neighborhood, ctx.address);
  for (const textQuery of queries) {
    const cacheDocId = ctx.projectId ? cacheKeyFor(textQuery) : null;
    const res = await fetchOrCachePlaces(textQuery, ctx, cacheDocId);
    const shaped = filterAndShape(res.rawPlaces, ctx);
    if (shaped.length > 0) return shaped;
  }
  return [];
}

/** Attach real walking time/distance to each shaped place, tagging results
 *  that exceed MAX_WALK_MINUTES rather than always dropping them — the
 *  caller decides whether to filter (discovery) or just warn (manual add). */
async function withWalkTimes(
  places: ShapedPlace[],
  apiKey: string,
  projectId: string | undefined,
): Promise<(ShapedPlace & { walkMinutes: number | null; walkMeters: number | null })[]> {
  const office = await getOfficeLocation();
  const withCoords = places.filter(
    (p): p is ShapedPlace & { placeId: string; latitude: number; longitude: number } =>
      !!p.placeId && Number.isFinite(p.latitude) && Number.isFinite(p.longitude),
  );
  const walkTimes = await getWalkTimes(
    { latitude: office.latitude, longitude: office.longitude },
    withCoords.map((p) => ({ placeId: p.placeId, latitude: p.latitude, longitude: p.longitude })),
    apiKey,
    projectId,
  );
  return places.map((p) => {
    const walk = p.placeId ? walkTimes.get(p.placeId) : undefined;
    return {
      ...p,
      walkMinutes: walk ? walk.minutes : null,
      walkMeters: walk ? walk.meters : null,
    };
  });
}

export async function POST(req: Request) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Server is missing GOOGLE_MAPS_API_KEY" }, { status: 500 });
  }
  const projectId = process.env.FIREBASE_PROJECT_ID;

  const body = (await req.json().catch(() => ({}))) as {
    query?: string;
    neighborhood?: string;
    address?: string;
    limit?: number;
    exactLookup?: boolean;
  };
  const { query, neighborhood = "", address = "", limit = 8, exactLookup = false } = body;

  if (!query || !String(query).trim()) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const maxResultCount = Math.min(Math.max(Number(limit) || 8, 1), 20);
  const office = await getOfficeLocation();
  const center = { latitude: office.latitude, longitude: office.longitude };

  const ctx: LookupContext = {
    apiKey,
    projectId,
    maxResultCount,
    exactLookup,
    query: String(query).trim(),
    neighborhood,
    address,
    center,
    radius: SEARCH_RADIUS_METERS,
  };

  try {
    if (exactLookup) {
      const shaped = await runExactLookup(ctx);
      const withWalk = await withWalkTimes(shaped, apiKey, projectId);
      return NextResponse.json(withWalk);
    }

    const textQuery = [query, "near", office.address].filter(Boolean).join(" ") + " restaurant";
    const cacheDocId = projectId ? cacheKeyFor(textQuery) : null;
    const { rawPlaces } = await fetchOrCachePlaces(textQuery, ctx, cacheDocId);
    const shaped = filterAndShape(rawPlaces, ctx);
    const withWalk = await withWalkTimes(shaped, apiKey, projectId);
    // Discovery is a hard filter: only spots genuinely within the walk
    // budget are ever surfaced. A missing walk time (Routes API failure)
    // is treated as "unknown, don't show" rather than silently including
    // something possibly outside the radius.
    const withinRadius = withWalk.filter(
      (p) => p.walkMinutes !== null && p.walkMinutes <= MAX_WALK_MINUTES,
    );
    return NextResponse.json(withinRadius);
  } catch (e) {
    if (e instanceof PlacesApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("Restaurant lookup failed", e);
    return NextResponse.json({ error: "Restaurant lookup failed" }, { status: 500 });
  }
}
