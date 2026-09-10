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
      <h3 className="mt-0 font-display text-lg font-bold text-ink">Confirm the location</h3>
      <p className="mb-0.5 font-display text-[0.82rem] font-semibold text-coral">&ldquo;{suggestion.name}&rdquo;</p>
      {suggestion.address && (
        <p className="mb-4 flex items-center gap-1.5 text-[0.75rem] text-ink-faint">
          <Icon name="pin" size={12} />
          {suggestion.address}
        </p>
      )}

      {searching ? (
        <div className="py-6 text-center text-[0.85rem] text-ink-faint">Looking up on Google Places…</div>
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
          <div className="mb-3.5 font-display text-[0.7rem] font-semibold uppercase tracking-[0.06em] text-ink-faint">
            Select the correct location
          </div>
          {results.map((r, i) => {
            const tooFar = r.walkMinutes != null && r.walkMinutes > MAX_WALK_MINUTES;
            return (
              <div
                key={i}
                className="mb-2 cursor-pointer rounded-2xl border-2 border-ink/5 bg-cream-100 px-4 py-3 transition-colors duration-150 hover:border-coral hover:bg-coral-50"
                onClick={() => confirmPlaceSelection(r)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-display text-base font-semibold text-ink">{r.name}</div>
                  {r.walkMinutes != null && (
                    <div className={`flex-shrink-0 font-display text-[0.72rem] font-bold ${tooFar ? "text-berry" : "text-fresh-600"}`}>
                      🚶 {fmtWalk(r.walkMinutes)}
                    </div>
                  )}
                </div>
                <div className="mt-1 text-[0.75rem] leading-[1.4] text-ink-soft">{r.address}</div>
                {tooFar && (
                  <div className="mt-1 text-[0.7rem] font-medium text-berry">
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
