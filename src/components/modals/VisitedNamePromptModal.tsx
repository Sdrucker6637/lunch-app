"use client";

import { useLunch } from "@/lib/lunch-context";
import Modal from "./Modal";
import { inputCls, primaryBtnCls, secondaryBtnCls } from "@/lib/ui";

export default function VisitedNamePromptModal() {
  const {
    showVisitedNamePrompt,
    setShowVisitedNamePrompt,
    visitedNameInput,
    setVisitedNameInput,
    visitedHoodInput,
    setVisitedHoodInput,
    startPlacesLookup,
  } = useLunch();

  if (!showVisitedNamePrompt) return null;

  return (
    <Modal onClose={() => setShowVisitedNamePrompt(false)}>
      <h3 className="mt-0 font-display text-lg font-bold text-ink">Where did you eat?</h3>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!visitedNameInput.trim()) return;
          setShowVisitedNamePrompt(false);
          startPlacesLookup({
            name: visitedNameInput.trim(),
            neighborhood: visitedHoodInput.trim(),
            _placeIntent: "visited",
          });
          setVisitedNameInput("");
          setVisitedHoodInput("");
        }}
      >
        <div className="mb-2.5 flex flex-col gap-1">
          <label className="font-display text-[0.68rem] font-semibold uppercase tracking-[0.05em] text-ink-faint">
            Restaurant name
          </label>
          <input
            className={inputCls}
            required
            autoFocus
            placeholder="e.g. Joe's Pizza"
            value={visitedNameInput}
            onChange={(e) => setVisitedNameInput(e.target.value)}
          />
        </div>
        <div className="mb-2.5 flex flex-col gap-1">
          <label className="font-display text-[0.68rem] font-semibold uppercase tracking-[0.05em] text-ink-faint">
            Neighborhood (optional)
          </label>
          <input
            className={inputCls}
            placeholder="e.g. Hell's Kitchen"
            value={visitedHoodInput}
            onChange={(e) => setVisitedHoodInput(e.target.value)}
          />
        </div>
        <div className="mt-4 flex gap-2.5">
          <button type="button" className={secondaryBtnCls} onClick={() => setShowVisitedNamePrompt(false)}>
            Cancel
          </button>
          <button type="submit" className={primaryBtnCls}>
            Look up
          </button>
        </div>
      </form>
    </Modal>
  );
}
