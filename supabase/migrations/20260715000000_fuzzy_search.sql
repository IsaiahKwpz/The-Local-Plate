-- Plain ilike substring matching fails on things like "moxies" not matching
-- "Moxie's" (the apostrophe breaks contiguous substring matching), or any
-- ordinary typo. pg_trgm (already installed for restaurant dedup, see
-- 20260710000000) gives us word_similarity(), which scores a search term
-- against the best-matching substring of a longer string - a much closer
-- fit for "does this query belong to this name" than similarity(), which
-- penalizes a short query against a long name. ilike stays as an OR so
-- exact substring matches are never dropped by the similarity threshold.

create or replace function public.search_restaurants(search_query text)
returns table (
  id uuid,
  name text,
  address text,
  type text,
  status text
)
language sql
stable
as $$
  select id, name, address, type, status
  from public.restaurants
  where name ilike '%' || search_query || '%'
     or word_similarity(search_query, name) > 0.3
  order by word_similarity(search_query, name) desc, name asc
  limit 50;
$$;

grant execute on function public.search_restaurants(text) to anon, authenticated;

create or replace function public.search_menu_items(search_query text)
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
