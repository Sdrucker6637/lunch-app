// Pure, testable description-enrichment gate logic — no React, no fetch, no
// Firebase. Shared by the client (src/lib/lunch-context.tsx) and the Gemini
// route (src/app/api/gemini/route.ts) so "is this description usable?" is
// byte-for-byte identical on both sides.

/** True when a stored description is actually usable. */
export function isUsefulDescription(value: unknown): boolean {
  return (
    typeof value === "string" &&
    value.trim().length > 35 &&
    !/^\s*[\[]/.test(value)
  );
}

/** Whether a saved spot should be queued for enrichment. */
export function needsEnrichment(spot: {
  description?: unknown;
  detailsFetched?: boolean;
}): boolean {
  return !isUsefulDescription(spot.description) || !spot.detailsFetched;
}

/** Whether a search/suggestion enrichment result counts as success. */
export function isSearchEnrichmentOk(
  info: { description?: unknown } | undefined | null,
): boolean {
  return (
    !!info &&
    typeof info.description === "string" &&
    isUsefulDescription(info.description)
  );
}

/** Max enrichment requests in flight at once. */
export const DETAIL_FETCH_CONCURRENCY = 2;

/** Lunch-appropriate Google Places types — used to ground the Gemini prompt
 *  in actual venue classification rather than guessing from the name. */
const LUNCH_VENUE_TYPES = new Set([
  "restaurant",
  "cafe",
  "bakery",
  "sandwich_shop",
  "fast_food_restaurant",
  "meal_takeaway",
  "coffee_shop",
]);

export function isVenueAppropriateForLunch(types?: string[]): boolean {
  if (!types || types.length === 0) return true;
  return types.some((t) => LUNCH_VENUE_TYPES.has(t));
}

/** Build the Gemini prompt for a saved spot (or an ephemeral search result
 *  when barId-equivalent is absent — same shape either way). The prompt
 *  never claims Google verified the venue; it asks Gemini to describe only
 *  what it actually knows and return an empty description otherwise. */
export function buildEnrichmentPrompt(spot: {
  name: string;
  address?: string | null;
  neighborhood?: string | null;
  types?: string[];
  rating?: number | null;
}): string {
  const location = spot.address || spot.neighborhood || "New York City";
  const hasTypes = !!(spot.types && spot.types.length > 0);
  const venueType = hasTypes ? spot.types!.slice(0, 5).join(", ") : "unknown";
  const ratingStr =
    spot.rating != null && spot.rating > 0 ? `${spot.rating.toFixed(1)} stars` : "no rating";
  const venueContext = `Venue: "${spot.name}" at "${location}".\nGoogle Places classification: [${venueType}]. Rating: ${ratingStr}.\n\n`;
  const classificationRule = hasTypes
    ? "- Use the Google Places classification types above to determine what kind of venue this is.\n- If the types do NOT include restaurant/cafe/bakery/sandwich_shop/fast_food_restaurant/meal_takeaway/coffee_shop, this is NOT a lunch spot — set description to an empty string.\n"
    : "- No Google Places classification is available for this venue — judge from what you actually know about it whether it's a legitimate restaurant/cafe.\n";
  return `${venueContext}Using the Google Places classification above as PRIMARY EVIDENCE (not guessing from the name), return ONLY JSON:\n\n{"description":"two to three sentences covering food style, pace (grab-and-go vs sit-down), and what makes it good for a lunch break","tags":["3 to 5 short lowercase words describing the food/vibe"],"specials":"short string describing lunch deals/specials, or null","neighborhood":"short neighborhood name"}\n\nRules:\n${classificationRule}- Describe ONLY if the venue is a legitimate restaurant/cafe/lunch spot.\n- Do NOT invent or guess based on the venue name alone.\n- Do NOT fabricate specials, tags, or neighborhood data.\n- If you are not confident this is a real lunch spot, set description to an empty string.\n- The description MUST be a real, informative write-up of 40+ characters — never empty, null, or a one-word stub, unless you are genuinely uncertain (then use an empty string).`;
}
