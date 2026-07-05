-- "Browse by category" (post-v1.0): a dedicated tag lookup, mirroring
-- search_menu_items' shape/logic so the search page can render both paths
-- identically. Originally implemented as two app-side queries (fetch
-- matching item IDs via menu_item_tags, then fetch ratings via .in(ids)),
-- but that breaks for any popular tag - "Pizza" alone matches 115+ items,
-- and passing that many UUIDs through a PostgREST .in() filter produces a
-- ~23KB request URL that exceeds the HTTP header size limit
-- (HeadersOverflowError, hit for real during Playwright verification).
-- Doing the join server-side avoids ever shipping a large ID list at all.

create function public.search_menu_items_by_tag(target_tag_id uuid)
returns table (
  id uuid,
  name text,
  price numeric,
  currency text,
  category text,
  restaurant_id uuid,
  restaurant_name text,
  avg_score numeric,
  rating_count bigint
)
language sql
stable
as $$
  select
    mi.id,
    mi.name,
    mi.price,
    mi.currency,
    mi.category,
    mi.restaurant_id,
    r.name as restaurant_name,
    mir.avg_score,
    mir.rating_count
  from public.menu_item_tags mit
  join public.menu_items mi on mi.id = mit.menu_item_id
  join public.restaurants r on r.id = mi.restaurant_id
  left join public.menu_item_ratings mir on mir.menu_item_id = mi.id
  where mit.tag_id = target_tag_id
    and mi.is_active
  order by mir.avg_score desc nulls last, mi.name asc
  limit 200;
$$;

grant execute on function public.search_menu_items_by_tag(uuid) to anon, authenticated;
