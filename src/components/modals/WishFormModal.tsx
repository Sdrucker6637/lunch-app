"use client";

import { useLunch } from "@/lib/lunch-context";
import Modal from "./Modal";
import { inputCls, primaryBtnCls, secondaryBtnCls } from "@/lib/ui";

export default function WishFormModal() {
  const { showWishForm, setShowWishForm, wishForm, setWishForm, saveWishForm } = useLunch();

  if (!showWishForm) return null;

  return (
    <Modal onClose={() => setShowWishForm(false)}>
      <h3 className="mt-0 font-display text-lg font-bold text-ink">Add to Want to Try</h3>
      <form onSubmit={saveWishForm}>
        <div className="mb-2.5 flex flex-col gap-1">
          <label className="font-display text-[0.68rem] font-semibold uppercase tracking-[0.05em] text-ink-faint">
            Name
          </label>
          <input
            className={inputCls}
            required
            value={wishForm.name}
            onChange={(e) => setWishForm({ ...wishForm, name: e.target.value })}
          />
        </div>
        <div className="mb-2.5 flex flex-col gap-1">
          <label className="font-display text-[0.68rem] font-semibold uppercase tracking-[0.05em] text-ink-faint">
            Neighborhood (optional)
          </label>
          <input
            className={inputCls}
            value={wishForm.neighborhood}
            onChange={(e) => setWishForm({ ...wishForm, neighborhood: e.target.value })}
          />
        </div>
        <div className="mb-2.5 flex flex-col gap-1">
          <label className="font-display text-[0.68rem] font-semibold uppercase tracking-[0.05em] text-ink-faint">
            Notes
          </label>
          <input
            className={inputCls}
            value={wishForm.notes}
            onChange={(e) => setWishForm({ ...wishForm, notes: e.target.value })}
          />
        </div>
        <div className="mt-4 flex gap-2.5">
          <button type="button" className={secondaryBtnCls} onClick={() => setShowWishForm(false)}>
            Cancel
          </button>
          <button type="submit" className={primaryBtnCls}>
            Add to list
          </button>
        </div>
      </form>
    </Modal>
  );
}
