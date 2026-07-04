-- Dish/tag half of the unified search (spec Section 6): a menu item matches
-- either by its own name or by an applied dish_type/cuisine/attribute tag,
-- so "ramen" finds a "Tonkotsu Bowl" tagged ramen even if the name doesn't
-- contain the word. Lives in SQL rather than app code because it needs an
-- OR across a joined table, which PostgREST's query builder can't express
-- directly. Restaurant-name search (the other half) is a plain ilike and
-- doesn't need a function.

create function public.search_menu_items(search_query text)
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
  -- DISTINCT ON dedupes an item matched via multiple tags; it forces the
  -- ORDER BY to start with mi.id, so the real "sorted by rating" ordering
  -- has to happen in an outer query over the deduped set.
  with matched as (
    select distinct on (mi.id)
      mi.id,
      mi.name,
      mi.price,
      mi.currency,
      mi.category,
      mi.restaurant_id,
      r.name as restaurant_name,
      mir.avg_score,
      mir.rating_count
    from public.menu_items mi
    join public.restaurants r on r.id = mi.restaurant_id
    left join public.menu_item_ratings mir on mir.menu_item_id = mi.id
    left join public.menu_item_tags mit on mit.menu_item_id = mi.id
    left join public.tags t on t.id = mit.tag_id
    where mi.is_active
      and (mi.name ilike '%' || search_query || '%' or t.name ilike '%' || search_query || '%')
    order by mi.id
  )
  select * from matched
  order by avg_score desc nulls last, name asc
  limit 50;
$$;

grant execute on function public.search_menu_items(text) to anon, authenticated;
