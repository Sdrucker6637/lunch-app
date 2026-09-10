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
      <h3 className="mt-0 font-display text-lg font-bold text-ink">How Lunch Radius works</h3>
      <div className="mt-2.5 text-[0.92rem] leading-[1.55] text-ink-soft">
        Explore restaurants near the office, then add promising ones to your &ldquo;Want to Try&rdquo; list. Once
        you&apos;ve eaten there, tap &ldquo;I tried it&rdquo; and rate the experience — it moves into the rankings
        automatically. Every spot is verified against Google Places and checked with a real walking route from the
        office, so nothing over {MAX_WALK_MINUTES} minutes ever makes the list.
      </div>
      <div className="mt-3.5 flex flex-col gap-3 text-[0.85rem] text-ink-soft">
        <div>
          <b className="inline-flex items-center gap-2 text-coral">
            <Icon name="walk" size={14} /> Distance score
          </b>
          <div className="mt-1 leading-[1.55]">
            Unlike the other categories, Distance isn&apos;t something you rate — it&apos;s calculated automatically
            from the real walking time from the office. Closer means a higher score.
          </div>
        </div>
        <div>
          <b className="inline-flex items-center gap-2 text-coral">
            <Icon name="swords" size={14} /> Taste-Off
          </b>
          <div className="mt-1 leading-[1.55]">
            When two spots tie on score, a quick head-to-head pick decides who ranks higher. Scores never change —
            it only breaks ties.
          </div>
        </div>
      </div>
      <div className="mt-4 flex gap-2.5">
        <button className={primaryBtnCls} onClick={() => setShowInfo(false)}>
          Got it
        </button>
      </div>
    </Modal>
  );
}
