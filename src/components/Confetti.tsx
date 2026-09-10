"use client";

import { useMemo } from "react";

const COLORS = ["#FF4321", "#FFB800", "#1E8E4F", "#7A3FE0", "#FFFCF6"];

/** A short burst of falling confetti pieces, pure CSS animation (no
 *  library). Mount it, let the animation play once (~900ms), unmount.
 *  Used for the Taste-Off winner reveal — the one moment in the app that
 *  earns a little fireworks. */
export default function Confetti({ count = 22 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: `${Math.round(Math.random() * 100)}%`,
        delay: `${Math.round(Math.random() * 150)}ms`,
        color: COLORS[i % COLORS.length],
        rotate: Math.round(Math.random() * 360),
      })),
    [count],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="lr-confetti-piece"
          style={{
            left: p.left,
            background: p.color,
            animationDelay: p.delay,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}
