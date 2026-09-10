/** Shared Tailwind class strings so repeated UI patterns stay pixel-consistent.
 *  Bright/energetic language: solid coral for the primary action, soft cream
 *  surfaces, fully rounded pills everywhere (the opposite of the bar app's
 *  squared-secondary / pill-primary split — here everything is round and
 *  friendly), tiny lift + shadow-pop on hover for a snappy, alive feel. */

const btnBase =
  "inline-flex items-center justify-center gap-1.5 cursor-pointer font-display text-[0.82rem] font-semibold transition-all duration-150 disabled:cursor-default disabled:opacity-40 disabled:hover:translate-y-0";

export const inputCls =
  "w-full rounded-2xl border-2 border-cream-200 bg-white px-4 py-2.5 font-body text-[0.92rem] text-ink placeholder:text-ink-faint focus:border-coral focus:outline-none focus:ring-4 focus:ring-coral-100 transition-colors";

export const findBtnCls = `${btnBase} rounded-full bg-coral px-6 py-3 text-white shadow-pop hover:-translate-y-0.5 hover:bg-coral-600`;

export const altBtnCls = `${btnBase} rounded-full border-2 border-ink/10 bg-white px-6 py-3 text-ink hover:-translate-y-0.5 hover:border-coral hover:text-coral`;

export const primaryBtnCls = `${btnBase} rounded-full flex-1 bg-coral px-4 py-2.5 text-white shadow-pop hover:bg-coral-600 active:scale-[0.98]`;

export const secondaryBtnCls = `${btnBase} rounded-full flex-1 border-2 border-ink/10 bg-transparent px-4 py-2.5 text-ink-soft hover:border-coral hover:text-coral active:scale-[0.98]`;

export const btnPrimaryCls = `${btnBase} rounded-full bg-coral px-5 py-2.5 text-white shadow-pop hover:-translate-y-0.5 hover:bg-coral-600`;

export const btnSecondaryCls = `${btnBase} rounded-full border-2 border-ink/10 bg-transparent px-4 py-2.5 text-ink-soft hover:-translate-y-0.5 hover:border-coral hover:text-coral`;

export const addBtnCls =
  "mt-3 w-full cursor-pointer rounded-2xl border-2 border-dashed border-coral/40 bg-coral-50 px-5 py-3 font-display text-[0.82rem] font-semibold text-coral-600 transition-colors hover:border-coral hover:bg-coral-100";

export const ghostBtnCls =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-full border-2 border-ink/10 bg-white px-3 py-1.5 font-display text-[0.74rem] font-medium text-ink-soft no-underline transition-colors active:scale-[0.97] hover:border-coral hover:text-coral";

export const ghostBtnGreenCls =
  "inline-flex cursor-pointer items-center gap-1 rounded-full border-2 border-ink/10 bg-white px-3 py-1.5 font-display text-[0.74rem] font-medium text-ink-soft no-underline transition-colors active:scale-[0.97] hover:border-fresh hover:text-fresh-600";

export const linkBtnCls = ghostBtnCls;

export const dqBtnCls =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-full border-2 border-berry/25 bg-berry/5 px-3 py-1.5 font-display text-[0.74rem] font-medium text-berry no-underline transition-colors active:scale-[0.97] hover:border-berry hover:bg-berry/10";

export const removeBtnCls =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-full border-2 border-berry/20 bg-transparent px-3 py-1.5 font-display text-[0.74rem] font-medium text-berry no-underline transition-colors active:scale-[0.97] hover:border-berry hover:bg-berry/10";

export const chipCls =
  "inline-flex flex-shrink-0 cursor-pointer items-center gap-1.5 rounded-full border-2 border-ink/10 bg-white px-3.5 py-1.5 font-display text-[0.76rem] font-medium text-ink-soft transition-colors duration-150 hover:border-coral hover:text-coral disabled:cursor-default disabled:opacity-40";

export const filterChipCls = chipCls;

export const filterChipActiveCls = "!border-coral !bg-coral !text-white font-semibold";

export const chipActiveCls = "!border-coral !bg-coral !text-white font-semibold";

export const modeChipActiveCls = "!border-sunny-600 !bg-sunny !text-ink font-semibold";

export const cardBaseShadowCls = "shadow-card";

export const cardWarmSurfaceCls = "";

export const cardHoverCls =
  "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-pop";

export const groupBtnCls =
  "flex h-7 w-7 flex-shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-ink/10 bg-white text-base leading-none text-coral transition-colors hover:border-coral disabled:cursor-default disabled:opacity-30";

/** Distance/tag pill on spot cards. */
export const tagCls =
  "rounded-full border border-ink/10 bg-cream-200 px-2.5 py-[3px] font-body text-[0.72rem] leading-snug text-ink-soft";

export const kickerCls = "font-display text-[0.7rem] font-bold uppercase tracking-[0.08em] text-coral";

/** Walk-time badge — always visible on a card, the app's signature stat. */
export const walkBadgeCls =
  "inline-flex items-center gap-1 rounded-full bg-fresh-100 px-2.5 py-1 font-display text-[0.74rem] font-bold text-fresh-600";
