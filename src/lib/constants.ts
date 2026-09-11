import type { Spot, VisitedForm, WishForm } from "./types";

/** Base shape every spot record starts from. */
export const base: Omit<
  Spot,
  | "id"
  | "name"
  | "status"
  | "vibe"
  | "value"
  | "service"
  | "food"
  | "walkMinutes"
  | "walkMeters"
  | "notes"
> = {
  neighborhood: "",
  description: "",
  tags: [],
  specials: "",
  mapsLink: "",
  address: "",
  latitude: null,
  longitude: null,
  placeId: null,
  detailsFetched: false,
  disqualified: false,
  disqualifyReason: "",
};

export const DOC_PATH = { collection: "lunchRadius", doc: "sharedList" };
export const OFFICE_CONFIG_DOC = { collection: "config", doc: "office" };

export const emptyVisitedForm: VisitedForm = {
  id: null,
  name: "",
  vibe: "",
  value: "",
  service: "",
  food: "",
  notes: "",
};

export const emptyWishForm: WishForm = {
  id: null,
  name: "",
  neighborhood: "",
  notes: "",
};

export const SURPRISE_VIBES = [
  "quick lunch",
  "salad",
  "sandwich",
  "ramen",
  "sushi",
  "tacos",
  "pizza",
  "healthy bowl",
  "noodles",
  "soup",
  "burger",
  "deli",
];

/** Default office anchor — 10 Hudson Yards, New York, NY. This is used only
 *  until the server successfully geocodes OFFICE_ADDRESS (or OFFICE_LAT /
 *  OFFICE_LNG env vars are set) and caches the result in Firestore; see
 *  src/lib/office.ts. Safe fallback so the app never hard-fails without
 *  Google API keys configured yet. */
export const DEFAULT_OFFICE = {
  address: "10 Hudson Yards, New York, NY 10001",
  latitude: 40.7541,
  longitude: -74.0021,
};

/** Hard cutoff for "near the office" — spots whose real walking route
 *  exceeds this are filtered out of discovery entirely. */
export const MAX_WALK_MINUTES = 20;

/** Generous search radius around the office for the initial Places query.
 *  Walking routes are rarely more than ~1.4x the straight-line distance in
 *  a street grid, and MAX_WALK_MINUTES at an average pace covers roughly
 *  1,600m beeline — padded up for detours, then the real walking time from
 *  OpenRouteService does the precise filtering. */
export const SEARCH_RADIUS_METERS = 2200;

export const WALK_SPEED_MPS = 1.34; // ~4.8 km/h average walking pace, beeline-estimate fallback only
export const WALK_DETOUR_FACTOR = 1.3; // streets aren't straight lines, beeline-estimate fallback only

/** Food-relevant Google Places (New) types accepted for discovery results. */
export const LUNCH_TYPES = [
  "restaurant",
  "cafe",
  "bakery",
  "sandwich_shop",
  "fast_food_restaurant",
  "meal_takeaway",
  "coffee_shop",
];

// Deli-ticket gradient for the map — chili red (lower score) through egg-yolk
// gold to pickle green (top score). Matches the "stamped ticket" palette.
export const HEAT_GRADIENTS: Record<"visited" | "wishlist", Record<number, string>> = {
  visited: {
    0.0: "#FF7A54", // chili-300 — lower tier
    0.25: "#FF4321",
    0.5: "#FFB800", // yolk
    0.75: "#5FC383",
    1.0: "#1E8E4F", // pickle — top rated
  },
  wishlist: {
    0.0: "#FFE3AE",
    0.25: "#FFCE47",
    0.5: "#FFB800",
    0.75: "#E29E00",
    1.0: "#FF4321",
  },
};

export const HEAT_DOT_COLOR: Record<"wishlist", string> = {
  wishlist: "#FFB800",
};
