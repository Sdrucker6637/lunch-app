"use client";

import type { PlaceResult } from "@/lib/types";
import { displayDescription } from "@/lib/parse";
import { linkBtnCls, tagCls, cardHoverCls } from "@/lib/ui";
import { fmtWalk } from "@/lib/scoring";
import Icon from "./Icon";

interface SuggestionCardProps {
  s: PlaceResult;
  isEnriching: boolean;
  onWishlist: () => void;
  onVisited: () => void;
}

export default function SuggestionCard({ s, isEnriching, onWishlist, onVisited }: SuggestionCardProps) {
  const desc = displayDescription(s.description);

  return (
    <div className={`rounded-ticket border-[2.5px] border-ink bg-paper-50 p-4 shadow-stamp ${cardHoverCls}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="font-display text-[1.1rem] tracking-wide text-ink">{s.name}</div>
        {s.walkMinutes != null && (
          <div className="inline-flex flex-shrink-0 items-center gap-1 rounded-full border-2 border-ink bg-pickle-100 px-2 py-[2px] font-display text-[0.72rem] tracking-wide text-pickle-600">
            <Icon name="walk" size={10} /> {fmtWalk(s.walkMinutes)}
          </div>
        )}
      </div>
      {s.neighborhood && <div className="mt-0.5 font-display text-[0.72rem] tracking-wide text-ink-faint">{s.neighborhood}</div>}
      {s.tags && s.tags.length > 0 ? (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {s.tags.map((t) => (
            <span key={t} className={tagCls}>
              {t}
            </span>
          ))}
        </div>
      ) : (
        isEnriching && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {[0, 1, 2].map((i) => (
              <span key={i} className="inline-block w-[3.2rem] animate-pulse rounded-full border-2 border-ink/20 bg-paper-200 py-0.5 text-transparent">
                .
              </span>
            ))}
          </div>
        )
      )}
      {desc ? (
        <div className="mt-2.5 text-[0.83rem] leading-[1.45] text-ink-soft">{desc}</div>
      ) : isEnriching ? (
        <div className="mt-2.5 animate-pulse text-[0.83rem] italic text-ink-faint">finding details…</div>
      ) : (
        s.address && <div className="mt-2.5 text-[0.83rem] leading-[1.45] text-ink-soft">{s.address}</div>
      )}
      {s.specials && (
        <div className="mt-2.5 flex items-center gap-1.5 text-[0.83rem] leading-[1.4] text-chili">
          <Icon name="clock" size={12} />
          {s.specials}
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t-2 border-dashed border-ink/20 pt-3">
        {s.mapsLink && (
          <a className={linkBtnCls} href={s.mapsLink} target="_blank" rel="noreferrer">
            <Icon name="external" size={12} /> Map
          </a>
        )}
        <button
          className="flex-1 cursor-pointer rounded-full border-2 border-ink bg-pickle-100 px-3 py-1.5 font-display text-[0.76rem] tracking-wide text-pickle-600 transition-transform active:translate-x-px active:translate-y-px hover:bg-pickle-300"
          onClick={onWishlist}
        >
          + Want to try
        </button>
        <button
          className="cursor-pointer rounded-full border-2 border-ink bg-paper-100 px-3 py-1.5 font-display text-[0.76rem] tracking-wide text-ink transition-transform active:translate-x-px active:translate-y-px hover:bg-yolk-100"
          onClick={onVisited}
        >
          I tried it
        </button>
      </div>
    </div>
  );
}
