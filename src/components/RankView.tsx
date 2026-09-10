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
        <div className="relative mb-9 overflow-hidden rounded-ticket border-[3px] border-ink bg-paper-50 shadow-stamp-lg">
          <div aria-hidden="true" className="lr-sunburst pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full opacity-70" />
          <div className="relative flex flex-col gap-6 px-6 py-7 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-9 sm:py-8">
            <div className="min-w-0">
              <div className="inline-flex -rotate-2 items-center gap-1.5 rounded-full border-2 border-ink bg-yolk px-3 py-1 font-display text-[0.7rem] tracking-[0.08em] text-ink">
                <Icon name="star" size={12} filled />
                TODAY&apos;S CHAMPION
              </div>
              <div className="mt-3 font-display text-[2.1rem] leading-[1.02] tracking-wide text-ink sm:text-[2.6rem]">{champ.name}</div>
              <div className="mt-1.5 font-display text-[0.85rem] tracking-wide text-ink-faint">NOTHING ELSE COMES CLOSE</div>
              {champ.neighborhood && (
                <div className="mt-3 inline-block rounded-full border-2 border-ink bg-paper-100 px-3 py-1 font-display text-[0.68rem] tracking-wide text-ink-soft">
                  {champ.neighborhood}
                </div>
              )}
            </div>
            <div className="flex-shrink-0 sm:self-center">
              <div className="flex h-28 w-28 rotate-[-4deg] flex-col items-center justify-center rounded-full border-[3px] border-ink bg-chili text-center shadow-stamp">
                <span className="font-display text-[2.1rem] leading-none text-paper-50">{fmt(champScore)}</span>
                <span className="mt-1 font-display text-[0.6rem] tracking-wide text-paper-100">SCORE</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <button className={addBtnCls} onClick={() => startManualAdd("visited")}>
        + Add a spot you tried &amp; rate it
      </button>

      <div className={`${kickerCls} mt-7 mb-2`}>REFINE THE LIST</div>
      <div className="mb-4 flex flex-col gap-3 rounded-ticket border-[2.5px] border-ink bg-paper-50 px-4 py-3.5 shadow-stamp-sm">
        <input className={inputCls} placeholder="Search name, neighborhood, notes…" value={search} onChange={(e) => setSearch(e.target.value)} />
        {pendingPairs.length > 0 && (
          <button className={`${chipCls} !bg-yolk`} onClick={() => setDuelOpen(true)}>
            <Icon name="swords" size={12} />
            Settle {pendingPairs.length} tie{pendingPairs.length === 1 ? "" : "s"}
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {filteredVisited.length === 0 && (
          <EmptyState icon={<Icon name="search" size={17} />} title="No spots match that search yet." hint="Try a different name or neighborhood" />
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
