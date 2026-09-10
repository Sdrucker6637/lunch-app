import { NextResponse } from "next/server";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { isSearchEnrichmentOk, isUsefulDescription } from "@/lib/enrichment";
import { DOC_PATH } from "@/lib/constants";

// Firebase Admin is initialized lazily so this module can be imported during
// `next build` (where env vars are absent) without throwing.
function ensureAdmin() {
  if (getApps().length === 0) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (!projectId || !clientEmail || !privateKey) return null;
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
    });
  }
  return getFirestore();
}

interface Details {
  name?: string;
  neighborhood?: string;
  description?: string;
  tags?: unknown[];
  specials?: string;
}

function safeParse(text: string): unknown {
  const cleaned = (text || "").replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // fall through
  }
  const arrMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrMatch) {
    try {
      return JSON.parse(arrMatch[0]);
    } catch {
      /* fall through */
    }
  }
  const objMatch = cleaned.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try {
      return JSON.parse(objMatch[0]);
    } catch {
      /* fall through */
    }
  }
  return null;
}

function normalizeDetails(parsed: unknown): Details | null {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const p = parsed as Record<string, unknown>;
  const nested = typeof p.description === "string" ? safeParse(p.description) : null;
  const source =
    nested && typeof nested === "object" && !Array.isArray(nested)
      ? { ...p, ...(nested as Record<string, unknown>) }
      : p;
  const description = typeof source.description === "string" ? source.description.trim() : "";
  return {
    name: typeof source.name === "string" ? source.name.trim() : "",
    neighborhood: typeof source.neighborhood === "string" ? source.neighborhood.trim() : "",
    description,
    tags: Array.isArray(source.tags)
      ? source.tags.filter((t) => typeof t === "string" && t.trim()).slice(0, 5)
      : [],
    specials: typeof source.specials === "string" ? source.specials.trim() : "",
  };
}

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      spotId?: string;
      prompt?: string;
      forceRefresh?: boolean;
    };
    const { spotId, prompt, forceRefresh = false } = body;

    let existingSpot: Record<string, unknown> | null = null;
    let docRef: FirebaseFirestore.DocumentReference | null = null;
    let db: FirebaseFirestore.Firestore | null = null;

    if (spotId) {
      db = ensureAdmin();
      if (!db) {
        return NextResponse.json({ error: "Server is missing Firebase credentials" }, { status: 500 });
      }
      docRef = db.collection(DOC_PATH.collection).doc(DOC_PATH.doc);
      const snapshot = await docRef.get();
      const data = snapshot.data();
      const spots = (data?.spots as Array<Record<string, unknown>>) || [];
      existingSpot = spots.find((s) => s.id === spotId) || null;

      if (!existingSpot) {
        return NextResponse.json({ error: "Spot not found" }, { status: 404 });
      }

      if (existingSpot.detailsFetched && isUsefulDescription(existingSpot.description) && !forceRefresh) {
        return NextResponse.json({ result: existingSpot });
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    let geminiResponse: Response;
    try {
      geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${
          process.env.GEMINI_MODEL || "gemini-3.5-flash-lite"
        }:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": process.env.GEMINI_API_KEY || "",
          },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          signal: controller.signal,
        },
      );
    } finally {
      clearTimeout(timeoutId);
    }

    const geminiData = await geminiResponse.json();

    if (!geminiResponse.ok) {
      console.error("Gemini error:", geminiData);
      return NextResponse.json(
        { error: geminiData?.error?.message || "Gemini request failed" },
        { status: geminiResponse.status },
      );
    }

    const rawText =
      geminiData?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("\n") || "";

    const parsed = safeParse(rawText);

    if (!spotId) {
      if (Array.isArray(parsed)) {
        const suggestions = parsed.map(normalizeDetails).filter((s) => s && isSearchEnrichmentOk(s));
        if (suggestions.length === 0) {
          return NextResponse.json({ error: "No usable description returned. Please try again." }, { status: 422 });
        }
        return NextResponse.json({ result: suggestions });
      }
      const suggestion = normalizeDetails(parsed);
      if (!isSearchEnrichmentOk(suggestion)) {
        return NextResponse.json({ error: "No usable description returned. Please try again." }, { status: 422 });
      }
      return NextResponse.json({ result: suggestion });
    }

    const details = normalizeDetails(parsed);
    if (!details || !isUsefulDescription(details.description)) {
      return NextResponse.json({ error: "No usable description returned. Please try again." }, { status: 422 });
    }

    let mergedSpot: Record<string, unknown>;
    try {
      mergedSpot = await (db as FirebaseFirestore.Firestore).runTransaction(async (tx) => {
        const freshSnap = await tx.get(docRef as FirebaseFirestore.DocumentReference);
        const freshSpots = (freshSnap.data()?.spots as Array<Record<string, unknown>>) || [];
        const freshExisting = freshSpots.find((s) => s.id === spotId);
        if (!freshExisting) {
          throw new Error("SPOT_REMOVED");
        }
        const merged = {
          ...freshExisting,
          neighborhood: details.neighborhood || freshExisting.neighborhood,
          description: details.description,
          tags: details.tags && details.tags.length ? details.tags : freshExisting.tags,
          specials: details.specials || freshExisting.specials,
          detailsFetched: true,
          lastUpdated: new Date().toISOString(),
        };
        const updatedSpots = freshSpots.map((s) => (s.id === spotId ? merged : s));
        tx.update(docRef as FirebaseFirestore.DocumentReference, { spots: updatedSpots });
        return merged;
      });
    } catch (txError) {
      if ((txError as Error).message === "SPOT_REMOVED") {
        return NextResponse.json({ error: "Spot not found" }, { status: 404 });
      }
      throw txError;
    }

    return NextResponse.json({ result: mergedSpot });
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      console.error("Gemini request timed out");
      return NextResponse.json({ error: "Gemini request timed out" }, { status: 504 });
    }
    console.error("Server error:", error);
    return NextResponse.json({ error: (error as Error).message || "Failed to generate details" }, { status: 500 });
  }
}
