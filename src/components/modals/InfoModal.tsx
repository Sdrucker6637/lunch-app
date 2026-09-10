"use client";

import { useLunch } from "@/lib/lunch-context";
import Modal from "./Modal";
import { primaryBtnCls } from "@/lib/ui";
import Icon from "../Icon";
import { MAX_WALK_MINUTES } from "@/lib/constants";

export default function InfoModal() {
  const { showInfo, setShowInfo } = useLunch();
  if (!showInfo) return null;

  return (
    <Modal onClose={() => setShowInfo(false)}>
      <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-yolk px-3 py-1 font-display text-[0.68rem] tracking-[0.08em] text-ink">
        <Icon name="ticket" size={12} /> HOW IT WORKS
      </div>
      <h3 className="mt-3 font-display text-xl tracking-wide text-ink">Lunch Radius, decoded</h3>
      <div className="mt-2.5 text-[0.92rem] leading-[1.55] text-ink-soft">
        Explore restaurants near the office, then add promising ones to your &ldquo;Want to Try&rdquo; list. Once
        you&apos;ve eaten there, tap &ldquo;I tried it&rdquo; and rate the experience — it moves into the rankings
        automatically. Every spot is verified against Google Places and checked with a real walking route from the
        office, so nothing over {MAX_WALK_MINUTES} minutes ever makes the list.
      </div>
      <div className="mt-4 flex flex-col gap-3">
        <div className="rounded-2xl border-2 border-ink bg-pickle-100 p-3.5">
          <b className="inline-flex items-center gap-2 font-display text-[0.82rem] tracking-wide text-pickle-600">
            <Icon name="walk" size={14} /> DISTANCE SCORE
          </b>
          <div className="mt-1.5 text-[0.85rem] leading-[1.55] text-ink-soft">
            Unlike the other categories, Distance isn&apos;t something you rate — it&apos;s stamped automatically
            from the real walking time from the office. Closer means a higher score.
          </div>
        </div>
        <div className="rounded-2xl border-2 border-ink bg-yolk-100 p-3.5">
          <b className="inline-flex items-center gap-2 font-display text-[0.82rem] tracking-wide text-ink">
            <Icon name="swords" size={14} /> TASTE-OFF
          </b>
          <div className="mt-1.5 text-[0.85rem] leading-[1.55] text-ink-soft">
            When two spots tie on score, a quick head-to-head pick decides who ranks higher. Scores never change —
            it only breaks ties.
          </div>
        </div>
      </div>
      <div className="mt-5 flex gap-2.5">
        <button className={primaryBtnCls} onClick={() => setShowInfo(false)}>
          Got it
        </button>
      </div>
    </Modal>
  );
}
