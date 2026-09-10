import type { ReactNode } from "react";

export default function EmptyState({ icon, title, hint }: { icon: ReactNode; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-ink/10 bg-white/60 py-10 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-coral-50 text-coral">{icon}</div>
      <div className="font-display text-[0.92rem] font-semibold text-ink">{title}</div>
      {hint && <div className="text-[0.8rem] text-ink-faint">{hint}</div>}
    </div>
  );
}
