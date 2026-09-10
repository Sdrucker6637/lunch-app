"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Spot } from "@/lib/types";
import { avgScore, fmt } from "@/lib/scoring";
import { HEAT_GRADIENTS, HEAT_DOT_COLOR, DEFAULT_OFFICE } from "@/lib/constants";
import { chipCls, chipActiveCls } from "@/lib/ui";

interface MapViewProps {
  spots: Spot[];
}

function lerpHex(a: string, b: string, f: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (sh: number, dh: number) => Math.round(sh + (dh - sh) * f);
  const r = ch((pa >> 16) & 255, (pb >> 16) & 255);
  const g = ch((pa >> 8) & 255, (pb >> 8) & 255);
  const bl = ch(pa & 255, pb & 255);
  return `#${((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1)}`;
}

function colorAtGradient(stops: Array<[number, string]>, t: number): string {
  if (t <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const [t0, c0] = stops[i - 1];
      const [t1, c1] = stops[i];
      return lerpHex(c0, c1, (t - t0) / (t1 - t0));
    }
  }
  return stops[stops.length - 1][1];
}

type LNamespace = {
  map: (
    el: HTMLElement,
    opts?: Record<string, unknown>,
  ) => {
    setView: (center: [number, number], zoom: number) => unknown;
    fitBounds: (bounds: unknown, opts?: unknown) => unknown;
    getZoom: () => number;
    invalidateSize: () => unknown;
    remove: () => void;
  };
  tileLayer: (url: string, opts?: Record<string, unknown>) => { addTo: (map: unknown) => unknown };
  heatLayer: (points: Array<[number, number, number]>, opts?: Record<string, unknown>) => { addTo: (map: unknown) => unknown };
  circleMarker: (latlng: [number, number], opts?: Record<string, unknown>) => { addTo: (map: unknown) => { bindPopup: (html: string) => unknown } };
  marker: (latlng: [number, number], opts?: Record<string, unknown>) => { addTo: (map: unknown) => { bindPopup: (html: string) => unknown } };
  divIcon: (opts: Record<string, unknown>) => unknown;
  latLngBounds: (points: Array<[number, number]>) => { pad: (n: number) => unknown; extend: (p: [number, number]) => unknown };
};

let heatPluginPromise: Promise<void> | null = null;
function loadHeatPlugin(): Promise<void> {
  if (!heatPluginPromise) {
    heatPluginPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js";
      s.dataset.leafletHeat = "true";
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Failed to load leaflet.heat"));
      document.head.appendChild(s);
    });
  }
  return heatPluginPromise;
}

