"use client";

import type { ReactNode, SVGProps } from "react";

/**
 * Tiny hand-rolled icon set — 24px grid, thin strokes, monochrome (inherits
 * currentColor). No icon library, no emoji.
 */

const GLYPHS: Record<string, ReactNode> = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.2" y2="16.2" />
    </>
  ),
  dice: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <circle cx="8.5" cy="8.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="15.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  pin: (
    <>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  map: (
    <>
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </>
  ),
  external: (
    <>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </>
  ),
  pencil: <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />,
  x: (
    <>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15.5 14" />
    </>
  ),
  walk: (
    <>
      <circle cx="13" cy="4" r="1.6" fill="currentColor" stroke="none" />
      <path d="M10.5 22 12 16.5 9.5 15l1-4.5 4-1.5 3 3.5-2 1.5" />
      <path d="M9.5 15 6 17.5" />
      <path d="M14 11 17.5 9.5" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10v6a5 5 0 0 1-10 0V4z" />
      <path d="M7 5.5H4a2 2 0 0 0 2 3.5h1" />
      <path d="M17 5.5h3a2 2 0 0 1-2 3.5h-1" />
    </>
  ),
  message: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  refresh: (
    <>
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </>
  ),
  xCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </>
  ),
  ledger: (
    <>
      <path d="M9 3h6v3H9z" />
      <path d="M6 4h2M16 4h2a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="13" y2="16" />
    </>
  ),
  // fork + knife (food)
  food: (
    <>
      <path d="M6 2v9" />
      <path d="M4 2v5a2 2 0 0 0 2 2 2 2 0 0 0 2-2V2" />
      <path d="M6 11v11" />
      <path d="M17 2c-2 0-3 3-3 6 0 2 1 3 3 3v11" />
    </>
  ),
  arrowRight: (
    <>
      <line x1="4" y1="12" x2="19" y2="12" />
      <polyline points="13 6 19 12 13 18" />
    </>
  ),
  arrowLeft: (
    <>
      <line x1="20" y1="12" x2="5" y2="12" />
      <polyline points="11 6 5 12 11 18" />
    </>
  ),
  // crossed forks (Taste-Off duel)
  swords: (
    <>
      <path d="M6 3c-1 3 0 6 2 8l7 7 2-2-7-7c-2-2-4-3-4-6z" />
      <path d="M18 3c1 3 0 6-2 8l-7 7-2-2 7-7c2-2 4-3 4-6z" />
    </>
  ),
  chevronDown: <polyline points="6 9 12 15 18 9" />,
  check: <polyline points="20 6 9 17 4 12" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4.5" />
      <line x1="12" y1="1.5" x2="12" y2="4.5" />
      <line x1="12" y1="19.5" x2="12" y2="22.5" />
      <line x1="1.5" y1="12" x2="4.5" y2="12" />
      <line x1="19.5" y1="12" x2="22.5" y2="12" />
      <line x1="4.4" y1="4.4" x2="6.5" y2="6.5" />
      <line x1="17.5" y1="17.5" x2="19.6" y2="19.6" />
      <line x1="4.4" y1="19.6" x2="6.5" y2="17.5" />
      <line x1="17.5" y1="6.5" x2="19.6" y2="4.4" />
    </>
  ),
  // flame (hot pick / streak)
  flame: (
    <path d="M12 2c1 3-3 4-3 7.5A3.5 3.5 0 0 0 12 13a3.5 3.5 0 0 0 3.5-3.5c1.5 1 2.5 3 2.5 5A6 6 0 0 1 6 14.5C6 9 12 8 12 2z" />
  ),
  // ticket / stamp (rank, empty states)
  ticket: (
    <>
      <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8z" />
      <line x1="10" y1="7" x2="10" y2="17" strokeDasharray="2 2" />
    </>
  ),
  // starburst (champion placard accent)
  star: <path d="M12 2l2.4 6.8L21 11l-6.6 2.2L12 22l-2.4-8.8L3 11l6.6-2.2z" />,
};

export type IconName = keyof typeof GLYPHS;

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
  /** Fill the glyph solid instead of stroking it (a few glyphs — star,
   *  flame — read better filled for emphasis states). */
  filled?: boolean;
}

export default function Icon({ name, size = 14, filled = false, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {GLYPHS[name]}
    </svg>
  );
}
