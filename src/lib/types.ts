export type SpotStatus = "visited" | "to-try";

/** One global "Taste-Off" — a pairwise tiebreak decision between two spots
 *  that finished with the same score. Shared by everyone (no accounts); the
 *  winner only affects ORDERING within a score tie, never the scores
 *  themselves. Stored on the shared document as `rankingDuels`.
 *
 *  At most one duel exists per unordered pair — recording a new one
 *  replaces the old, so there are never duplicate or conflicting records. */
export interface RankingDuel {
  id: string;
  spot1Id: string;
  spot2Id: string;
  winnerId: string;
  type: "score_tiebreak";
  createdAt: number;
}

/** How a spot record came to exist. */
export type SpotOrigin = "manual" | "surprise" | "explore" | "crawl";

export interface Spot {
  id: string;
  name: string;
  status: SpotStatus;
  /** User-rated categories, 0-10, 0.5 steps. */
  vibe: number | null;
  value: number | null;
  service: number | null;
  food: number | null;
  /** NOT user-rated — derived automatically from `walkMinutes` by
   *  scoring.ts (10 = right outside the door, 0 = at the 20-min edge).
   *  Stored redundantly so historical scores don't drift if the office
   *  location or walk-time formula ever changes; recomputed on demand by
   *  distanceScore() from walkMinutes as the source of truth. */
  walkMinutes: number | null;
  walkMeters: number | null;
  notes: string;
  neighborhood: string;
  description: string;
  tags: string[];
  specials: string;
  mapsLink: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  placeId: string | null;
  types?: string[];
  detailsFetched: boolean;
  disqualified: boolean;
  disqualifyReason: string;
  createdAt?: number;
  origin?: SpotOrigin;
  cameFromWishlist?: boolean;
  wasDisqualified?: boolean;
}

/** A Google Places result, possibly enriched with Gemini flavor text and a
 *  computed walk time from the office. */
export interface PlaceResult {
  name: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  placeId?: string | null;
  mapsLink?: string;
  rating?: number | null;
  types?: string[];
  priceLevel?: string;
  walkMinutes?: number | null;
  walkMeters?: number | null;
  neighborhood?: string;
  description?: string;
  tags?: string[];
  specials?: string;
  notes?: string;
  _placeIntent?: "visited" | "wishlist";
  _wishFormId?: string;
  _origin?: SpotOrigin;
}

export interface VisitedForm {
  id: string | null;
  name: string;
  vibe: string;
  value: string;
  service: string;
  food: string;
  notes: string;
}

export interface WishForm {
  id: string | null;
  name: string;
  neighborhood: string;
  notes: string;
}

export interface PlacesModalState {
  suggestion: PlaceResult;
  results: PlaceResult[];
  searching: boolean;
}
