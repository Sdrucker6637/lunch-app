"use client";

import { useLunch } from "@/lib/lunch-context";
import Modal from "./Modal";
import { primaryBtnCls, secondaryBtnCls } from "@/lib/ui";
import Icon from "../Icon";
import { fmtWalk } from "@/lib/scoring";
import { MAX_WALK_MINUTES } from "@/lib/constants";

export default function PlacesModal() {
  const { placesModal, setPlacesModal, confirmPlaceSelection } = useLunch();
  if (!placesModal) return null;

  const { suggestion, results, searching } = placesModal;

  return (
    <Modal onClose={() => setPlacesModal(null)}>
      <h3 className="mt-0 font-display text-xl tracking-wide text-ink">Confirm the location</h3>
      <p className="mb-0.5 font-display text-[0.85rem] tracking-wide text-chili">&ldquo;{suggestion.name}&rdquo;</p>
      {suggestion.address && (
        <p className="mb-4 flex items-center gap-1.5 text-[0.75rem] text-ink-faint">
          <Icon name="pin" size={12} />
          {suggestion.address}
        </p>
      )}

      {searching ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <span className="h-2 w-2 animate-bounce rounded-full bg-chili" />
          <span className="text-[0.85rem] text-ink-faint">Looking up on Google Places…</span>
        </div>
      ) : results.length === 0 ? (
        <div>
          <p className="text-[0.9rem] leading-normal text-ink">No matching restaurant found on Google Places.</p>
          <p className="mb-1 text-[0.9rem] leading-normal text-ink">
            Double check the spelling, or it may be permanently closed. Adding anyway means no walk-time distance
            score until we can locate it.
          </p>
          <div className="mt-4 flex gap-2.5">
            <button className={secondaryBtnCls} onClick={() => setPlacesModal(null)}>
              Cancel
            </button>
            <button className={primaryBtnCls} onClick={() => confirmPlaceSelection({})}>
              Add anyway
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-3.5 font-display text-[0.72rem] tracking-[0.06em] text-ink-faint">SELECT THE CORRECT LOCATION</div>
          {results.map((r, i) => {
            const tooFar = r.walkMinutes != null && r.walkMinutes > MAX_WALK_MINUTES;
            return (
              <div
                key={i}
                className="mb-2.5 cursor-pointer rounded-2xl border-2 border-ink bg-paper-100 px-4 py-3 shadow-stamp-sm transition-transform hover:-translate-y-0.5 hover:bg-yolk-100"
                onClick={() => confirmPlaceSelection(r)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-display text-base tracking-wide text-ink">{r.name}</div>
                  {r.walkMinutes != null && (
                    <div
                      className={`flex-shrink-0 rounded-full border-2 border-ink px-2 py-0.5 font-display text-[0.72rem] tracking-wide ${
                        tooFar ? "bg-chili-100 text-chili-600" : "bg-pickle-100 text-pickle-600"
                      }`}
                    >
                      🚶 {fmtWalk(r.walkMinutes)}
                    </div>
                  )}
                </div>
                <div className="mt-1 text-[0.75rem] leading-[1.4] text-ink-soft">{r.address}</div>
                {tooFar && (
                  <div className="mt-1 text-[0.7rem] font-medium text-chili-600">
                    Outside your {MAX_WALK_MINUTES}-min radius — you can still add it.
                  </div>
                )}
              </div>
            );
          })}
          <div className="mt-5 flex gap-2.5">
            <button className={secondaryBtnCls} onClick={() => setPlacesModal(null)}>
              Cancel
            </button>
            <button className={secondaryBtnCls} onClick={() => confirmPlaceSelection({})}>
              None of these — add anyway
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
