"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { FormEvent, ReactNode } from "react";
import { db, firebaseConfigured } from "./firebase";
import { base, DOC_PATH, emptyVisitedForm, emptyWishForm, MAX_WALK_MINUTES } from "./constants";
import { avgScore } from "./scoring";
import { pendingDuelPairs } from "./ranking";
import { callGemini } from "./gemini";
import { buildEnrichmentPrompt, DETAIL_FETCH_CONCURRENCY, isSearchEnrichmentOk, needsEnrichment } from "./enrichment";
import { fetchRestaurants, fetchExploreSuggestions, fetchSurpriseSpot } from "./places";
import type { PlaceResult, RankingDuel, Spot, VisitedForm, WishForm } from "./types";

const newSpotId = () => `s${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const newDuelId = () => `duel${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export interface PlacesModalState {
  suggestion: PlaceResult;
  results: PlaceResult[];
  searching: boolean;
}

interface LunchContextValue {
  spots: Spot[] | null;
  loading: boolean;
  connError: boolean;
  saveError: boolean;
  firebaseConfigured: boolean;
  visited: Spot[];
  toTry: Spot[];
  filteredVisited: Spot[];
  filteredToTry: Spot[];
  fetchingIds: Set<string>;

  rankingDuels: RankingDuel[];
  recordDuel: (spot1Id: string, spot2Id: string, winnerId: string) => Promise<boolean>;

  search: string;
  setSearch: (s: string) => void;

  exploreQuery: string;
  setExploreQuery: (s: string) => void;
  searchResults: PlaceResult[];
  searching: boolean;
  searchDone: boolean;
  enrichingNames: Set<string>;
  runExplore: () => Promise<void>;
  runSurprise: () => Promise<void>;
  addSuggestionToWishlist: (s: PlaceResult) => void;
  rankSuggestion: (s: PlaceResult) => void;

  startManualAdd: (type: "visited" | "wishlist") => void;
  markVisited: (s: Spot) => void;
  editVisited: (s: Spot) => void;
  removeSpot: (id: string) => void;
  toggleDisqualify: (s: Spot) => void;

  showVisitedForm: boolean;
  setShowVisitedForm: (b: boolean) => void;
  visitedForm: VisitedForm;
  setVisitedForm: (f: VisitedForm) => void;
  visitedSuggestion: PlaceResult | null;
  showWishForm: boolean;
  setShowWishForm: (b: boolean) => void;
  wishForm: WishForm;
  setWishForm: (f: WishForm) => void;
  showVisitedNamePrompt: boolean;
  setShowVisitedNamePrompt: (b: boolean) => void;
  visitedNameInput: string;
  setVisitedNameInput: (s: string) => void;
  visitedHoodInput: string;
  setVisitedHoodInput: (s: string) => void;
  showInfo: boolean;
  setShowInfo: (b: boolean) => void;
  placesModal: PlacesModalState | null;
  setPlacesModal: (m: PlacesModalState | null) => void;
  startPlacesLookup: (s: Partial<PlaceResult> & { name: string }) => Promise<void>;
  confirmPlaceSelection: (r: Partial<PlaceResult>) => void;
  saveVisitedForm: (e: FormEvent) => Promise<void>;
  saveWishForm: (e: FormEvent) => Promise<void>;
}

const LunchContext = createContext<LunchContextValue | null>(null);

export function useLunch(): LunchContextValue {
  const ctx = useContext(LunchContext);
  if (!ctx) throw new Error("useLunch must be used within LunchProvider");
  return ctx;
}

const normalizeVenueName = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

function sameVenue(a: { name: string; placeId?: string | null }, b: { name: string; placeId?: string | null }): boolean {
  if (a.placeId && b.placeId && a.placeId === b.placeId) return true;
  const na = normalizeVenueName(a.name);
  const nb = normalizeVenueName(b.name);
  return na.length > 0 && na === nb;
}

export function LunchProvider({ children }: { children: ReactNode }) {
  const [spots, setSpots] = useState<Spot[] | null>(null);
  const [rankingDuels, setRankingDuels] = useState<RankingDuel[]>([]);
  const [loading, setLoading] = useState(true);
  const [connError, setConnError] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [fetchingIds, setFetchingIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const [exploreQuery, setExploreQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchDone, setSearchDone] = useState(false);
  const [enrichingNames, setEnrichingNames] = useState<Set<string>>(new Set());
  const seenNames = useRef<Set<string>>(new Set());

  const [showVisitedForm, setShowVisitedForm] = useState(false);
  const [visitedForm, setVisitedForm] = useState<VisitedForm>(emptyVisitedForm);
  const [visitedSuggestion, setVisitedSuggestion] = useState<PlaceResult | null>(null);
  const [showWishForm, setShowWishForm] = useState(false);
  const [wishForm, setWishForm] = useState<WishForm>(emptyWishForm);
  const [showVisitedNamePrompt, setShowVisitedNamePrompt] = useState(false);
  const [visitedNameInput, setVisitedNameInput] = useState("");
  const [visitedHoodInput, setVisitedHoodInput] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [placesModal, setPlacesModal] = useState<PlacesModalState | null>(null);

  const spotsRef = useRef<Spot[]>([]);
  const rankingDuelsRef = useRef<RankingDuel[]>([]);
  useEffect(() => {
    spotsRef.current = spots || [];
  }, [spots]);
  useEffect(() => {
    rankingDuelsRef.current = rankingDuels;
  }, [rankingDuels]);

  const docRef = useMemo(() => (db ? db.collection(DOC_PATH.collection).doc(DOC_PATH.doc) : null), []);

  // ---- boot & realtime sync ----
  useEffect(() => {
    if (!docRef) {
      setLoading(false);
      return;
    }
    // Firestore's onSnapshot error callback doesn't always fire promptly for
    // every failure mode (e.g. a project that doesn't exist can hang rather
    // than erroring) — without a bound, the loading screen would spin
    // forever instead of surfacing a connection problem.
    const timeout = window.setTimeout(() => {
      setLoading((wasLoading) => {
        if (wasLoading) setConnError(true);
        return false;
      });
    }, 10000);
    const unsub = docRef.onSnapshot(
      async (snap) => {
        window.clearTimeout(timeout);
        if (!snap.exists) {
          try {
            await db!.runTransaction(async (tx) => {
              const fresh = await tx.get(docRef);
              if (!fresh.exists) {
                tx.set(docRef, { spots: [], rankingDuels: [] });
              }
            });
          } catch (e) {
            console.error("seed failed", e);
          }
          setLoading(false);
          return;
        }
        const data = snap.data() || {};
        setSpots((data.spots as Spot[]) || []);
        setRankingDuels((data.rankingDuels as RankingDuel[]) || []);
        setLoading(false);
        setConnError(false);
      },
      (err) => {
        window.clearTimeout(timeout);
        console.error("Firestore snapshot error", err);
        setConnError(true);
        setSpots([]);
        setLoading(false);
      },
    );
    return () => {
      window.clearTimeout(timeout);
      unsub();
    };
  }, [docRef]);

  // ---- auto-enrich saved spots missing a description ----
  const enrichAttempted = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!spots) return;
    const queue = spots.filter((s) => needsEnrichment(s) && !enrichAttempted.current.has(s.id));
    if (queue.length === 0) return;
    let idx = 0;
    const runNext = async () => {
      if (idx >= queue.length) return;
      const spot = queue[idx++];
      enrichAttempted.current.add(spot.id);
      setFetchingIds((prev) => new Set(prev).add(spot.id));
      try {
        const prompt = buildEnrichmentPrompt(spot);
        await callGemini(prompt, spot.id, false);
      } catch (e) {
        console.error("enrichment failed", e);
      } finally {
        setFetchingIds((prev) => {
          const next = new Set(prev);
          next.delete(spot.id);
          return next;
        });
      }
      await runNext();
    };
    const workers = Array.from({ length: Math.min(DETAIL_FETCH_CONCURRENCY, queue.length) }, () => runNext());
    Promise.all(workers).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spots]);

  // ---- derived lists ----
  const visited = useMemo(() => (spots || []).filter((s) => s.status === "visited"), [spots]);
  const toTry = useMemo(() => (spots || []).filter((s) => s.status === "to-try"), [spots]);

  const filteredVisited = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = visited;
    if (q) list = list.filter((s) => s.name.toLowerCase().includes(q) || s.neighborhood.toLowerCase().includes(q));
    const qualified = list.filter((s) => !s.disqualified);
    const disqualified = list.filter((s) => s.disqualified);
    return [...qualified, ...disqualified];
  }, [visited, search]);

  const filteredToTry = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return toTry;
    return toTry.filter((s) => s.name.toLowerCase().includes(q) || s.neighborhood.toLowerCase().includes(q));
  }, [toTry, search]);

  // ---- persistence helpers ----
  const persist = useCallback(
    async (updater: (current: Spot[]) => Spot[]) => {
      if (!docRef) return;
      const optimistic = updater(spotsRef.current);
      setSpots(optimistic);
      try {
        await db!.runTransaction(async (tx) => {
          const fresh = await tx.get(docRef);
          const freshSpots = (fresh.data()?.spots as Spot[]) || [];
          const next = updater(freshSpots);
          tx.update(docRef, { spots: next });
        });
        setSaveError(false);
      } catch (e) {
        console.error("persist failed", e);
        setSaveError(true);
      }
    },
    [docRef],
  );

  const updateSpotLocal = useCallback((id: string, patch: Partial<Spot>) => {
    persist((current) => current.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, [persist]);

  const removeSpot = useCallback(
    (id: string) => {
      persist((current) => current.filter((s) => s.id !== id));
    },
    [persist],
  );

  const toggleDisqualify = useCallback(
    (spot: Spot) => {
      if (spot.disqualified) {
        updateSpotLocal(spot.id, { disqualified: false });
        return;
      }
      const reason = window.prompt("Why disqualify this spot? (optional)") || "";
      updateSpotLocal(spot.id, { disqualified: true, disqualifyReason: reason, wasDisqualified: true });
    },
    [updateSpotLocal],
  );

  // ---- Taste-Off duels ----
  const recordDuel = useCallback(
    async (spot1Id: string, spot2Id: string, winnerId: string) => {
      if (!docRef) return false;
      const key = [spot1Id, spot2Id].sort().join("|");
      const duel: RankingDuel = { id: newDuelId(), spot1Id, spot2Id, winnerId, type: "score_tiebreak", createdAt: Date.now() };
      const optimistic = [...rankingDuelsRef.current.filter((d) => [d.spot1Id, d.spot2Id].sort().join("|") !== key), duel];
      setRankingDuels(optimistic);
      try {
        await db!.runTransaction(async (tx) => {
          const fresh = await tx.get(docRef);
          const freshDuels = (fresh.data()?.rankingDuels as RankingDuel[]) || [];
          const next = [...freshDuels.filter((d) => [d.spot1Id, d.spot2Id].sort().join("|") !== key), duel];
          tx.update(docRef, { rankingDuels: next });
        });
        return true;
      } catch (e) {
        console.error("recordDuel failed", e);
        setRankingDuels(rankingDuelsRef.current);
        return false;
      }
    },
    [docRef],
  );

  // ---- Explore ----
  const excludedNames = useCallback(() => {
    const saved = new Set((spots || []).map((s) => s.name));
    return Array.from(new Set([...saved, ...seenNames.current]));
  }, [spots]);

  const enrichResult = useCallback(async (result: PlaceResult) => {
    setEnrichingNames((prev) => new Set(prev).add(result.name));
    try {
      const prompt = buildEnrichmentPrompt(result);
      const info = await callGemini(prompt, null, false);
      if (isSearchEnrichmentOk(info as { description?: unknown })) {
        const d = info as { description: string; tags?: string[]; specials?: string; neighborhood?: string };
        setSearchResults((prev) =>
          prev.map((r) =>
            r.name === result.name
              ? { ...r, description: d.description, tags: d.tags || [], specials: d.specials || "", neighborhood: d.neighborhood || r.neighborhood }
              : r,
          ),
        );
      }
    } catch (e) {
      console.error("search enrichment failed", e);
    } finally {
      setEnrichingNames((prev) => {
        const next = new Set(prev);
        next.delete(result.name);
        return next;
      });
    }
  }, []);

  const runExplore = useCallback(async () => {
    setSearching(true);
    setSearchDone(false);
    try {
      const results = await fetchExploreSuggestions(exploreQuery, excludedNames());
      results.forEach((r) => seenNames.current.add(r.name));
      setSearchResults(results.map((r) => ({ ...r, _origin: "explore" })));
      results.forEach((r) => enrichResult(r));
    } finally {
      setSearching(false);
      setSearchDone(true);
    }
  }, [exploreQuery, excludedNames, enrichResult]);

  const runSurprise = useCallback(async () => {
    setSearching(true);
    setSearchDone(false);
    try {
      const result = await fetchSurpriseSpot(excludedNames());
      if (result) {
        seenNames.current.add(result.name);
        const tagged: PlaceResult = { ...result, _origin: "surprise" };
        setSearchResults([tagged]);
        enrichResult(tagged);
      } else {
        setSearchResults([]);
      }
    } finally {
      setSearching(false);
      setSearchDone(true);
    }
  }, [excludedNames, enrichResult]);

  // ---- add flows ----
  const startManualAdd = useCallback((type: "visited" | "wishlist") => {
    if (type === "wishlist") {
      setWishForm({ ...emptyWishForm });
      setShowWishForm(true);
    } else {
      setVisitedNameInput("");
      setVisitedHoodInput("");
      setShowVisitedNamePrompt(true);
    }
  }, []);

  const markVisited = useCallback((spot: Spot) => {
    setVisitedForm({
      id: spot.id,
      name: spot.name,
      vibe: spot.vibe?.toString() || "",
      value: spot.value?.toString() || "",
      service: spot.service?.toString() || "",
      food: spot.food?.toString() || "",
      notes: spot.notes || "",
    });
    setVisitedSuggestion({
      name: spot.name,
      address: spot.address,
      latitude: spot.latitude,
      longitude: spot.longitude,
      placeId: spot.placeId,
      mapsLink: spot.mapsLink,
      walkMinutes: spot.walkMinutes,
      walkMeters: spot.walkMeters,
    });
    setShowVisitedForm(true);
  }, []);

  const editVisited = markVisited;

  const startPlacesLookup = useCallback(
    async (s: Partial<PlaceResult> & { name: string }) => {
      setPlacesModal({ suggestion: s as PlaceResult, results: [], searching: true });
      const results = await fetchRestaurants(s.name, {
        neighborhood: s.neighborhood || "",
        address: s.address || "",
        exactLookup: true,
        limit: 5,
      });
      setPlacesModal({ suggestion: s as PlaceResult, results, searching: false });
    },
    [],
  );

  const confirmPlaceSelection = useCallback(
    (r: Partial<PlaceResult>) => {
      const modal = placesModal;
      setPlacesModal(null);
      const merged: PlaceResult = { ...(modal?.suggestion || { name: r.name || "" }), ...r };
      if (merged._placeIntent === "wishlist") {
        setWishForm((f) => ({ ...f, id: f.id, name: merged.name, neighborhood: merged.neighborhood || f.neighborhood }));
        addSuggestionToWishlistInternal(merged);
      } else {
        setVisitedForm((f) => ({ ...f, name: merged.name }));
        setVisitedSuggestion(merged);
        setShowVisitedForm(true);
      }
    },
    [placesModal],
  );

  const addSuggestionToWishlistInternal = useCallback(
    (s: PlaceResult) => {
      const existing = (spots || []).find((sp) => sameVenue(sp, s));
      if (existing) return;
      const spot: Spot = {
        ...base,
        id: newSpotId(),
        name: s.name,
        status: "to-try",
        vibe: null,
        value: null,
        service: null,
        food: null,
        walkMinutes: s.walkMinutes ?? null,
        walkMeters: s.walkMeters ?? null,
        notes: s.notes || "",
        neighborhood: s.neighborhood || "",
        address: s.address || "",
        latitude: s.latitude ?? null,
        longitude: s.longitude ?? null,
        placeId: s.placeId ?? null,
        mapsLink: s.mapsLink || "",
        types: s.types || [],
        description: s.description || "",
        tags: s.tags || [],
        specials: s.specials || "",
        detailsFetched: !!s.description,
        createdAt: Date.now(),
        origin: s._origin || "manual",
      };
      persist((current) => [...current, spot]);
    },
    [spots, persist],
  );

  const addSuggestionToWishlist = useCallback(
    (s: PlaceResult) => {
      startPlacesLookup({ ...s, _placeIntent: "wishlist" });
    },
    [startPlacesLookup],
  );

  const rankSuggestion = useCallback(
    (s: PlaceResult) => {
      setVisitedForm({ ...emptyVisitedForm, name: s.name });
      setVisitedSuggestion(s);
      setShowVisitedForm(true);
    },
    [],
  );

  const saveVisitedForm = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const f = visitedForm;
      const suggestion = visitedSuggestion;
      const num = (v: string) => (v.trim() === "" ? null : Number(v));
      setShowVisitedForm(false);

      if (f.id) {
        updateSpotLocal(f.id, {
          vibe: num(f.vibe),
          value: num(f.value),
          service: num(f.service),
          food: num(f.food),
          notes: f.notes,
        });
        return;
      }

      const wishTwin = (spots || []).find((sp) => sp.status === "to-try" && sameVenue(sp, { name: f.name, placeId: suggestion?.placeId }));

      const spot: Spot = {
        ...base,
        id: newSpotId(),
        name: f.name,
        status: "visited",
        vibe: num(f.vibe),
        value: num(f.value),
        service: num(f.service),
        food: num(f.food),
        walkMinutes: suggestion?.walkMinutes ?? wishTwin?.walkMinutes ?? null,
        walkMeters: suggestion?.walkMeters ?? wishTwin?.walkMeters ?? null,
        notes: f.notes,
        neighborhood: suggestion?.neighborhood || wishTwin?.neighborhood || "",
        address: suggestion?.address || wishTwin?.address || "",
        latitude: suggestion?.latitude ?? wishTwin?.latitude ?? null,
        longitude: suggestion?.longitude ?? wishTwin?.longitude ?? null,
        placeId: suggestion?.placeId ?? wishTwin?.placeId ?? null,
        mapsLink: suggestion?.mapsLink || wishTwin?.mapsLink || "",
        types: suggestion?.types || wishTwin?.types || [],
        description: wishTwin?.description || suggestion?.description || "",
        tags: wishTwin?.tags || suggestion?.tags || [],
        specials: wishTwin?.specials || suggestion?.specials || "",
        detailsFetched: !!(wishTwin?.description || suggestion?.description),
        createdAt: Date.now(),
        origin: suggestion?._origin || "manual",
        cameFromWishlist: !!wishTwin,
      };

      persist((current) => [...current.filter((sp) => !(wishTwin && sp.id === wishTwin.id)), spot]);
      setVisitedSuggestion(null);
    },
    [visitedForm, visitedSuggestion, spots, persist, updateSpotLocal],
  );

  const saveWishForm = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const f = wishForm;
      setShowWishForm(false);
      await startPlacesLookup({ name: f.name, neighborhood: f.neighborhood, notes: f.notes, _placeIntent: "wishlist" });
    },
    [wishForm, startPlacesLookup],
  );

  const value: LunchContextValue = {
    spots,
    loading,
    connError,
    saveError,
    firebaseConfigured,
    visited,
    toTry,
    filteredVisited,
    filteredToTry,
    fetchingIds,
    rankingDuels,
    recordDuel,
    search,
    setSearch,
    exploreQuery,
    setExploreQuery,
    searchResults,
    searching,
    searchDone,
    enrichingNames,
    runExplore,
    runSurprise,
    addSuggestionToWishlist,
    rankSuggestion,
    startManualAdd,
    markVisited,
    editVisited,
    removeSpot,
    toggleDisqualify,
    showVisitedForm,
    setShowVisitedForm,
    visitedForm,
    setVisitedForm,
    visitedSuggestion,
    showWishForm,
    setShowWishForm,
    wishForm,
    setWishForm,
    showVisitedNamePrompt,
    setShowVisitedNamePrompt,
    visitedNameInput,
    setVisitedNameInput,
    visitedHoodInput,
    setVisitedHoodInput,
    showInfo,
    setShowInfo,
    placesModal,
    setPlacesModal,
    startPlacesLookup,
    confirmPlaceSelection,
    saveVisitedForm,
    saveWishForm,
  };

  return <LunchContext.Provider value={value}>{children}</LunchContext.Provider>;
}

export { avgScore, pendingDuelPairs, MAX_WALK_MINUTES };
