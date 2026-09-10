import type { ReactNode } from "react";

export default function EmptyState({ icon, title, hint }: { icon: ReactNode; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-ticket border-[2.5px] border-dashed border-ink/40 bg-paper-50/60 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-ink bg-yolk-100 text-ink">{icon}</div>
      <div className="font-display text-[1rem] tracking-wide text-ink">{title}</div>
      {hint && <div className="text-[0.82rem] text-ink-faint">{hint}</div>}
    </div>
  );
}
