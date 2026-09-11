import { SURPRISE_VIBES } from "./constants";
import type { PlaceResult } from "./types";

// Session-only cache: repeating the same search within PLACES_CACHE_TTL_MS
// reuses the prior response instead of re-billing Google. Cleared on page
// reload — saved spots never hit this path again anyway, since verification
// only happens once, at add-time.
const placesCache = new Map<string, { time: number; results: PlaceResult[] }>();
const PLACES_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export interface FetchRestaurantsOptions {
  neighborhood?: string;
  address?: string;
  limit?: number;
  noCache?: boolean;
  exactLookup?: boolean;
}

export async function fetchRestaurants(
  query: string,
  options: FetchRestaurantsOptions = {},
): Promise<PlaceResult[]> {
  const { neighborhood, address, limit, noCache, exactLookup } = options;

  const cacheKey = JSON.stringify({
    query,
    neighborhood,
    address,
    limit: limit || 8,
    exactLookup: !!exactLookup,
  });
  if (!noCache) {
    const cached = placesCache.get(cacheKey);
    if (cached && Date.now() - cached.time < PLACES_CACHE_TTL_MS) return cached.results;
  }
  try {
    const response = await fetch("/api/restaurants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        neighborhood,
        address,
        limit: limit || 8,
        exactLookup: !!exactLookup,
      }),
    });
    const results = await response.json();
    const safe = Array.isArray(results) ? (results as PlaceResult[]) : [];
    if (!noCache && safe.length > 0) placesCache.set(cacheKey, { time: Date.now(), results: safe });
    return safe;
  } catch {
    return [];
  }
}

export async function fetchExploreSuggestions(
  query: string,
  excludeNames: string[],
): Promise<PlaceResult[]> {
  const results = await fetchRestaurants(query || "lunch", { limit: 8 });
  return results.filter((r) => !excludeNames.includes(r.name)).slice(0, 4);
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** One result per craving, not `count` results of ONE craving — a single
 *  vibe search (e.g. "pizza") only ever returns pizza places, so picking
 *  `count` distinct vibes and taking one winner from each is what actually
 *  makes a Surprise Me batch varied instead of four versions of the same
 *  cuisine. Fetches run in parallel for speed; final list is deduped by
 *  name in case two different vibe searches happen to surface the same
 *  restaurant. */
export async function fetchSurpriseSpots(excludeNames: string[], count = 4): Promise<PlaceResult[]> {
  const vibes = shuffle(SURPRISE_VIBES).slice(0, count);
  const resultLists = await Promise.all(vibes.map((vibe) => fetchRestaurants(vibe, { limit: 10, noCache: true })));

  const picks: PlaceResult[] = [];
  const seen = new Set(excludeNames);
  for (const results of resultLists) {
    const fresh = shuffle(results.filter((r) => !seen.has(r.name)));
    const pick = fresh[0];
    if (!pick) continue;
    picks.push(pick);
    seen.add(pick.name);
  }
  return picks;
}
