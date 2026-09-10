"use client";

import { useState } from "react";
import Modal from "./Modal";
import Icon from "../Icon";
import { fmt } from "@/lib/scoring";
import type { DuelPair } from "@/lib/ranking";

interface DuelModalProps {
  pairs: DuelPair[];
  onResolve: (spot1Id: string, spot2Id: string, winnerId: string) => Promise<boolean>;
  onClose: () => void;
}

export default function DuelModal({ pairs, onResolve, onClose }: DuelModalProps) {
  const [flashName, setFlashName] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState(false);

  if (pairs.length === 0) {
    return (
      <Modal onClose={onClose} maxWidth="520px">
        <div className="flex items-center gap-2 font-display text-[0.7rem] font-bold uppercase tracking-[0.08em] text-coral">
          <Icon name="swords" size={14} /> Taste-Off
        </div>
        <h3 className="mt-3 font-display text-xl font-bold text-ink">All ties settled!</h3>
        <p className="mt-2 text-[0.9rem] leading-relaxed text-ink-soft">
          Every tied pair now has a winner, so the ranking order is fully decided.
        </p>
        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full bg-coral px-5 py-2.5 font-display text-[0.82rem] font-semibold text-white shadow-pop transition-all duration-150 hover:bg-coral-600 active:scale-[0.98]"
          >
            Done
          </button>
        </div>
      </Modal>
    );
  }

  const pair = pairs[0];
  const multi = pairs.length > 1;

  const choose = async (winnerId: string) => {
    if (resolving) return;
    const winnerName = winnerId === pair.spot1.id ? pair.spot1.name : pair.spot2.name;
    setResolving(true);
    setError(false);
    const ok = await onResolve(pair.spot1.id, pair.spot2.id, winnerId);
    setResolving(false);
    if (!ok) {
      setError(true);
      return;
    }
    setFlashName(winnerName);
    window.setTimeout(() => setFlashName(null), 950);
  };

  const contenderBtn =
    "group flex w-full cursor-pointer flex-col items-start gap-1 rounded-2xl border-2 border-ink/10 bg-cream-100 px-4 py-4 text-left transition-all duration-150 hover:border-coral hover:bg-coral-50 active:scale-[0.985] disabled:cursor-default disabled:opacity-50";

  return (
    <Modal onClose={onClose} maxWidth="520px">
      <div className="flex items-center gap-2 font-display text-[0.7rem] font-bold uppercase tracking-[0.08em] text-coral">
        <Icon name="swords" size={14} /> Taste-Off
      </div>
      <h3 className="mt-3 font-display text-xl font-bold text-ink">These spots finished with the same score.</h3>
      <p className="mt-1.5 text-[0.9rem] italic text-ink-soft">
        Which do you prefer? The winner takes the higher spot — scores stay untouched.
      </p>

      {flashName ? (
        <div className="mt-5 rounded-2xl border-2 border-coral/25 bg-coral-50 px-5 py-6 text-center">
          <div className="font-display text-[0.68rem] font-bold uppercase tracking-[0.1em] text-coral">
            🍴 Taste-Off won
          </div>
          <div className="mt-2 font-display text-xl font-bold text-ink">{flashName} wins!</div>
          <div className="mt-1.5 text-[0.75rem] text-ink-faint">settling the next matchup…</div>
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <button type="button" className={contenderBtn} disabled={resolving} onClick={() => choose(pair.spot1.id)}>
              <span className="font-display text-[1.05rem] font-bold leading-snug text-ink group-hover:text-coral">
                {pair.spot1.name}
              </span>
              {pair.spot1.neighborhood && (
                <span className="font-display text-[0.68rem] font-semibold uppercase tracking-[0.05em] text-ink-faint">
                  {pair.spot1.neighborhood}
                </span>
              )}
              <span className="mt-1 font-mono text-[0.75rem] text-coral">{fmt(pair.score)}</span>
            </button>
            <button type="button" className={contenderBtn} disabled={resolving} onClick={() => choose(pair.spot2.id)}>
              <span className="font-display text-[1.05rem] font-bold leading-snug text-ink group-hover:text-coral">
                {pair.spot2.name}
              </span>
              {pair.spot2.neighborhood && (
                <span className="font-display text-[0.68rem] font-semibold uppercase tracking-[0.05em] text-ink-faint">
                  {pair.spot2.neighborhood}
                </span>
              )}
              <span className="mt-1 font-mono text-[0.75rem] text-coral">{fmt(pair.score)}</span>
            </button>
          </div>
          {multi && (
            <p className="mt-3 text-[0.72rem] text-ink-faint">
              {pairs.length} matchup{pairs.length === 1 ? "" : "s"} left to settle this tie.
            </p>
          )}
          {error && <p className="mt-3 text-[0.75rem] text-berry">Couldn&apos;t save that pick — check your connection and try again.</p>}
        </>
      )}

      <div className="mt-5 flex justify-end">
        <button
          onClick={onClose}
          className="cursor-pointer border-none bg-transparent p-1 font-display text-[0.75rem] font-semibold text-ink-faint transition-colors hover:text-coral"
        >
          Skip for now
        </button>
      </div>
    </Modal>
  );
}
