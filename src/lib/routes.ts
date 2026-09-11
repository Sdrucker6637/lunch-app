// Real walking-route times from the office, via OpenRouteService's Matrix
// API (foot-walking profile). This is the source of truth for the
// 20-minute cutoff — NOT the straight-line haversine estimate, which is
// only used as a cheap pre-filter before spending an ORS request.
//
// Chosen over Google's Routes API specifically to guarantee this app can
// never generate a Google Cloud bill for walk-time lookups: ORS's free tier
// (2,000 requests/day, no credit card, signup at openrouteservice.org) has
// no paid tier escalation risk the way a billing-account-linked Google API
// does. Google's public OSRM demo server was considered and rejected — it
// only serves driving routes, not walking, so it can't back this feature at
// all, paid or free.
//
// Walk times between the office and a given place are effectively static
// (the same two points on the same street network), so results are cached
// in Firestore keyed by placeId with a long TTL — after the first lookup,
// a given restaurant's walk time is essentially free of ORS quota too.

const ORS_MATRIX_ENDPOINT = "https://api.openrouteservice.org/v2/matrix/foot-walking";
const WALK_CACHE_COLLECTION = "walkTimeCache";
const WALK_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days — geography doesn't move
// ORS's free tier caps a single matrix request at 50 locations and 3,500
// source*destination routes. With exactly one source (the office), 49
// destinations per batch stays comfortably under both limits.
const MAX_DESTINATIONS_PER_CALL = 45;

export interface WalkTimeResult {
  minutes: number;
  meters: number;
}

interface Destination {
  placeId: string;
  latitude: number;
  longitude: number;
}

function walkCacheDocUrl(projectId: string, placeId: string): string {
  // placeId is Google's own opaque, URL-safe identifier — safe to use
  // directly as a Firestore document id.
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${WALK_CACHE_COLLECTION}/${encodeURIComponent(placeId)}`;
}

async function readWalkCache(
  projectId: string,
  placeId: string,
): Promise<WalkTimeResult | null> {
  try {
    const res = await fetch(walkCacheDocUrl(projectId, placeId));
    if (!res.ok) return null;
    const doc = await res.json();
    const fields = doc.fields || {};
    const minutes = Number(fields.minutes?.doubleValue ?? fields.minutes?.integerValue);
    const meters = Number(fields.meters?.doubleValue ?? fields.meters?.integerValue);
    const timestamp = Number(fields.timestamp?.integerValue);
    if (!Number.isFinite(minutes) || !Number.isFinite(meters)) return null;
    if (!Number.isFinite(timestamp) || Date.now() - timestamp > WALK_CACHE_TTL_MS) {
      return null;
    }
    return { minutes, meters };
  } catch {
    return null;
  }
}

async function writeWalkCache(
  projectId: string,
  placeId: string,
  result: WalkTimeResult,
): Promise<void> {
  try {
    await fetch(walkCacheDocUrl(projectId, placeId), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: {
          minutes: { doubleValue: result.minutes },
          meters: { doubleValue: result.meters },
          timestamp: { integerValue: String(Date.now()) },
        },
      }),
    });
  } catch (e) {
    console.error("routes: walk cache write failed", e);
  }
}

async function computeMatrixBatch(
  origin: { latitude: number; longitude: number },
  destinations: Destination[],
  apiKey: string,
): Promise<Map<string, WalkTimeResult>> {
  const out = new Map<string, WalkTimeResult>();
  if (destinations.length === 0) return out;

  // ORS wants [lon, lat] locations, source/destination as indices into that
  // shared array. Index 0 is always the office (the one source).
  const locations = [
    [origin.longitude, origin.latitude],
    ...destinations.map((d) => [d.longitude, d.latitude]),
  ];
  const destinationIndices = destinations.map((_, i) => i + 1);

  const res = await fetch(ORS_MATRIX_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({
      locations,
      sources: [0],
      destinations: destinationIndices,
      metrics: ["duration", "distance"],
      units: "m",
    }),
  });

  if (!res.ok) {
    console.error("routes: ORS matrix request failed", res.status, await res.text());
    return out;
  }

  const data = (await res.json()) as {
    durations?: Array<Array<number | null>>;
    distances?: Array<Array<number | null>>;
  };
  const durations = data.durations?.[0] || [];
  const distances = data.distances?.[0] || [];

  destinations.forEach((dest, i) => {
    const seconds = durations[i];
    const meters = distances[i];
    if (typeof seconds !== "number" || typeof meters !== "number") return;
    out.set(dest.placeId, { minutes: seconds / 60, meters });
  });

  return out;
}

/**
 * Resolve real walking time + distance from the office to each destination.
 * Cached results (Firestore, 30-day TTL, keyed by placeId) are reused;
 * everything else is batched into OpenRouteService matrix requests (<=45
 * destinations per request). Destinations without a placeId are skipped —
 * there's nothing stable to cache them by.
 */
export async function getWalkTimes(
  origin: { latitude: number; longitude: number },
  destinations: Destination[],
  apiKey: string,
  projectId: string | undefined,
): Promise<Map<string, WalkTimeResult>> {
  const result = new Map<string, WalkTimeResult>();
  const uncached: Destination[] = [];

  if (projectId) {
    await Promise.all(
      destinations.map(async (d) => {
        const cached = await readWalkCache(projectId, d.placeId);
        if (cached) result.set(d.placeId, cached);
        else uncached.push(d);
      }),
    );
  } else {
    uncached.push(...destinations);
  }

  for (let i = 0; i < uncached.length; i += MAX_DESTINATIONS_PER_CALL) {
    const batch = uncached.slice(i, i + MAX_DESTINATIONS_PER_CALL);
    const batchResult = await computeMatrixBatch(origin, batch, apiKey);
    for (const [placeId, walk] of batchResult) {
      result.set(placeId, walk);
      if (projectId) await writeWalkCache(projectId, placeId, walk);
    }
  }

  return result;
}
