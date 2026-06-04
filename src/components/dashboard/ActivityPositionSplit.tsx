"use client";

import { MarketActivity } from "@/types/dashboard";
import MarketActivityList from "./MarketActivityList";
import OpenPositionList from "./OpenPositionList";
import type { OpenPosition } from "@/types/dashboard";

interface ActivityPositionSplitProps {
  markets: MarketActivity[];
  positions: OpenPosition[];
}

export default function ActivityPositionSplit({
  markets,
  positions,
}: ActivityPositionSplitProps) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <div className="min-h-[280px]">
        <MarketActivityList markets={markets} />
      </div>
      <div className="min-h-[280px]">
        <OpenPositionList positions={positions} />
      </div>
    </div>
  );
}
