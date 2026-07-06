"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap } from "leaflet";

// A small, mostly non-interactive "snapshot" of where a restaurant sits in
// the city - zoomed out further than the full-detail /restaurants map view,
// and with interaction disabled so it reads as a preview image rather than
// something you're meant to pan/zoom around in.
export function LocationSnapshot({
  lat,
  lng,
  address,
}: {
  lat: number | null;
  lng: number | null;
  address: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  const googleMapsUrl =
    lat != null && lng != null
      ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  useEffect(() => {
    if (lat == null || lng == null) return;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        zoomControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
        boxZoom: false,
        keyboard: false,
      }).setView([lat, lng], 13);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const icon = L.divIcon({
        className: "",
        html:
          '<div style="width:16px;height:16px;border-radius:50%;background:#b65a3a;' +
          'border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4);"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      L.marker([lat, lng], { icon }).addTo(map);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [lat, lng]);

  return (
    <div>
      {lat != null && lng != null && (
        <div ref={containerRef} className="h-48 w-full rounded border border-rule" />
      )}
      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-block text-sm text-ink-soft underline"
      >
        View on Google Maps →
      </a>
    </div>
  );
}
