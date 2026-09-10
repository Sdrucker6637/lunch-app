/** Shared Tailwind class strings — "deli counter meets scoreboard" language.
 *  Every interactive surface reads as a printed/stamped object: bold black
 *  outlines, hard offset shadows (no blur), and a press-in animation on
 *  click that removes the offset — the control visually "presses into the
 *  page" the way a real ticket-punch or arcade button would. Primary =
 *  chili fill; secondary = paper fill with ink border; tertiary = plain
 *  ink text. Shapes stay consistently rounded-full (pill) for buttons/chips
 *  and rounded-ticket for cards/panels — never a mix of pill and square in
 *  the same button family. */

const btnBase =
  "inline-flex items-center justify-center gap-1.5 cursor-pointer font-display text-[0.95rem] tracking-wide transition-transform duration-100 disabled:cursor-default disabled:opacity-40 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none";

export const inputCls =
  "w-full rounded-2xl border-[2.5px] border-ink bg-paper-50 px-4 py-2.5 font-body text-[0.92rem] font-medium text-ink placeholder:text-ink-faint placeholder:font-normal focus:outline-none focus:ring-4 focus:ring-plum/25 transition-shadow";

export const findBtnCls = `${btnBase} rounded-full border-[2.5px] border-ink bg-chili px-6 py-3 text-paper-50 shadow-stamp hover:bg-chili-600`;

export const altBtnCls = `${btnBase} rounded-full border-[2.5px] border-ink bg-paper-50 px-6 py-3 text-ink shadow-stamp hover:bg-yolk-100`;

export const primaryBtnCls = `${btnBase} rounded-full flex-1 border-[2.5px] border-ink bg-chili px-4 py-2.5 text-paper-50 shadow-stamp-sm hover:bg-chili-600`;

export const secondaryBtnCls = `${btnBase} rounded-full flex-1 border-[2.5px] border-ink bg-paper-50 px-4 py-2.5 text-ink shadow-stamp-sm hover:bg-yolk-100`;

export const btnPrimaryCls = `${btnBase} rounded-full border-[2.5px] border-ink bg-chili px-5 py-2.5 text-paper-50 shadow-stamp-sm hover:bg-chili-600`;

export const btnSecondaryCls = `${btnBase} rounded-full border-[2.5px] border-ink bg-paper-50 px-4 py-2.5 text-ink shadow-stamp-sm hover:bg-yolk-100`;

export const addBtnCls =
  "mt-3 w-full cursor-pointer rounded-2xl border-[2.5px] border-dashed border-ink/50 bg-transparent px-5 py-3.5 font-display text-[0.95rem] tracking-wide text-ink transition-colors hover:border-ink hover:bg-yolk-100";

export const ghostBtnCls =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-full border-2 border-ink bg-paper-50 px-3 py-1.5 font-display text-[0.78rem] tracking-wide text-ink no-underline transition-transform active:translate-x-px active:translate-y-px hover:bg-yolk-100";

export const ghostBtnGreenCls =
  "inline-flex cursor-pointer items-center gap-1 rounded-full border-2 border-ink bg-paper-50 px-3 py-1.5 font-display text-[0.78rem] tracking-wide text-ink no-underline transition-transform active:translate-x-px active:translate-y-px hover:bg-pickle-100";

export const linkBtnCls = ghostBtnCls;

export const dqBtnCls =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-full border-2 border-ink bg-paper-50 px-3 py-1.5 font-display text-[0.78rem] tracking-wide text-chili-600 no-underline transition-transform active:translate-x-px active:translate-y-px hover:bg-chili-50";

export const removeBtnCls =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-full border-2 border-ink/30 bg-transparent px-3 py-1.5 font-display text-[0.78rem] tracking-wide text-chili-600 no-underline transition-colors hover:border-ink hover:bg-chili-50";

export const chipCls =
  "inline-flex flex-shrink-0 cursor-pointer items-center gap-1.5 rounded-full border-2 border-ink bg-paper-50 px-3.5 py-1.5 font-display text-[0.8rem] tracking-wide text-ink transition-colors duration-100 hover:bg-yolk-100 disabled:cursor-default disabled:opacity-40";

export const filterChipCls = chipCls;

export const filterChipActiveCls = "!bg-chili !text-paper-50";

export const chipActiveCls = "!bg-chili !text-paper-50";

export const modeChipActiveCls = "!bg-yolk !text-ink";

export const cardBaseShadowCls = "shadow-stamp";

export const cardWarmSurfaceCls = "";

export const cardHoverCls = "transition-transform duration-150 hover:-translate-y-1 hover:-rotate-[0.3deg]";

export const groupBtnCls =
  "flex h-7 w-7 flex-shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-ink bg-paper-50 text-base leading-none text-ink transition-colors hover:bg-yolk-100 disabled:cursor-default disabled:opacity-30";

/** Ticket-punch tag on spot cards. */
export const tagCls =
  "rounded-full border-2 border-ink/70 bg-paper-100 px-2.5 py-[2px] font-display text-[0.68rem] tracking-wide text-ink-soft";

export const kickerCls = "font-display text-[0.75rem] tracking-[0.08em] text-chili";

/** Walk-time badge — always visible on a card, the app's signature stat. */
export const walkBadgeCls =
  "inline-flex items-center gap-1 rounded-full border-2 border-ink bg-pickle-100 px-2.5 py-1 font-display text-[0.78rem] tracking-wide text-pickle-600";