export default function MapView({ spots }: MapViewProps) {
  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const [mode, setMode] = useState<"visited" | "wishlist">("visited");
  const [office, setOffice] = useState<{ latitude: number; longitude: number; address: string }>(DEFAULT_OFFICE);

  useEffect(() => {
    fetch("/api/office")
      .then((r) => r.json())
      .then((o) => setOffice(o))
      .catch(() => {});
  }, []);

  const visitedGeo = useMemo(
    () => spots.filter((s) => s.status === "visited" && !s.disqualified && Number.isFinite(s.latitude) && Number.isFinite(s.longitude)),
    [spots],
  );
  const wishlistGeo = useMemo(
    () => spots.filter((s) => s.status === "to-try" && Number.isFinite(s.latitude) && Number.isFinite(s.longitude)),
    [spots],
  );
  const geoSpots = mode === "visited" ? visitedGeo : wishlistGeo;

  useEffect(() => {
    const node = mapNodeRef.current;
    if (!node) return;
    let cancelled = false;
    let cleanup: (() => void) | null = null;

    Promise.all([import("leaflet"), import("leaflet/dist/leaflet.css")]).then(async ([leafletMod]) => {
      if (cancelled || !mapNodeRef.current) return;
      const mod = leafletMod as unknown as { default: LNamespace };
      const L = mod.default;
      (window as unknown as Record<string, unknown>).L = L;
      let heatOk = false;
      try {
        await loadHeatPlugin();
        heatOk = true;
      } catch (e) {
        console.error("[map] heat plugin unavailable", e);
      }
      if (cancelled || !node.isConnected) return;

      const map = L.map(node, { scrollWheelZoom: true }).setView([office.latitude, office.longitude], 15) as unknown as {
        fitBounds: (b: unknown, o?: unknown) => void;
        getZoom: () => number;
        invalidateSize: () => void;
        remove: () => void;
      };

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
        maxZoom: 19,
      }).addTo(map);

      // Office marker — the fixed anchor every walk time is measured from.
      const officeIcon = L.divIcon({
        html: `<div style="width:24px;height:24px;border-radius:999px;background:#FF4321;border:3px solid #201A14;box-shadow:2px 2px 0 0 #201A14;"></div>`,
        className: "",
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      L.marker([office.latitude, office.longitude], { icon: officeIcon }).addTo(map).bindPopup(`<b>Office</b><br/>${office.address}`);

      if (geoSpots.length === 0) {
        setTimeout(() => map.invalidateSize(), 100);
        cleanup = () => map.remove();
        return;
      }

      const rawScores = geoSpots.map((s) => avgScore(s));
      const scored = rawScores.filter((s): s is number => s !== null);
      const minScore = scored.length > 0 ? Math.min(...scored) : 5;
      const maxScore = scored.length > 0 ? Math.max(...scored) : 5;
      const span = maxScore - minScore;
      const tFor = (i: number) => {
        if (rawScores[i] === null) return 0.5;
        return span > 0.001 ? (rawScores[i]! - minScore) / span : 0.5;
      };

      const points = geoSpots.map((s, i) => {
        if (mode === "visited") return [s.latitude, s.longitude, 0.25 + tFor(i) * 0.75] as [number, number, number];
        return [s.latitude, s.longitude, 0.6] as [number, number, number];
      });

      const bounds = L.latLngBounds([[office.latitude, office.longitude], ...geoSpots.map((s) => [s.latitude as number, s.longitude as number] as [number, number])]);
      map.fitBounds(bounds, { padding: [40, 40] });
      if (heatOk && (L as LNamespace).heatLayer) {
        L.heatLayer(points, { radius: 30, blur: 22, maxZoom: map.getZoom(), gradient: HEAT_GRADIENTS[mode] }).addTo(map);
      }

      const gradientStops = Object.entries(HEAT_GRADIENTS[mode]) as Array<[string, string]>;
      const stops = gradientStops.map(([stop, color]) => [Number(stop), color] as [number, string]).sort((a, b) => a[0] - b[0]);
      geoSpots.forEach((s, i) => {
        const score = avgScore(s);
        const scoreLine =
          mode === "visited" ? `<div>${fmt(score)} avg</div>` : `<div style="opacity:0.6">Want to try</div>`;
        const dotColor = mode === "visited" ? colorAtGradient(stops, tFor(i)) : HEAT_DOT_COLOR[mode];
        L.circleMarker([s.latitude as number, s.longitude as number], {
          radius: 7,
          color: "#201A14",
          weight: 2,
          fillColor: dotColor,
          fillOpacity: 1,
        })
          .addTo(map)
          .bindPopup(`<div style="font-weight:700">${s.name}</div>${scoreLine}`);
      });

      setTimeout(() => map.invalidateSize(), 100);
      cleanup = () => map.remove();
    });

    return () => {
      cancelled = true;
      if (cleanup) cleanup();
    };
  }, [geoSpots, mode, office]);

  return (
    <div>
      <div className="relative">
        <div ref={mapNodeRef} className="lr-heatmap-container" />
        <div className="absolute right-3 top-3 z-[1000] inline-flex gap-1 rounded-full border-2 border-ink bg-paper-50/95 p-1 shadow-stamp-sm backdrop-blur-sm">
          <button className={`${chipCls} !border-0 !shadow-none !px-2.5 !py-1 ${mode === "visited" ? chipActiveCls : ""}`} onClick={() => setMode("visited")}>
            Rated
          </button>
          <button className={`${chipCls} !border-0 !shadow-none !px-2.5 !py-1 ${mode === "wishlist" ? chipActiveCls : ""}`} onClick={() => setMode("wishlist")}>
            Want to Try
          </button>
        </div>
      </div>
      <div className="mt-4 font-display text-[0.78rem] tracking-wide text-ink-faint">
        {geoSpots.length} SPOT{geoSpots.length === 1 ? "" : "S"} PLOTTED AROUND THE OFFICE
      </div>
      <div className="mt-2.5 flex items-center gap-2.5 font-display text-[0.7rem] tracking-wide text-ink-faint">
        LOWER SCORE
        <span
          className="h-2.5 w-[120px] rounded-full border-2 border-ink"
          style={{ background: `linear-gradient(90deg, ${Object.values(HEAT_GRADIENTS[mode]).join(",")})` }}
        />
        {mode === "visited" ? "TOP RATED" : "DENSER CLUSTER"}
      </div>
    </div>
  );
}
