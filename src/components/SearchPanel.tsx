"use client";

import { useLunch } from "@/lib/lunch-context";
import { inputCls, findBtnCls, altBtnCls } from "@/lib/ui";
import Icon from "./Icon";

export default function SearchPanel() {
  const { exploreQuery, setExploreQuery, searching, runExplore, runSurprise } = useLunch();

  return (
    <div className="my-5 rounded-ticket border-[2.5px] border-ink bg-paper-50 p-4 shadow-stamp sm:p-5">
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
        <div className="flex flex-col gap-1.5 sm:flex-1">
          <button className={findBtnCls} onClick={runExplore} disabled={searching}>
            <Icon name="search" size={15} />
            {searching ? "Searching…" : "Explore"}
          </button>
          <span className="text-center font-display text-[0.72rem] tracking-wide text-ink-faint">Know what you&apos;re after? Type it in.</span>
        </div>
        <div className="flex flex-col gap-1.5 sm:flex-1">
          <button className={altBtnCls} onClick={runSurprise} disabled={searching}>
            <Icon name="dice" size={15} /> Surprise Me
          </button>
          <span className="text-center font-display text-[0.72rem] tracking-wide text-ink-faint">Let fate pick lunch.</span>
        </div>
      </div>
    </div>
  );
}
