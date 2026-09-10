import type { Spot, RankingDuel } from "./types";

/**
 * Global ranking rules (pure functions — no Firestore, no React).
 *
 * Primary:   numerical score (higher ranks higher)
 * Secondary: Taste-Off tiebreak (only consulted for spots with EQUAL scores)
 * Final:     deterministic fallback (name, then id) when duels don't fully
 *            decide a group — e.g. cyclic results (A>B, B>C, C>A) or spots
 *            that have never faced off.
 *
 * A duel is only ever consulted when BOTH spots currently have the same
 * score. Duels between spots whose scores have since diverged are ignored,
 * and a duel never changes a score — it only reorders an exact tie.
 */

/** Scores are averages of 0.5-step ratings plus a continuous distance
 *  component, so exact ties are less common than in the bar app but still
 *  happen; a tiny epsilon keeps float noise from splitting a
 *  mathematically-equal tie into two "different" scores. */
const EPSILON = 1e-9;

export function scoresEqual(a: number, b: number): boolean {
  return Math.abs(a - b) < EPSILON;
}

export interface RankedEntry<T> {
  item: T;
  score: number | null;
}

export interface DuelPair {
  spot1: Spot;
  spot2: Spot;
  /** The shared score that made these two tie. */
  score: number;
}

const pairKey = (a: string, b: string) => [a, b].sort().join("|");

/**
 * Order a list of entries by score, breaking exact ties with recorded
 * Taste-Off duels. The full leaderboard uses this; the result is
 * deterministic for a given (spots, duels) state, so the displayed order is
 * stable across clients and reloads.
 *
 * Within a tie group each spot is scored by its duel record (wins desc,
 * losses asc — a simple Copeland-style count). This is cycle-safe: cyclic
 * results simply leave the tied members at equal counts, where the
 * name/id fallback produces a stable order instead of an unstable one.
 */
export function rankEntries<T extends { id: string; name: string }>(
  entries: RankedEntry<T>[],
  duels: RankingDuel[],
): T[] {
  const nullGroup: RankedEntry<T>[] = [];
  const groups = new Map<string, RankedEntry<T>[]>();
  for (const e of entries) {
    if (e.score === null || e.score === undefined || isNaN(e.score)) {
      nullGroup.push(e);
      continue;
    }
    const key = e.score.toFixed(9);
    const group = groups.get(key);
    if (group) group.push(e);
    else groups.set(key, [e]);
  }

  const out: T[] = [];
  const keys = [...groups.keys()].sort((a, b) => Number(b) - Number(a));
  for (const key of keys) {
    out.push(...orderGroup(groups.get(key)!, duels));
  }
  nullGroup.sort(
    (a, b) =>
      a.item.name.localeCompare(b.item.name) || a.item.id.localeCompare(b.item.id),
  );
  out.push(...nullGroup.map((e) => e.item));
  return out;
}

function orderGroup<T extends { id: string; name: string }>(
  group: RankedEntry<T>[],
  duels: RankingDuel[],
): T[] {
  const ids = new Set(group.map((e) => e.item.id));
  const wins = new Map<string, number>();
  const losses = new Map<string, number>();
  for (const d of duels) {
    if (!ids.has(d.spot1Id) || !ids.has(d.spot2Id)) continue;
    if (d.winnerId === d.spot1Id) {
      wins.set(d.spot1Id, (wins.get(d.spot1Id) || 0) + 1);
      losses.set(d.spot2Id, (losses.get(d.spot2Id) || 0) + 1);
    } else if (d.winnerId === d.spot2Id) {
      wins.set(d.spot2Id, (wins.get(d.spot2Id) || 0) + 1);
      losses.set(d.spot1Id, (losses.get(d.spot1Id) || 0) + 1);
    }
  }
  return [...group]
    .sort(
      (a, b) =>
        (wins.get(b.item.id) || 0) - (wins.get(a.item.id) || 0) ||
        (losses.get(a.item.id) || 0) - (losses.get(b.item.id) || 0) ||
        a.item.name.localeCompare(b.item.name) ||
        a.item.id.localeCompare(b.item.id),
    )
    .map((e) => e.item);
}

/**
 * The pairs that still need a Taste-Off, in the order the user should
 * resolve them. Walk the current duel-ordered ranking and pick adjacent
 * spots that (a) share the same score, (b) are ranked and not disqualified,
 * and (c) have never faced off. Recording a duel permanently removes that
 * pair from this set.
 */
export function pendingDuelPairs(
  entries: RankedEntry<Spot>[],
  duels: RankingDuel[],
): DuelPair[] {
  const duelled = new Set(duels.map((d) => pairKey(d.spot1Id, d.spot2Id)));
  const eligible = entries.filter(
    (e) =>
      !e.item.disqualified &&
      e.score !== null &&
      e.score !== undefined &&
      !isNaN(e.score),
  );
  const ordered = rankEntries(eligible, duels);
  const scoreById = new Map(eligible.map((e) => [e.item.id, e.score as number]));

  const pairs: DuelPair[] = [];
  for (let i = 0; i < ordered.length - 1; i++) {
    const a = ordered[i];
    const b = ordered[i + 1];
    const sa = scoreById.get(a.id);
    const sb = scoreById.get(b.id);
    if (sa === undefined || sb === undefined || !scoresEqual(sa, sb)) continue;
    if (duelled.has(pairKey(a.id, b.id))) continue;
    pairs.push({ spot1: a, spot2: b, score: sa });
  }
  return pairs;
}

/**
 * Which spots' ranking positions are (at least partly) decided by a
 * Taste-Off — i.e. the spot shares its exact score with another spot AND a
 * recorded duel exists between two members of that same score group.
 */
export function duelDecidedSpotIds(
  entries: RankedEntry<Spot>[],
  duels: RankingDuel[],
): Set<string> {
  const groups = new Map<string, Spot[]>();
  for (const e of entries) {
    if (
      e.item.disqualified ||
      e.score === null ||
      e.score === undefined ||
      isNaN(e.score)
    ) {
      continue;
    }
    const key = e.score.toFixed(9);
    const group = groups.get(key);
    if (group) group.push(e.item);
    else groups.set(key, [e.item]);
  }
  const decided = new Set<string>();
  for (const group of groups.values()) {
    const ids = new Set(group.map((s) => s.id));
    for (const d of duels) {
      if (ids.has(d.spot1Id) && ids.has(d.spot2Id)) {
        decided.add(d.spot1Id);
        decided.add(d.spot2Id);
      }
    }
  }
  return decided;
}
