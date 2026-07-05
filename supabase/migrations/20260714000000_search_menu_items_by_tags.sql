-- Multi-tag version of search_menu_items_by_tag: lets the browse sidebar
-- select several categories at once (OR match), deduping items that carry
-- more than one of the selected tags before the final sort.
create function public.search_menu_items_by_tags(target_tag_ids uuid[])
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
language sql stable
as $$
  select * from (
    select distinct on (mi.id)
      mi.id, mi.name, mi.price, mi.currency, mi.category, mi.restaurant_id,
      r.name as restaurant_name, mir.avg_score, mir.rating_count
    from public.menu_item_tags mit
    join public.menu_items mi on mi.id = mit.menu_item_id
    join public.restaurants r on r.id = mi.restaurant_id
    left join public.menu_item_ratings mir on mir.menu_item_id = mi.id
    where mit.tag_id = any(target_tag_ids) and mi.is_active
    order by mi.id
  ) matched
  order by avg_score desc nulls last, name asc
  limit 200;
$$;

grant execute on function public.search_menu_items_by_tags(uuid[]) to anon, authenticated;
