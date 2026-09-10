import { describe, expect, it } from "vitest";
import { avgScore, distanceScore, fmt, fmtWalk } from "./scoring";
import { base } from "./constants";
import type { Spot } from "./types";

function makeSpot(overrides: Partial<Spot> = {}): Spot {
  return {
    ...base,
    id: "s1",
    name: "Test Spot",
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

describe("distanceScore", () => {
  it("returns 10 for a spot right outside the office", () => {
    expect(distanceScore(0)).toBe(10);
  });
  it("returns 0 at exactly the 20-minute cutoff", () => {
    expect(distanceScore(20)).toBe(0);
  });
  it("returns 5 at the 10-minute midpoint", () => {
    expect(distanceScore(10)).toBe(5);
  });
  it("clamps negative results to 0 for anything beyond the cutoff", () => {
    expect(distanceScore(30)).toBe(0);
  });
  it("returns null when walk time is unknown", () => {
    expect(distanceScore(null)).toBeNull();
  });
});

describe("avgScore", () => {
  it("requires all five categories (including distance) to produce a score", () => {
    const spot = makeSpot({ vibe: 8, value: 8, service: 8, food: 8, walkMinutes: null });
    expect(avgScore(spot)).toBeNull();
  });

  it("averages vibe/value/service/food with the derived distance score", () => {
    // vibe=8, value=8, service=8, food=8 -> 8; walkMinutes=10 -> distance=5
    // avg = (8+8+8+8+5)/5 = 7.4
    const spot = makeSpot({ vibe: 8, value: 8, service: 8, food: 8, walkMinutes: 10 });
    expect(avgScore(spot)).toBeCloseTo(7.4);
  });

  it("returns null for disqualified spots", () => {
    const spot = makeSpot({ vibe: 10, value: 10, service: 10, food: 10, walkMinutes: 0, disqualified: true });
    expect(avgScore(spot)).toBeNull();
  });

  it("rewards a closer spot over a farther one with identical ratings", () => {
    const close = makeSpot({ vibe: 7, value: 7, service: 7, food: 7, walkMinutes: 2 });
    const far = makeSpot({ vibe: 7, value: 7, service: 7, food: 7, walkMinutes: 18 });
    expect(avgScore(close)!).toBeGreaterThan(avgScore(far)!);
  });
});

describe("fmt", () => {
  it("formats to two decimals", () => {
    expect(fmt(7.4)).toBe("7.40");
  });
  it("shows an em dash for null", () => {
    expect(fmt(null)).toBe("—");
  });
});

describe("fmtWalk", () => {
  it("rounds to the nearest minute, minimum 1", () => {
    expect(fmtWalk(0.4)).toBe("1 min");
    expect(fmtWalk(12.6)).toBe("13 min");
  });
  it("shows an em dash for unknown", () => {
    expect(fmtWalk(null)).toBe("—");
  });
});
