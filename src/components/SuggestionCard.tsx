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
    <div className={`rounded-2xl border-2 border-ink/5 bg-white p-3.5 shadow-card ${cardHoverCls}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="font-display text-[1.05rem] font-bold text-ink">{s.name}</div>
        {s.walkMinutes != null && (
          <div className="flex-shrink-0 inline-flex items-center gap-1 rounded-full bg-fresh-100 px-2 py-[2px] font-display text-[0.7rem] font-bold text-fresh-600">
            <Icon name="walk" size={10} /> {fmtWalk(s.walkMinutes)}
          </div>
        )}
      </div>
      {s.neighborhood && <div className="mt-0.5 font-display text-[0.7rem] font-semibold text-ink-faint">{s.neighborhood}</div>}
      {s.tags && s.tags.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {s.tags.map((t) => (
            <span key={t} className={tagCls}>
              {t}
            </span>
          ))}
        </div>
      ) : (
        isEnriching && (
          <div className="mt-2 flex flex-wrap gap-1">
            {[0, 1, 2].map((i) => (
              <span key={i} className="inline-block w-[3.2rem] animate-pulse rounded-full bg-cream-200 py-0.5 text-transparent">
                .
              </span>
            ))}
          </div>
        )
      )}
      {desc ? (
        <div className="mt-2 text-[0.82rem] leading-[1.4] text-ink-soft">{desc}</div>
      ) : isEnriching ? (
        <div className="mt-2 animate-pulse text-[0.82rem] italic text-ink-faint">finding details…</div>
      ) : (
        s.address && <div className="mt-2 text-[0.82rem] leading-[1.4] text-ink-soft">{s.address}</div>
      )}
      {s.specials && (
        <div className="mt-2 flex items-center gap-1.5 text-[0.82rem] leading-[1.4] text-coral">
          <Icon name="clock" size={12} />
          {s.specials}
        </div>
      )}
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        {s.mapsLink && (
          <a className={linkBtnCls} href={s.mapsLink} target="_blank" rel="noreferrer">
            <Icon name="external" size={12} /> Map
          </a>
        )}
        <button
          className="flex-1 cursor-pointer rounded-full border-2 border-fresh bg-transparent px-3 py-1.5 font-display text-[0.74rem] font-semibold text-fresh-600 hover:bg-fresh hover:text-white"
          onClick={onWishlist}
        >
          + Want to try
        </button>
        <button
          className="cursor-pointer rounded-full border-2 border-ink/10 bg-transparent px-3 py-1.5 font-display text-[0.74rem] font-semibold text-ink-soft hover:border-coral hover:text-coral"
          onClick={onVisited}
        >
          I tried it
        </button>
      </div>
    </div>
  );
}
