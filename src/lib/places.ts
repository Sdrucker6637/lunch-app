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

export async function fetchSurpriseSpots(excludeNames: string[], count = 4): Promise<PlaceResult[]> {
  const vibe = SURPRISE_VIBES[Math.floor(Math.random() * SURPRISE_VIBES.length)];
  const results = await fetchRestaurants(vibe, { limit: 10, noCache: true });
  const fresh = results.filter((r) => !excludeNames.includes(r.name));
  // Fisher-Yates shuffle, then take the first `count` — a random subset
  // rather than always the same top-N Google returned for this vibe.
  const shuffled = [...fresh];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}
