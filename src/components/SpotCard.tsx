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

function ScoreCell({ label, value, isDistance }: { label: string; value: number | null; mobileSpan?: number; isDistance?: boolean }) {
  const strong = value !== null && value >= 8.5;
  return (
    <div className="flex flex-col items-center gap-1 bg-white px-1 py-2.5 text-center">
      <span className={`font-mono text-[1.1rem] font-bold leading-none ${strong ? "text-coral" : "text-ink"}`}>{fmt(value)}</span>
      <span className="flex items-center gap-0.5 font-display text-[0.58rem] font-semibold uppercase tracking-[0.06em] text-ink-faint">
        {isDistance && <Icon name="walk" size={9} />}
        {label}
      </span>
    </div>
  );
}

export default function SpotCard({ s, rank, score, duelDecided, isFetching, onNameClick, onEdit, editLabel, onDelete, onDisqualify }: SpotCardProps) {
  const isWishlist = s.status === "to-try";
  const cleanDesc = displayDescription(s.description);
  const isLong = !!cleanDesc && cleanDesc.length > 140;
  const [expanded, setExpanded] = useState(false);
  const showRemove = isWishlist || s.status === "visited";
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  const descText = isLong && !expanded ? cleanDesc.slice(0, 140) + "…" : cleanDesc;

  const railColor = s.disqualified
    ? "bg-ink/10"
    : isWishlist
      ? "bg-fresh"
      : rank === 1
        ? "bg-sunny"
        : rank === 2
          ? "bg-ink/30"
          : rank === 3
            ? "bg-coral-300"
            : "bg-ink/10";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 bg-white py-5 pl-6 pr-5 shadow-card ${cardHoverCls} ${
        s.disqualified ? "border-ink/5 opacity-70" : "border-ink/5"
      } ${rank === 1 ? "border-sunny-600/40" : ""}`}
    >
      <span className={`absolute inset-y-0 left-0 w-1.5 ${railColor}`} aria-hidden="true" />

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          {rank ? (
            <span
              className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 font-mono text-[1.05rem] font-bold ${
                rank === 1
                  ? "border-sunny bg-sunny text-ink shadow-pop"
                  : rank === 2
                    ? "border-ink/20 text-ink-soft"
                    : rank === 3
                      ? "border-coral-300 text-coral-600"
                      : "border-ink/10 text-ink-faint"
              }`}
            >
              {rank}
            </span>
          ) : s.disqualified ? (
            <span className="relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 border-ink/10 font-mono text-[0.7rem] text-ink-faint">
              N/A
            </span>
          ) : null}

          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-2">
              <div className="min-w-0 cursor-pointer truncate font-display text-[1.15rem] font-bold text-ink hover:text-coral" onClick={onNameClick}>
                {s.mapsLink ? (
                  <a href={s.mapsLink} target="_blank" rel="noreferrer" className="text-inherit no-underline" onClick={(e) => e.stopPropagation()}>
                    {s.name}
                  </a>
                ) : (
                  s.name
                )}
              </div>
              {isWishlist && (
                <span className="font-display text-[0.62rem] font-bold uppercase tracking-[0.05em] text-fresh-600">☆ want to try</span>
              )}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              {s.neighborhood && <span className="font-display text-[0.78rem] font-semibold text-coral">{s.neighborhood}</span>}
              {s.walkMinutes != null && (
                <span className="inline-flex items-center gap-1 rounded-full bg-fresh-100 px-2 py-[1px] font-display text-[0.7rem] font-bold text-fresh-600">
                  <Icon name="walk" size={10} /> {fmtWalk(s.walkMinutes)}
                </span>
              )}
            </div>
          </div>
        </div>

        {score !== undefined && score !== null && (
          <div className="flex-shrink-0 rounded-2xl border-2 border-ink/5 bg-cream-100 px-3.5 py-2 text-right">
            <div className="flex items-center justify-end gap-1.5">
              {duelDecided && !s.disqualified && (
                <span title="Position determined by a Taste-Off" aria-label="Position determined by a Taste-Off" className="inline-flex">
                  <Icon name="swords" size={12} className="text-coral/70" />
                </span>
              )}
              <span className="font-mono text-[1.3rem] font-bold leading-none text-coral">{s.disqualified ? "N/A" : fmt(score)}</span>
            </div>
            <div className="mt-1 text-[0.58rem] font-semibold uppercase tracking-[0.08em] text-ink-faint">
              {s.disqualified ? "disqualified" : "overall"}
            </div>
          </div>
        )}
      </div>

      {s.disqualified && s.disqualifyReason && (
        <div className="mt-2.5 border-l-2 border-ink/10 pl-3 text-[0.85rem] italic text-ink-soft">Disqualified — {s.disqualifyReason}</div>
      )}

      {s.tags && s.tags.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {s.tags.map((t) => (
            <span key={t} className={tagCls}>
              {t}
            </span>
          ))}
        </div>
      )}

      {descText && (
        <div className="mt-2">
          <div className="text-[0.85rem] leading-[1.5] text-ink-soft">{descText}</div>
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-1 cursor-pointer border-none bg-transparent p-0 font-display text-[0.72rem] font-semibold text-coral underline decoration-dotted underline-offset-2"
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>
      )}

      {s.status === "visited" && (
        <div className="mt-3.5 overflow-hidden rounded-2xl border-2 border-ink/5">
          <div className="grid grid-cols-5 gap-px bg-ink/5">
            <ScoreCell label="Vibe" value={s.vibe} />
            <ScoreCell label="Value" value={s.value} />
            <ScoreCell label="Service" value={s.service} />
            <ScoreCell label="Food" value={s.food} />
            <ScoreCell label="Distance" value={distanceScore(s.walkMinutes)} isDistance />
          </div>
        </div>
      )}

      {(s.specials || s.notes) && (
        <div className="mt-3 space-y-1.5 border-l-2 border-coral/25 pl-3">
          {s.specials && (
            <div className="flex items-center gap-1.5 text-[0.82rem] text-ink-soft">
              <Icon name="clock" size={12} className="text-coral/70" />
              {s.specials}
            </div>
          )}
          {s.notes && <div className="text-[0.82rem] italic text-ink-soft">&ldquo;{s.notes}&rdquo;</div>}
        </div>
      )}

      {isFetching && (
        <div className="mt-2 flex items-center gap-1.5 font-display text-[0.7rem] text-ink-faint">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-coral" />
          finding details…
        </div>
      )}

      <div className="relative z-10 mt-4 flex flex-wrap items-center gap-x-1.5 gap-y-2 border-t-2 border-ink/5 pt-3">
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
            <h3 className="mt-0 font-display text-lg font-bold text-ink">Remove {s.name}?</h3>
            <p className="mt-2 text-[0.9rem] leading-relaxed text-ink-soft">
              Are you sure you want to remove {s.name} from the {isWishlist ? "want-to-try list" : "rankings"}?
            </p>
            <div className="mt-5 flex gap-2.5">
              <button autoFocus className={secondaryBtnCls} onClick={() => setConfirmingRemove(false)}>
                Cancel
              </button>
              <button
                className="flex-1 cursor-pointer rounded-full bg-berry px-4 py-2.5 font-display text-[0.82rem] font-semibold text-white shadow-pop transition-all duration-150 hover:bg-berry/90 active:scale-[0.98]"
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
