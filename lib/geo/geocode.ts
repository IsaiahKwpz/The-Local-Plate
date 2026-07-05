import { createAdminClient } from "@/lib/supabase/admin";

// Same free provider as ingestion-time geocoding (scraper/geocode.mjs) -
// OSM Nominatim, no API key, chosen for zero recurring cost pre-revenue.
// Usage policy caps requests at 1/second and expects results to be reused
// rather than re-fetched, hence geocode_cache: the admin client is used
// here (not the RLS-scoped request client) purely to write to that cache
// table from a normal page render, not for any moderation-level access.
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "TheLocalPlate/0.1 (+https://github.com/IsaiahKwpz/The-Local-Plate)";

function normalizeAddress(address: string): string {
  return address.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const key = normalizeAddress(address);
  if (!key) return null;

  const admin = createAdminClient();

  const { data: cached } = await admin
    .from("geocode_cache")
    .select("lat, lng")
    .eq("address_key", key)
    .maybeSingle();
  if (cached) return { lat: cached.lat, lng: cached.lng };

  const url = `${NOMINATIM_URL}?format=json&limit=1&q=${encodeURIComponent(address)}`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) return null;

  const results = (await res.json()) as { lat: string; lon: string }[];
  if (!results.length) return null;

  const coords = { lat: Number(results[0].lat), lng: Number(results[0].lon) };

  await admin.from("geocode_cache").upsert({ address_key: key, lat: coords.lat, lng: coords.lng });

  return coords;
}
