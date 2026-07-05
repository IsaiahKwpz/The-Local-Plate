-- Dietary (attribute) tags need to combine with dish-type (category) tags
-- as separate facets, not one flat OR: picking "Vegan" + "Pizza" should mean
-- vegan AND pizza, not everything vegan plus everything pizza. Within a
-- facet, selecting multiple stays OR ("Vegan" + "Vegetarian" -> either).
-- Replaces search_menu_items_by_tags with a two-array version; an empty
-- array for either facet skips that filter entirely.

drop function if exists public.search_menu_items_by_tags(uuid[]);

create function public.search_menu_items_by_tags(category_tag_ids uuid[], diet_tag_ids uuid[] default '{}')
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
  select * from (
    select distinct on (mi.id)
      mi.id, mi.name, mi.price, mi.currency, mi.category, mi.restaurant_id,
      r.name as restaurant_name, r.brand_id, b.name as brand_name,
      mir.avg_score, mir.rating_count
    from public.menu_items mi
    join public.restaurants r on r.id = mi.restaurant_id
    left join public.brands b on b.id = r.brand_id
    left join public.menu_item_ratings mir on mir.menu_item_id = mi.id
    where mi.is_active
      and (
        cardinality(category_tag_ids) = 0
        or exists (
          select 1 from public.menu_item_tags mit
          where mit.menu_item_id = mi.id and mit.tag_id = any(category_tag_ids)
        )
      )
      and (
        cardinality(diet_tag_ids) = 0
        or exists (
          select 1 from public.menu_item_tags mit
          where mit.menu_item_id = mi.id and mit.tag_id = any(diet_tag_ids)
        )
      )
    order by mi.id
  ) matched
  order by avg_score desc nulls last, name asc
  limit 200;
$$;

grant execute on function public.search_menu_items_by_tags(uuid[], uuid[]) to anon, authenticated;
