"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import type { Spot } from "@/lib/types";
import { fmt, fmtWalk, distanceScore } from "@/lib/scoring";
import { displayDescription } from "@/lib/parse";
import { ghostBtnCls, ghostBtnGreenCls, dqBtnCls, removeBtnCls, secondaryBtnCls, tagCls, cardHoverCls } from "@/lib/ui";
import Modal from "./modals/Modal";
import Icon from "./Icon";

interface SpotCardProps {
  s: Spot;
  rank?: number | null;
  score?: number | null;
  duelDecided?: boolean;
  isFetching?: boolean;
  onNameClick?: () => void;
  onEdit: () => void;
  editLabel?: string;
  onDelete: () => void;
  onDisqualify?: () => void;
}

function ScoreCell({ label, value, isDistance }: { label: string; value: number | null; isDistance?: boolean }) {
  const strong = value !== null && value >= 8.5;
  return (
    <div className="flex flex-col items-center gap-1 bg-paper-50 px-1 py-2.5 text-center">
      <span className={`font-mono text-[1.05rem] font-bold leading-none ${strong ? "text-chili" : "text-ink"}`}>{fmt(value)}</span>
      <span className="flex items-center gap-0.5 font-display text-[0.56rem] tracking-wide text-ink-faint">
        {isDistance && <Icon name="walk" size={9} />}
        {label}
      </span>
    </div>
  );
}

const RANK_MEDAL: Record<number, { fill: string; label: string }> = {
  1: { fill: "bg-yolk", label: "1ST" },
  2: { fill: "bg-paper-200", label: "2ND" },
  3: { fill: "bg-chili-100", label: "3RD" },
};

