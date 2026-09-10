import { describe, expect, it } from "vitest";
import { duelDecidedSpotIds, pendingDuelPairs, rankEntries, type RankedEntry } from "./ranking";
import { base } from "./constants";
import type { RankingDuel, Spot } from "./types";

function makeSpot(id: string, overrides: Partial<Spot> = {}): Spot {
  return {
    ...base,
    id,
    name: overrides.name || id,
    status: "visited",
    vibe: null,
    value: null,
    service: null,
    food: null,
    walkMinutes: null,
    walkMeters: null,
    notes: "",
    ...overrides,
  };
}

describe("rankEntries", () => {
  it("orders by score descending", () => {
    const a: RankedEntry<Spot> = { item: makeSpot("a"), score: 7 };
    const b: RankedEntry<Spot> = { item: makeSpot("b"), score: 9 };
    const c: RankedEntry<Spot> = { item: makeSpot("c"), score: 5 };
    expect(rankEntries([a, b, c], []).map((s) => s.id)).toEqual(["b", "a", "c"]);
  });

  it("puts unscored spots last, sorted by name", () => {
    const a: RankedEntry<Spot> = { item: makeSpot("a", { name: "Zebra" }), score: null };
    const b: RankedEntry<Spot> = { item: makeSpot("b", { name: "Apple" }), score: 8 };
    const c: RankedEntry<Spot> = { item: makeSpot("c", { name: "Apple Deux" }), score: null };
    expect(rankEntries([a, b, c], []).map((s) => s.id)).toEqual(["b", "c", "a"]);
  });

  it("breaks exact ties with a recorded duel (winner ranks higher)", () => {
    const a: RankedEntry<Spot> = { item: makeSpot("a"), score: 8 };
    const b: RankedEntry<Spot> = { item: makeSpot("b"), score: 8 };
    const duel: RankingDuel = { id: "d1", spot1Id: "a", spot2Id: "b", winnerId: "b", type: "score_tiebreak", createdAt: 1 };
    expect(rankEntries([a, b], [duel]).map((s) => s.id)).toEqual(["b", "a"]);
  });

  it("is cycle-safe: a 3-way cycle falls back to name order", () => {
    const a: RankedEntry<Spot> = { item: makeSpot("a", { name: "A" }), score: 8 };
    const b: RankedEntry<Spot> = { item: makeSpot("b", { name: "B" }), score: 8 };
    const c: RankedEntry<Spot> = { item: makeSpot("c", { name: "C" }), score: 8 };
    const duels: RankingDuel[] = [
      { id: "d1", spot1Id: "a", spot2Id: "b", winnerId: "a", type: "score_tiebreak", createdAt: 1 },
      { id: "d2", spot1Id: "b", spot2Id: "c", winnerId: "b", type: "score_tiebreak", createdAt: 2 },
      { id: "d3", spot1Id: "c", spot2Id: "a", winnerId: "c", type: "score_tiebreak", createdAt: 3 },
    ];
    // Each spot has 1 win / 1 loss, so the cycle can't decide — falls back to name order.
    expect(rankEntries([a, b, c], duels).map((s) => s.id)).toEqual(["a", "b", "c"]);
  });

  it("ignores a duel once the two spots' scores have diverged", () => {
    const a: RankedEntry<Spot> = { item: makeSpot("a"), score: 9 };
    const b: RankedEntry<Spot> = { item: makeSpot("b"), score: 8 };
    const duel: RankingDuel = { id: "d1", spot1Id: "a", spot2Id: "b", winnerId: "b", type: "score_tiebreak", createdAt: 1 };
    // b "won" their old duel, but a now has the higher score outright.
    expect(rankEntries([a, b], [duel]).map((s) => s.id)).toEqual(["a", "b"]);
  });
});

describe("pendingDuelPairs", () => {
  it("flags adjacent tied, un-duelled, non-disqualified spots", () => {
    const entries: RankedEntry<Spot>[] = [
      { item: makeSpot("a"), score: 8 },
      { item: makeSpot("b"), score: 8 },
      { item: makeSpot("c"), score: 6 },
    ];
    const pairs = pendingDuelPairs(entries, []);
    expect(pairs).toHaveLength(1);
    expect([pairs[0].spot1.id, pairs[0].spot2.id].sort()).toEqual(["a", "b"]);
  });

  it("excludes a pair that already has a recorded duel", () => {
    const entries: RankedEntry<Spot>[] = [
      { item: makeSpot("a"), score: 8 },
      { item: makeSpot("b"), score: 8 },
    ];
    const duel: RankingDuel = { id: "d1", spot1Id: "a", spot2Id: "b", winnerId: "a", type: "score_tiebreak", createdAt: 1 };
    expect(pendingDuelPairs(entries, [duel])).toHaveLength(0);
  });

  it("excludes disqualified spots even if tied", () => {
    const entries: RankedEntry<Spot>[] = [
      { item: makeSpot("a", { disqualified: true }), score: null },
      { item: makeSpot("b"), score: 8 },
    ];
    expect(pendingDuelPairs(entries, [])).toHaveLength(0);
  });
});

describe("duelDecidedSpotIds", () => {
  it("marks both spots in a decided tie", () => {
    const entries: RankedEntry<Spot>[] = [
      { item: makeSpot("a"), score: 8 },
      { item: makeSpot("b"), score: 8 },
      { item: makeSpot("c"), score: 6 },
    ];
    const duel: RankingDuel = { id: "d1", spot1Id: "a", spot2Id: "b", winnerId: "a", type: "score_tiebreak", createdAt: 1 };
    const decided = duelDecidedSpotIds(entries, [duel]);
    expect(decided.has("a")).toBe(true);
    expect(decided.has("b")).toBe(true);
    expect(decided.has("c")).toBe(false);
  });
});
