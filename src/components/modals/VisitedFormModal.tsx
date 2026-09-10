"use client";

import { useLunch } from "@/lib/lunch-context";
import Modal from "./Modal";
import { inputCls, primaryBtnCls, secondaryBtnCls } from "@/lib/ui";
import { fmtWalk } from "@/lib/scoring";

export default function VisitedFormModal() {
  const { showVisitedForm, setShowVisitedForm, visitedForm, setVisitedForm, saveVisitedForm, visitedSuggestion } =
    useLunch();

  if (!showVisitedForm) return null;

  const set = (patch: Partial<typeof visitedForm>) => setVisitedForm({ ...visitedForm, ...patch });

  const scoreFields: Array<[string, keyof typeof visitedForm]> = [
    ["Vibe (0-10)", "vibe"],
    ["Value (0-10)", "value"],
    ["Service (0-10)", "service"],
    ["Food (0-10)", "food"],
  ];

  return (
    <Modal onClose={() => setShowVisitedForm(false)}>
      <h3 className="mt-0 font-display text-xl tracking-wide text-ink">
        {visitedForm.id ? "Rate this spot" : "Rate a spot you tried"}
      </h3>
      {visitedSuggestion?.walkMinutes != null && (
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-pickle-100 px-3 py-1 font-display text-[0.74rem] tracking-wide text-pickle-600">
          🚶 {fmtWalk(visitedSuggestion.walkMinutes)} walk — distance score is automatic
        </p>
      )}
      <form onSubmit={saveVisitedForm} className="mt-4">
        <div className="mb-2.5 flex flex-col gap-1">
          <label className="font-display text-[0.68rem] tracking-[0.05em] text-ink-faint">
            NAME
          </label>
          <input className={inputCls} required value={visitedForm.name} onChange={(e) => set({ name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {scoreFields.map(([label, key]) => (
            <div key={key} className="mb-2.5 flex flex-col gap-1">
              <label className="font-display text-[0.68rem] tracking-[0.05em] text-ink-faint">
                {label.toUpperCase()}
              </label>
              <input
                className={inputCls}
                type="number"
                step="0.5"
                min="0"
                max="10"
                value={visitedForm[key] as string}
                onChange={(e) => set({ [key]: e.target.value })}
              />
            </div>
          ))}
        </div>
        <div className="mb-2.5 flex flex-col gap-1">
          <label className="font-display text-[0.68rem] tracking-[0.05em] text-ink-faint">
            NOTES
          </label>
          <input className={inputCls} value={visitedForm.notes} onChange={(e) => set({ notes: e.target.value })} />
        </div>
        <div className="mt-4 flex gap-2.5">
          <button type="button" className={secondaryBtnCls} onClick={() => setShowVisitedForm(false)}>
            Cancel
          </button>
          <button type="submit" className={primaryBtnCls}>
            {visitedForm.id ? "Save rating" : "Add to rankings"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
