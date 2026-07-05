"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap } from "leaflet";

export type MapRestaurant = {
  id: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
};

// Ottawa - used as the fallback center when no restaurant has coordinates
// yet (fitBounds below re-centers on the real data whenever it can).
const FALLBACK_CENTER: [number, number] = [45.4215, -75.6972];

function escapeHtml(str: string) {
  const map: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return str.replace(/[&<>"']/g, (c) => map[c]);
}

export function RestaurantMap({ restaurants }: { restaurants: MapRestaurant[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;

      const withCoords = restaurants.filter(
        (r): r is MapRestaurant & { lat: number; lng: number } => r.lat != null && r.lng != null,
      );

      const map = L.map(containerRef.current).setView(FALLBACK_CENTER, 12);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const icon = L.divIcon({
        className: "",
        html:
          '<div style="width:14px;height:14px;border-radius:50%;background:#b65a3a;' +
          'border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4);"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      for (const restaurant of withCoords) {
        L.marker([restaurant.lat, restaurant.lng], { icon })
          .addTo(map)
          .bindPopup(
            `<strong>${escapeHtml(restaurant.name)}</strong><br/>${escapeHtml(restaurant.address)}` +
              `<br/><a href="/restaurants/${restaurant.id}">View restaurant &rarr;</a>`,
          );
      }

      if (withCoords.length > 0) {
        map.fitBounds(
          L.latLngBounds(withCoords.map((r) => [r.lat, r.lng] as [number, number])),
          { padding: [30, 30] },
        );
      }
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [restaurants]);

  return <div ref={containerRef} className="h-[500px] w-full rounded border border-rule" />;
}
