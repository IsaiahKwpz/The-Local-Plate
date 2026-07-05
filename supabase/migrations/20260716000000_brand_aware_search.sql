-- Search results grouped dish cards one-per-location for chains (e.g. eight
-- "Lone Star Texas Grill" cards in a row). Adding brand_id/brand_name to the
-- search RPCs lets the app group by brand instead - the same Brand concept
-- the spec already uses for "This location" vs "All [Brand] locations"
-- rating rollups (see 20260705000000_rating_aggregate_views.sql).

drop function if exists public.search_menu_items(text);

create function public.search_menu_items(search_query text)
returns table (
  id uuid,
  name text,
  price numeric,
  currency text,
  category text,
  restaurant_id uuid,
  restaurant_name text,
  brand_id uuid,
  brand_name text,
  avg_score numeric,
  rating_count bigint
)
language sql
stable
as $$
  with matched as (
    select distinct on (mi.id)
      mi.id,
      mi.name,
      mi.price,
      mi.currency,
      mi.category,
      mi.restaurant_id,
      r.name as restaurant_name,
      r.brand_id,
      b.name as brand_name,
      mir.avg_score,
      mir.rating_count
    from public.menu_items mi
    join public.restaurants r on r.id = mi.restaurant_id
    left join public.brands b on b.id = r.brand_id
    left join public.menu_item_ratings mir on mir.menu_item_id = mi.id
    left join public.menu_item_tags mit on mit.menu_item_id = mi.id
    left join public.tags t on t.id = mit.tag_id
    where mi.is_active
      and (
        mi.name ilike '%' || search_query || '%'
        or t.name ilike '%' || search_query || '%'
        or word_similarity(search_query, mi.name) > 0.3
      )
    order by mi.id
  )
  select * from matched
  order by avg_score desc nulls last, name asc
  limit 50;
$$;

drop function if exists public.search_menu_items_by_tags(uuid[]);

create function public.search_menu_items_by_tags(target_tag_ids uuid[])
returns table (
  id uuid,
  name text,
  price numeric,
  currency text,
  category text,
  restaurant_id uuid,
  restaurant_name text,
  brand_id uuid,
  brand_name text,
  avg_score numeric,
  rating_count bigint
)
language sql stable
as $$
  select * from (
    select distinct on (mi.id)
      mi.id, mi.name, mi.price, mi.currency, mi.category, mi.restaurant_id,
      r.name as restaurant_name, r.brand_id, b.name as brand_name,
      mir.avg_score, mir.rating_count
    from public.menu_item_tags mit
    join public.menu_items mi on mi.id = mit.menu_item_id
    join public.restaurants r on r.id = mi.restaurant_id
    left join public.brands b on b.id = r.brand_id
    left join public.menu_item_ratings mir on mir.menu_item_id = mi.id
    where mit.tag_id = any(target_tag_ids) and mi.is_active
    order by mi.id
  ) matched
  order by avg_score desc nulls last, name asc
  limit 200;
$$;

grant execute on function public.search_menu_items(text) to anon, authenticated;
grant execute on function public.search_menu_items_by_tags(uuid[]) to anon, authenticated;
