import { DEFAULT_OFFICE, OFFICE_CONFIG_DOC } from "./constants";

// Resolves the office's lat/lng once per server instance and reuses it.
//
// Priority:
//   1. OFFICE_LAT + OFFICE_LNG env vars, if both set — fastest, no network
//      call, recommended for production once you know the exact coordinates.
//   2. Geocode OFFICE_ADDRESS (or the default "10 Hudson Yards, New York, NY")
//      via the Google Geocoding API, then cache the result in Firestore
//      (config/office) so future cold starts skip the geocode call too.
//   3. DEFAULT_OFFICE constant, if neither of the above is available (no API
//      key configured yet) — keeps local dev/build working before secrets
//      are set up, at the cost of using an approximate coordinate.

export interface OfficeLocation {
  address: string;
  latitude: number;
  longitude: number;
  source: "env" | "geocode" | "firestore-cache" | "default";
}

let cached: OfficeLocation | null = null;
let inFlight: Promise<OfficeLocation> | null = null;

function envOffice(): OfficeLocation | null {
  const lat = Number(process.env.OFFICE_LAT);
  const lng = Number(process.env.OFFICE_LNG);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return {
      address: process.env.OFFICE_ADDRESS || DEFAULT_OFFICE.address,
      latitude: lat,
      longitude: lng,
      source: "env",
    };
  }
  return null;
}

async function readFirestoreCache(
  projectId: string,
): Promise<OfficeLocation | null> {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${OFFICE_CONFIG_DOC.collection}/${OFFICE_CONFIG_DOC.doc}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const doc = await res.json();
    const fields = doc.fields || {};
    const address = fields.address?.stringValue;
    const latitude = fields.latitude?.doubleValue ?? fields.latitude?.integerValue;
    const longitude = fields.longitude?.doubleValue ?? fields.longitude?.integerValue;
    if (
      typeof address === "string" &&
      Number.isFinite(Number(latitude)) &&
      Number.isFinite(Number(longitude))
    ) {
      return {
        address,
        latitude: Number(latitude),
        longitude: Number(longitude),
        source: "firestore-cache",
      };
    }
  } catch (e) {
    console.error("office: firestore cache read failed", e);
  }
  return null;
}

async function writeFirestoreCache(
  projectId: string,
  office: OfficeLocation,
): Promise<void> {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${OFFICE_CONFIG_DOC.collection}/${OFFICE_CONFIG_DOC.doc}`;
    await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: {
          address: { stringValue: office.address },
          latitude: { doubleValue: office.latitude },
          longitude: { doubleValue: office.longitude },
          updatedAt: { integerValue: String(Date.now()) },
        },
      }),
    });
  } catch (e) {
    console.error("office: firestore cache write failed", e);
  }
}

async function geocodeAddress(
  address: string,
  apiKey: string,
): Promise<{ latitude: number; longitude: number } | null> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const loc = data?.results?.[0]?.geometry?.location;
  if (loc && Number.isFinite(loc.lat) && Number.isFinite(loc.lng)) {
    return { latitude: loc.lat, longitude: loc.lng };
  }
  return null;
}

export async function getOfficeLocation(): Promise<OfficeLocation> {
  if (cached) return cached;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const fromEnv = envOffice();
    if (fromEnv) {
      cached = fromEnv;
      return fromEnv;
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    if (projectId) {
      const fromCache = await readFirestoreCache(projectId);
      if (fromCache) {
        cached = fromCache;
        return fromCache;
      }
    }

    const address = process.env.OFFICE_ADDRESS || DEFAULT_OFFICE.address;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (apiKey) {
      try {
        const geo = await geocodeAddress(address, apiKey);
        if (geo) {
          const office: OfficeLocation = { address, ...geo, source: "geocode" };
          cached = office;
          if (projectId) await writeFirestoreCache(projectId, office);
          return office;
        }
      } catch (e) {
        console.error("office: geocode failed", e);
      }
    }

    const fallback: OfficeLocation = { ...DEFAULT_OFFICE, source: "default" };
    cached = fallback;
    return fallback;
  })();

  try {
    return await inFlight;
  } finally {
    inFlight = null;
  }
}
