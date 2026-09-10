import { MAX_WALK_MINUTES } from "./constants";
import type { Spot } from "./types";

/** Distance score is NOT user-rated — it's derived automatically from the
 *  real walking time from the office (see src/lib/office.ts /
 *  src/lib/routes.ts), on a 0-10 scale: 10 = right outside the door, 0 = at
 *  the MAX_WALK_MINUTES edge. Spots beyond the edge never make it into the
 *  shared list in the first place (filtered at discovery time), so this
 *  should always land in [0, 10] for any spot actually in the app, but it's
 *  clamped defensively in case the walk-time formula or office location
 *  changes after a spot was saved. */
export function distanceScore(walkMinutes: number | null | undefined): number | null {
  if (walkMinutes === null || walkMinutes === undefined || isNaN(walkMinutes)) {
    return null;
  }
  const raw = 10 * (1 - walkMinutes / MAX_WALK_MINUTES);
  return Math.max(0, Math.min(10, raw));
}

/** Overall score = mean of vibe, value, service, food, and the derived
 *  distance score — only if all five are present (non-null, numeric).
 *  Mirrors the bar app's avgWithFood(), with "drinks" replaced by
 *  distance. */
export function avgScore(s: Spot): number | null {
  if (s.disqualified) return null;
  const dist = distanceScore(s.walkMinutes);
  const vals = [s.vibe, s.value, s.service, s.food, dist].filter(
    (v): v is number =>
      v !== null && v !== undefined && String(v).trim() !== "" && !isNaN(Number(v)),
  );
  if (vals.length < 5) return null;
  return vals.reduce((a, c) => a + Number(c), 0) / vals.length;
}

/** Mean of just the four subjective ratings (no distance) — used when a
 *  spot has no walk time recorded yet but the user has already rated it. */
export function avgWithoutDistance(s: Spot): number | null {
  if (s.disqualified) return null;
  const vals = [s.vibe, s.value, s.service, s.food].filter(
    (v): v is number =>
      v !== null && v !== undefined && String(v).trim() !== "" && !isNaN(Number(v)),
  );
  if (vals.length < 4) return null;
  return vals.reduce((a, c) => a + Number(c), 0) / vals.length;
}

export function fmt(n: number | null | undefined): string {
  return n === null || n === undefined || isNaN(n) ? "—" : Number(n).toFixed(2);
}

export function fmtWalk(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined || isNaN(minutes)) return "—";
  const rounded = Math.max(1, Math.round(minutes));
  return `${rounded} min`;
}

export function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
