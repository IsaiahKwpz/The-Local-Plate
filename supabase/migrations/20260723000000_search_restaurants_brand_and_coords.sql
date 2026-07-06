-- search_restaurants only returned enough columns to render a flat list, so
-- a chain match (e.g. "Lone Star Texas Grill") showed one near-identical
-- card per location. Adding brand_id/brand_name lets the app group results
-- by brand the same way search_menu_items results already do (see
-- groupSearchResults), and lat/lng lets the same matches be plotted on the
-- existing Leaflet map component instead of only the full /restaurants list.
-- Return shape changes, so the function must be dropped and recreated
-- rather than CREATE OR REPLACE'd.

drop function if exists public.search_restaurants(text);

create function public.search_restaurants(search_query text)
returns table (
  id uuid,
  name text,
  address text,
  type text,
  status text,
  brand_id uuid,
  brand_name text,
  lat double precision,
  lng double precision
)
language sql
stable
as $$
  select r.id, r.name, r.address, r.type, r.status, r.brand_id, b.name, r.lat, r.lng
  from public.restaurants r
  left join public.brands b on b.id = r.brand_id
  where r.name ilike '%' || search_query || '%'
     or word_similarity(search_query, r.name) > 0.3
  order by word_similarity(search_query, r.name) desc, r.name asc
  limit 50;
$$;

grant execute on function public.search_restaurants(text) to anon, authenticated;
