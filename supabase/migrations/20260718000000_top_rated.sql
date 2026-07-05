-- Powers a short "top restaurants / top dishes" teaser on the search page's
-- empty state (previously just a blank instruction line). A minimum rating
-- count keeps a single 5-star rating from a lone item outranking everything
-- - the same "confidence" concern the spec already flags for brand rating
-- rollups.

create function public.top_rated_dishes(result_limit integer default 6, min_ratings integer default 2)
returns table (
  id uuid,
  name text,
  price numeric,
  currency text,
  restaurant_id uuid,
  restaurant_name text,
  avg_score numeric,
  rating_count bigint
)
language sql
stable
as $$
  select mi.id, mi.name, mi.price, mi.currency, mi.restaurant_id, r.name as restaurant_name,
    mir.avg_score, mir.rating_count
  from public.menu_item_ratings mir
  join public.menu_items mi on mi.id = mir.menu_item_id
  join public.restaurants r on r.id = mi.restaurant_id
  where mi.is_active and r.status = 'active' and mir.rating_count >= min_ratings
  order by mir.avg_score desc, mir.rating_count desc
  limit result_limit;
$$;

create function public.top_rated_restaurants(result_limit integer default 5, min_ratings integer default 3)
returns table (
  id uuid,
  name text,
  address text,
  avg_score numeric,
  rating_count bigint
)
language sql
stable
as $$
  select r.id, r.name, r.address,
    round(avg(rt.score)::numeric, 2) as avg_score,
    count(rt.*) as rating_count
  from public.restaurants r
  join public.menu_items mi on mi.restaurant_id = r.id
  join public.ratings rt on rt.menu_item_id = mi.id
  where r.status = 'active'
  group by r.id, r.name, r.address
  having count(rt.*) >= min_ratings
  order by avg_score desc, rating_count desc
  limit result_limit;
$$;

grant execute on function public.top_rated_dishes(integer, integer) to anon, authenticated;
grant execute on function public.top_rated_restaurants(integer, integer) to anon, authenticated;
