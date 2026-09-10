"use client";

import { useLunch } from "@/lib/lunch-context";
import SearchPanel from "./SearchPanel";
import SuggestionCard from "./SuggestionCard";
import SpotCard from "./SpotCard";
import TabIntro from "./TabIntro";
import EmptyState from "./EmptyState";
import { addBtnCls, kickerCls } from "@/lib/ui";
import Icon from "./Icon";
import { MAX_WALK_MINUTES } from "@/lib/constants";

export default function ExploreView() {
  const {
    searching,
    searchDone,
    searchResults,
    enrichingNames,
    filteredToTry,
    fetchingIds,
    startManualAdd,
    addSuggestionToWishlist,
    rankSuggestion,
    markVisited,
    removeSpot,
  } = useLunch();

  return (
    <div>
      <TabIntro
        title="Where Should We Eat?"
        sub={`Search for what you're craving, roll the dice for a surprise pick, or add a spot by name — every result is within a ${MAX_WALK_MINUTES}-minute walk of the office.`}
      />

      <SearchPanel />

      {searching && <EmptyState icon={<Icon name="walk" size={18} />} title="Checking walking routes…" hint="This takes a moment" />}
      {searchDone && !searching && searchResults.length === 0 && (
        <EmptyState icon={<Icon name="xCircle" size={18} />} title="No fresh matches came back." hint="Try a different craving" />
      )}
      {searchResults.length > 0 && (
        <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
          {searchResults.map((s) => (
            <SuggestionCard
              key={s.name}
              s={s}
              isEnriching={enrichingNames.has(s.name)}
              onWishlist={() => addSuggestionToWishlist(s)}
              onVisited={() => rankSuggestion(s)}
            />
          ))}
        </div>
      )}

      <button className={addBtnCls} onClick={() => startManualAdd("wishlist")}>
        + Add to Want to Try by name
      </button>

      <div className="mt-10 mb-1">
        <div className={kickerCls}>WANT TO TRY</div>
        <div className="mt-1.5 flex items-center gap-3">
          <h2 className="m-0 font-display text-2xl tracking-wide text-ink">Your List</h2>
          <div className="h-[3px] flex-1 rounded-full bg-ink/10" />
          <span className="rounded-full border-2 border-ink bg-paper-100 px-2.5 py-0.5 font-display text-[0.72rem] tracking-wide text-ink-soft">
            {filteredToTry.length} SPOT{filteredToTry.length === 1 ? "" : "S"}
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {filteredToTry.length === 0 && (
          <EmptyState icon={<Icon name="ledger" size={18} />} title="Nothing on the list yet." hint="Use the button above to add one" />
        )}
        {filteredToTry.map((s) => (
          <SpotCard
            key={s.id}
            s={s}
            isFetching={fetchingIds.has(s.id)}
            onNameClick={() => {
              if (s.mapsLink) window.open(s.mapsLink, "_blank");
            }}
            onEdit={() => markVisited(s)}
            editLabel="I tried it"
            onDelete={() => removeSpot(s.id)}
          />
        ))}
      </div>
    </div>
  );
}
