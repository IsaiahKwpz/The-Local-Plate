"use client";

import { useState, type ReactNode } from "react";

export function RestaurantsViewToggle({ list, map }: { list: ReactNode; map: ReactNode }) {
  const [view, setView] = useState<"list" | "map">("list");
  // Mounted only once the map has actually been shown - Leaflet measures
  // its container's size at init time, and a container hidden via
  // display:none reports zero size, breaking the initial view/fitBounds.
  const [mapEverShown, setMapEverShown] = useState(false);

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setView("list")}
          aria-pressed={view === "list"}
          className={`rounded px-3 py-1.5 text-sm font-medium transition ${
            view === "list" ? "bg-olive text-white" : "border border-rule text-ink hover:border-olive"
          }`}
        >
          List
        </button>
        <button
          type="button"
          onClick={() => {
            setView("map");
            setMapEverShown(true);
          }}
          aria-pressed={view === "map"}
          className={`rounded px-3 py-1.5 text-sm font-medium transition ${
            view === "map" ? "bg-olive text-white" : "border border-rule text-ink hover:border-olive"
          }`}
        >
          Map
        </button>
      </div>

      <div className={view === "list" ? "" : "hidden"}>{list}</div>
      {mapEverShown && <div className={view === "map" ? "" : "hidden"}>{map}</div>}
    </div>
  );
}
