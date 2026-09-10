"use client";

import { useState } from "react";
import Modal from "./Modal";
import Icon from "../Icon";
import Confetti from "../Confetti";
import { fmt } from "@/lib/scoring";
import type { DuelPair } from "@/lib/ranking";

interface DuelModalProps {
  pairs: DuelPair[];
  onResolve: (spot1Id: string, spot2Id: string, winnerId: string) => Promise<boolean>;
  onClose: () => void;
}

export default function DuelModal({ pairs, onResolve, onClose }: DuelModalProps) {
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState(false);

  if (pairs.length === 0) {
    return (
      <Modal onClose={onClose} maxWidth="520px">
        <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-yolk px-3 py-1 font-display text-[0.7rem] tracking-[0.08em] text-ink">
          <Icon name="swords" size={13} /> TASTE-OFF
        </div>
        <h3 className="mt-4 font-display text-2xl tracking-wide text-ink">All ties settled!</h3>
        <p className="mt-2 text-[0.92rem] leading-relaxed text-ink-soft">
          Every tied pair now has a winner, so the ranking order is fully decided.
        </p>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full border-[2.5px] border-ink bg-chili px-5 py-2.5 font-display tracking-wide text-paper-50 shadow-stamp-sm transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            Done
          </button>
        </div>
      </Modal>
    );
  }

  const pair = pairs[0];
  const multi = pairs.length > 1;

  const choose = async (id: string) => {
    if (resolving) return;
    setResolving(true);
    setError(false);
    const ok = await onResolve(pair.spot1.id, pair.spot2.id, id);
    setResolving(false);
    if (!ok) {
      setError(true);
      return;
    }
    setWinnerId(id);
    window.setTimeout(() => setWinnerId(null), 1100);
  };

  const contenderCard = (spot: typeof pair.spot1, isWinner: boolean, isLoser: boolean) => (
    <button
      type="button"
      disabled={resolving}
      onClick={() => choose(spot.id)}
      className={`group relative flex w-full flex-col items-center gap-1.5 rounded-ticket border-[2.5px] border-ink bg-paper-50 px-4 py-6 text-center shadow-stamp transition-all duration-200 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-default ${
        isWinner ? "scale-105 bg-yolk-100" : isLoser ? "opacity-40 grayscale" : "hover:-translate-y-1 hover:shadow-stamp-lg"
      }`}
    >
      {isWinner && (
        <span className="absolute -top-5 left-1/2 -translate-x-1/2 rotate-[-8deg] animate-stamp-slam rounded-full border-[3px] border-pickle-600 bg-paper-50 px-3 py-1 font-display text-[0.85rem] tracking-wide text-pickle-600">
          WINNER
        </span>
      )}
      <span className="font-display text-[1.15rem] leading-snug tracking-wide text-ink group-hover:text-chili">{spot.name}</span>
      {spot.neighborhood && <span className="font-display text-[0.68rem] tracking-wide text-ink-faint">{spot.neighborhood}</span>}
      <span className="mt-1 rounded-full border-2 border-ink bg-paper-100 px-2.5 py-0.5 font-mono text-[0.82rem] font-bold text-chili">
        {fmt(pair.score)}
      </span>
      {isWinner && <Confetti />}
    </button>
  );

  return (
    <Modal onClose={onClose} maxWidth="560px">
      <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-yolk px-3 py-1 font-display text-[0.7rem] tracking-[0.08em] text-ink">
        <Icon name="swords" size={13} /> TASTE-OFF
      </div>
      <h3 className="mt-4 font-display text-2xl leading-tight tracking-wide text-ink">These spots tied. You decide.</h3>
      <p className="mt-1.5 text-[0.88rem] italic text-ink-soft">Tap your pick — the winner takes the higher spot. Scores stay untouched.</p>

      <div className="relative mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-4">
        {contenderCard(pair.spot1, winnerId === pair.spot1.id, winnerId === pair.spot2.id)}
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 sm:flex">
          <span className="flex h-12 w-12 rotate-[-8deg] items-center justify-center rounded-full border-[3px] border-ink bg-plum font-display text-[0.9rem] text-paper-50 shadow-stamp-sm">
            VS
          </span>
        </div>
        <div className="pointer-events-none flex justify-center sm:hidden">
          <span className="flex h-10 w-10 rotate-[-8deg] items-center justify-center rounded-full border-[3px] border-ink bg-plum font-display text-[0.8rem] text-paper-50 shadow-stamp-sm">
            VS
          </span>
        </div>
        {contenderCard(pair.spot2, winnerId === pair.spot2.id, winnerId === pair.spot1.id)}
      </div>

      {multi && <p className="mt-5 text-center font-display text-[0.72rem] tracking-wide text-ink-faint">{pairs.length} MATCHUP{pairs.length === 1 ? "" : "S"} LEFT</p>}
      {error && <p className="mt-3 text-center text-[0.78rem] text-chili-600">Couldn&apos;t save that pick — check your connection and try again.</p>}

      <div className="mt-6 flex justify-center">
        <button
          onClick={onClose}
          className="cursor-pointer border-none bg-transparent p-1 font-display text-[0.78rem] tracking-wide text-ink-faint transition-colors hover:text-chili"
        >
          Skip for now
        </button>
      </div>
    </Modal>
  );
}
