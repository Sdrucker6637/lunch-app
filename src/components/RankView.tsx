"use client";

import { useEffect, useMemo, useState } from "react";
import { useLunch } from "@/lib/lunch-context";
import { avgScore, fmt } from "@/lib/scoring";
import { duelDecidedSpotIds, pendingDuelPairs } from "@/lib/ranking";
import SpotCard from "./SpotCard";
import TabIntro from "./TabIntro";
import EmptyState from "./EmptyState";
import DuelModal from "./modals/DuelModal";
import { addBtnCls, inputCls, kickerCls, chipCls } from "@/lib/ui";
import Icon from "./Icon";

// Session-scoped: the Taste-Off modal auto-opens the first time an
// unresolved tie is seen, but never re-pops on its own after dismissal.
let autoDuelPrompted = false;

export default function RankView() {
  const { filteredVisited, search, setSearch, fetchingIds, startManualAdd, editVisited, removeSpot, toggleDisqualify, rankingDuels, recordDuel } =
    useLunch();

  const rankedEntries = useMemo(() => filteredVisited.map((s) => ({ item: s, score: avgScore(s) })), [filteredVisited]);
  const pendingPairs = useMemo(() => pendingDuelPairs(rankedEntries, rankingDuels), [rankedEntries, rankingDuels]);
  const duelDecidedIds = useMemo(() => duelDecidedSpotIds(rankedEntries, rankingDuels), [rankedEntries, rankingDuels]);

  const [duelOpen, setDuelOpen] = useState(false);

  useEffect(() => {
    if (pendingPairs.length > 0 && !autoDuelPrompted) {
      autoDuelPrompted = true;
      setDuelOpen(true);
    }
  }, [pendingPairs.length]);

  const champ = filteredVisited.length > 0 ? filteredVisited[0] : null;
  const champScore = champ ? avgScore(champ) : null;

  return (
    <div>
      <TabIntro
        title="Today's Rankings"
        sub="Every spot you've rated, ranked by average score across vibe, value, service, food, and distance from the office."
      />

      {champ && (
        <div className="relative mb-8 overflow-hidden rounded-3xl border-2 border-sunny-600/30 bg-white">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(75%_120%_at_15%_-10%,rgba(255,201,60,0.16),transparent_60%)]"
          />
          <div className="relative flex flex-col gap-5 px-6 py-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-8 sm:py-7">
            <div className="min-w-0">
              <div className="flex items-center gap-2 font-display text-[0.72rem] font-bold uppercase tracking-[0.1em] text-sunny-600">
                <Icon name="trophy" size={14} />
                Today's Top Pick
              </div>
              <div className="mt-2.5 font-display text-2xl font-extrabold leading-tight text-ink sm:text-[1.9rem]">{champ.name}</div>
              <div className="mt-1.5 text-[0.88rem] italic text-ink-soft">The office favorite, for now.</div>
              {champ.neighborhood && (
                <div className="mt-3 font-display text-[0.68rem] font-bold uppercase tracking-[0.1em] text-ink-faint">{champ.neighborhood}</div>
              )}
            </div>
            <div className="flex-shrink-0 sm:self-center">
              <div className="min-w-[136px] rounded-2xl border-2 border-sunny-600/25 bg-sunny-100 px-5 py-4 text-center">
                <div className="font-display text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-faint">Score</div>
                <div className="mt-1.5 font-mono text-4xl font-bold leading-none text-coral">{fmt(champScore)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <button className={addBtnCls} onClick={() => startManualAdd("visited")}>
        + Add a spot you tried &amp; rate it
      </button>

      <div className={`${kickerCls} mt-6 mb-2`}>Refine the list</div>
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border-2 border-ink/5 bg-white px-4 py-3.5 shadow-card">
        <input className={inputCls} placeholder="Search name, neighborhood, notes…" value={search} onChange={(e) => setSearch(e.target.value)} />
        {pendingPairs.length > 0 && (
          <button className={`${chipCls} !border-coral/60 !text-coral hover:!border-coral`} onClick={() => setDuelOpen(true)}>
            <Icon name="swords" size={12} />
            Settle {pendingPairs.length} tie{pendingPairs.length === 1 ? "" : "s"}
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-2.5">
        {filteredVisited.length === 0 && (
          <EmptyState icon={<Icon name="search" size={15} />} title="No spots match that search yet." hint="Try a different name or neighborhood" />
        )}
        {(() => {
          let rankCounter = 0;
          return filteredVisited.map((s) => {
            const ranked = !s.disqualified;
            if (ranked) rankCounter++;
            return (
              <SpotCard
                key={s.id}
                s={s}
                rank={ranked ? rankCounter : null}
                score={avgScore(s)}
                duelDecided={duelDecidedIds.has(s.id)}
                isFetching={fetchingIds.has(s.id)}
                onNameClick={() => {
                  if (s.mapsLink) window.open(s.mapsLink, "_blank");
                }}
                onEdit={() => editVisited(s)}
                onDelete={() => removeSpot(s.id)}
                onDisqualify={() => toggleDisqualify(s)}
              />
            );
          });
        })()}
      </div>

      {duelOpen && <DuelModal pairs={pendingPairs} onResolve={recordDuel} onClose={() => setDuelOpen(false)} />}
    </div>
  );
}
