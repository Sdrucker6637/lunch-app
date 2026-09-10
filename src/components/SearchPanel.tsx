"use client";

import { useLunch } from "@/lib/lunch-context";
import { inputCls, findBtnCls, altBtnCls } from "@/lib/ui";
import Icon from "./Icon";

export default function SearchPanel() {
  const { exploreQuery, setExploreQuery, searching, runExplore, runSurprise } = useLunch();

  return (
    <div className="my-4 rounded-3xl border-2 border-ink/5 bg-white p-4 shadow-card sm:p-5">
      <input
        className={inputCls}
        placeholder="Craving something specific? (ramen, salad, tacos…)"
        value={exploreQuery}
        onChange={(e) => setExploreQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") runExplore();
        }}
      />
      <div className="mt-4 flex flex-col gap-y-3 sm:flex-row sm:items-start sm:gap-x-3">
        <div className="flex flex-col gap-1 sm:flex-1">
          <button className={findBtnCls} onClick={runExplore} disabled={searching}>
            <Icon name="search" size={14} />
            {searching ? "Searching…" : "Explore"}
          </button>
          <span className="text-center font-display text-[0.72rem] italic text-ink-faint">Know what you&apos;re after? Type it in.</span>
        </div>
        <div className="flex flex-col gap-1 sm:flex-1">
          <button className={altBtnCls} onClick={runSurprise} disabled={searching}>
            <Icon name="dice" size={14} /> Surprise Me
          </button>
          <span className="text-center font-display text-[0.72rem] italic text-ink-faint">Let fate pick lunch.</span>
        </div>
      </div>
    </div>
  );
}
