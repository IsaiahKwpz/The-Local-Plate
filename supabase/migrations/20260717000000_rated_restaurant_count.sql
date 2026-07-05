-- The homepage's "N restaurants rated" stat was actually counting every
-- active restaurant, rated or not - true today only by coincidence (every
-- restaurant happens to have at least one rated item). Give it its own
-- accurate count: distinct active restaurants with at least one rated menu
-- item, computed in SQL since PostgREST can't express an "exists in a
-- joined table" filter without a function.

create function public.count_rated_restaurants()
returns bigint
language sql
stable
as $$
  select count(distinct mi.restaurant_id)
  from public.menu_items mi
  join public.ratings r on r.menu_item_id = mi.id
  join public.restaurants res on res.id = mi.restaurant_id
  where res.status = 'active';
$$;

grant execute on function public.count_rated_restaurants() to anon, authenticated;
