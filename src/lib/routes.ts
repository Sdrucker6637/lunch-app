// Real walking-route times from the office, via the Google Routes API
// (computeRouteMatrix, travelMode WALK). This is the source of truth for the
// 20-minute cutoff — NOT the straight-line haversine estimate, which is only
// used as a cheap pre-filter before we spend a Routes API call.
//
// Walk times between the office and a given place are effectively static
// (the same two points on the same street network), so results are cached
// in Firestore keyed by placeId with a long TTL — after the first lookup,
// a given restaurant's walk time is essentially free.

const ROUTES_ENDPOINT =
  "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix";
const WALK_CACHE_COLLECTION = "walkTimeCache";
const WALK_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days — geography doesn't move
const MAX_DESTINATIONS_PER_CALL = 25;

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

function parseDurationSeconds(duration: string | undefined): number | null {
  if (!duration) return null;
  const m = /^(\d+(?:\.\d+)?)s$/.exec(duration);
  return m ? Number(m[1]) : null;
}

async function computeRouteMatrixBatch(
  origin: { latitude: number; longitude: number },
  destinations: Destination[],
  apiKey: string,
): Promise<Map<string, WalkTimeResult>> {
  const out = new Map<string, WalkTimeResult>();
  if (destinations.length === 0) return out;

  const body = {
    origins: [
      {
        waypoint: {
          location: {
            latLng: { latitude: origin.latitude, longitude: origin.longitude },
          },
        },
      },
    ],
    destinations: destinations.map((d) => ({
      waypoint: {
        location: { latLng: { latitude: d.latitude, longitude: d.longitude } },
      },
    })),
    travelMode: "WALK",
  };

  const res = await fetch(ROUTES_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "originIndex,destinationIndex,duration,distanceMeters,condition",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.error("routes: computeRouteMatrix failed", res.status, await res.text());
    return out;
  }

  const elements = (await res.json()) as Array<{
    originIndex?: number;
    destinationIndex?: number;
    duration?: string;
    distanceMeters?: number;
    condition?: string;
  }>;

  for (const el of elements) {
    if (el.condition && el.condition !== "ROUTE_EXISTS") continue;
    const idx = el.destinationIndex ?? 0;
    const dest = destinations[idx];
    if (!dest) continue;
    const seconds = parseDurationSeconds(el.duration);
    if (seconds === null || typeof el.distanceMeters !== "number") continue;
    out.set(dest.placeId, { minutes: seconds / 60, meters: el.distanceMeters });
  }
  return out;
}

/**
 * Resolve real walking time + distance from the office to each destination.
 * Cached results (Firestore, 30-day TTL, keyed by placeId) are reused;
 * everything else is batched into Routes API calls (<=25 destinations per
 * request, per Google's limit). Destinations without a placeId are skipped —
 * there's nothing stable to cache them by, and the caller (routes normally
 * only calls this with real Places results) should not hit that path.
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
    const batchResult = await computeRouteMatrixBatch(origin, batch, apiKey);
    for (const [placeId, walk] of batchResult) {
      result.set(placeId, walk);
      if (projectId) await writeWalkCache(projectId, placeId, walk);
    }
  }

  return result;
}