export default function SpotCard({ s, rank, score, duelDecided, isFetching, onNameClick, onEdit, editLabel, onDelete, onDisqualify }: SpotCardProps) {
  const isWishlist = s.status === "to-try";
  const cleanDesc = displayDescription(s.description);
  const isLong = !!cleanDesc && cleanDesc.length > 140;
  const [expanded, setExpanded] = useState(false);
  const showRemove = isWishlist || s.status === "visited";
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  const descText = isLong && !expanded ? cleanDesc.slice(0, 140) + "…" : cleanDesc;
  const medal = rank ? RANK_MEDAL[rank] : undefined;

  const railColor = s.disqualified ? "bg-ink/15" : isWishlist ? "bg-pickle" : rank === 1 ? "bg-yolk" : rank === 2 ? "bg-ink/25" : rank === 3 ? "bg-chili-300" : "bg-ink/15";

  return (
    <div
      className={`relative overflow-hidden rounded-ticket border-[2.5px] bg-paper-50 py-5 pl-6 pr-5 shadow-stamp ${cardHoverCls} ${
        s.disqualified ? "border-ink/40 opacity-70" : "border-ink"
      } ${rank === 1 ? "border-[3px]" : ""}`}
    >
      <span className={`absolute inset-y-0 left-0 w-2 ${railColor}`} aria-hidden="true" />

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {rank ? (
            <span
              className={`relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-[2.5px] border-ink font-display text-[1.15rem] ${
                medal ? `${medal.fill} text-ink shadow-stamp-sm` : "bg-paper-100 text-ink-soft"
              }`}
            >
              {rank}
              {medal && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 rotate-[-4deg] rounded-full border border-ink bg-paper-50 px-1 font-display text-[0.5rem] tracking-wide text-ink">
                  {medal.label}
                </span>
              )}
            </span>
          ) : s.disqualified ? (
            <span className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-ink/30 font-display text-[0.68rem] text-ink-faint">
              N/A
            </span>
          ) : null}

          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-2">
              <div className="min-w-0 cursor-pointer truncate font-display text-[1.25rem] tracking-wide text-ink hover:text-chili" onClick={onNameClick}>
                {s.mapsLink ? (
                  <a href={s.mapsLink} target="_blank" rel="noreferrer" className="text-inherit no-underline" onClick={(e) => e.stopPropagation()}>
                    {s.name}
                  </a>
                ) : (
                  s.name
                )}
              </div>
              {isWishlist && (
                <span className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-pickle-100 px-2 py-[1px] font-display text-[0.6rem] tracking-wide text-pickle-600">
                  ★ WANT TO TRY
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {s.neighborhood && <span className="font-display text-[0.78rem] tracking-wide text-chili">{s.neighborhood}</span>}
              {s.walkMinutes != null && (
                <span className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-pickle-100 px-2 py-[1px] font-display text-[0.7rem] tracking-wide text-pickle-600">
                  <Icon name="walk" size={10} /> {fmtWalk(s.walkMinutes)}
                </span>
              )}
            </div>
          </div>
        </div>

        {score !== undefined && score !== null && (
          <div
            className={`relative flex-shrink-0 flex h-16 w-16 flex-col items-center justify-center rounded-full border-[3px] border-ink text-center ${
              s.disqualified ? "bg-paper-200" : "bg-chili"
            } rotate-[-6deg] shadow-stamp-sm`}
          >
            {duelDecided && !s.disqualified && (
              <span
                title="Position decided by a Taste-Off"
                aria-label="Position decided by a Taste-Off"
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 rotate-[6deg] items-center justify-center rounded-full border-2 border-ink bg-yolk text-ink"
              >
                <Icon name="swords" size={10} />
              </span>
            )}
            <span className={`font-display text-[1.35rem] leading-none rotate-[6deg] ${s.disqualified ? "text-ink-faint" : "text-paper-50"}`}>
              {s.disqualified ? "N/A" : fmt(score)}
            </span>
            {!s.disqualified && <span className="rotate-[6deg] font-display text-[0.5rem] tracking-wide text-paper-100">SCORE</span>}
          </div>
        )}
      </div>

      {s.disqualified && s.disqualifyReason && (
        <div className="mt-3 border-l-2 border-ink/20 pl-3 text-[0.85rem] italic text-ink-soft">Disqualified — {s.disqualifyReason}</div>
      )}

      {s.tags && s.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {s.tags.map((t) => (
            <span key={t} className={tagCls}>
              {t}
            </span>
          ))}
        </div>
      )}

      {descText && (
        <div className="mt-2.5">
          <div className="text-[0.85rem] leading-[1.5] text-ink-soft">{descText}</div>
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-1 cursor-pointer border-none bg-transparent p-0 font-display text-[0.74rem] tracking-wide text-chili underline decoration-dotted underline-offset-2"
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>
      )}

      {s.status === "visited" && (
        <div className="mt-4 overflow-hidden rounded-2xl border-[2.5px] border-ink">
          <div className="grid grid-cols-5 gap-px bg-ink">
            <ScoreCell label="VIBE" value={s.vibe} />
            <ScoreCell label="VALUE" value={s.value} />
            <ScoreCell label="SERVICE" value={s.service} />
            <ScoreCell label="FOOD" value={s.food} />
            <ScoreCell label="DIST" value={distanceScore(s.walkMinutes)} isDistance />
          </div>
        </div>
      )}

      {(s.specials || s.notes) && (
        <div className="mt-3.5 space-y-1.5 border-l-2 border-chili/40 pl-3">
          {s.specials && (
            <div className="flex items-center gap-1.5 text-[0.82rem] text-ink-soft">
              <Icon name="clock" size={12} className="text-chili" />
              {s.specials}
            </div>
          )}
          {s.notes && <div className="text-[0.82rem] italic text-ink-soft">&ldquo;{s.notes}&rdquo;</div>}
        </div>
      )}

      {isFetching && (
        <div className="mt-2.5 flex items-center gap-1.5 font-display text-[0.72rem] tracking-wide text-ink-faint">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-chili" />
          FINDING DETAILS…
        </div>
      )}

      <div className="relative z-10 mt-4 flex flex-wrap items-center gap-x-2 gap-y-2 border-t-2 border-dashed border-ink/25 pt-3.5">
        {s.mapsLink && (
          <a className={ghostBtnCls} href={s.mapsLink} target="_blank" rel="noreferrer">
            <Icon name="external" size={12} /> Map
          </a>
        )}
        <button className={ghostBtnGreenCls} onClick={onEdit}>
          <Icon name="pencil" size={12} /> {editLabel || "Edit"}
        </button>
        {s.status === "visited" && onDisqualify && (
          <button className={dqBtnCls} onClick={onDisqualify}>
            <Icon name="xCircle" size={11} />
            {s.disqualified ? "Un-disqualify" : "Disqualify"}
          </button>
        )}
        {showRemove && (
          <button className={`${removeBtnCls} ml-auto`} onClick={() => setConfirmingRemove(true)} aria-label="Remove">
            <Icon name="x" size={11} />
            <span className="hidden sm:inline">Remove</span>
          </button>
        )}
      </div>

      {confirmingRemove &&
        createPortal(
          <Modal onClose={() => setConfirmingRemove(false)}>
            <h3 className="mt-0 font-display text-xl tracking-wide text-ink">Remove {s.name}?</h3>
            <p className="mt-2 text-[0.9rem] leading-relaxed text-ink-soft">
              Are you sure you want to remove {s.name} from the {isWishlist ? "want-to-try list" : "rankings"}?
            </p>
            <div className="mt-5 flex gap-2.5">
              <button autoFocus className={secondaryBtnCls} onClick={() => setConfirmingRemove(false)}>
                Cancel
              </button>
              <button
                className="flex-1 cursor-pointer rounded-full border-[2.5px] border-ink bg-chili-600 px-4 py-2.5 font-display tracking-wide text-paper-50 shadow-stamp-sm transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                onClick={() => {
                  setConfirmingRemove(false);
                  onDelete();
                }}
              >
                Remove
              </button>
            </div>
          </Modal>,
          document.body,
        )}
    </div>
  );
}
