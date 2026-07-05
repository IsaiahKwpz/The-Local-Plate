-- Backs "search near this address" (spec Section 6 mentions geolocation
-- distance sort as part of discovery; this is the address-typed variant).
-- Restaurants already have lat/lng from ingestion-time geocoding
-- (scraper/geocode.mjs, OSM Nominatim) - this reuses the same free
-- provider for user-typed addresses, cached so the same address string
-- never needs a second network call (Nominatim's usage policy caps at
-- 1 request/second and expects reuse rather than repeat lookups).

create table public.geocode_cache (
  address_key text primary key,
  lat double precision not null,
  lng double precision not null,
  created_at timestamptz not null default now()
);

alter table public.geocode_cache enable row level security;

create policy "geocode cache is publicly readable"
  on public.geocode_cache for select
  to anon, authenticated
  using (true);

-- Distance via the haversine formula (no PostGIS extension needed at this
-- scale). Computed in a subquery rather than a HAVING-without-GROUP-BY
-- clause so the filter reads as a plain WHERE over the derived column.
create function public.restaurants_within_radius(
  center_lat double precision,
  center_lng double precision,
  radius_km double precision
)
returns table (
  id uuid,
  name text,
  address text,
  type restaurant_type,
  brand_id uuid,
  distance_km double precision
)
language sql
stable
as $$
  select * from (
    select r.id, r.name, r.address, r.type, r.brand_id,
      6371 * acos(
        least(1.0, greatest(-1.0,
          cos(radians(center_lat)) * cos(radians(r.lat)) * cos(radians(r.lng) - radians(center_lng))
          + sin(radians(center_lat)) * sin(radians(r.lat))
        ))
      ) as distance_km
    from public.restaurants r
    where r.status = 'active' and r.lat is not null and r.lng is not null
  ) with_distance
  where distance_km <= radius_km
  order by distance_km asc
  limit 200;
$$;

grant execute on function public.restaurants_within_radius(double precision, double precision, double precision) to anon, authenticated;
