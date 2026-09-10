"use client";

import { useLunch } from "@/lib/lunch-context";
import MapView from "@/components/MapView";
import TabIntro from "@/components/TabIntro";

export default function MapPage() {
  const { spots } = useLunch();
  return (
    <div>
      <TabIntro title="Lunch Map" sub="Every spot plotted around the office, colored by score." />
      <MapView spots={spots || []} />
    </div>
  );
}
