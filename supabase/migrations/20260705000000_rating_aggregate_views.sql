-- Rating aggregates for the discovery/read pages (spec Section 6: "each item
-- showing avg rating + count") and the chain vs. independent split (Section 7:
-- "This location" vs "All [Brand] locations", exact item-name match for v1).
-- security_invoker so these views enforce the querying role's RLS on
-- public.ratings rather than the view owner's — matches the rest of the
-- schema's "grants + RLS" posture from the earlier migrations.

create view public.menu_item_ratings
with (security_invoker = true) as
select
  menu_item_id,
  round(avg(score)::numeric, 2) as avg_score,
  count(*) as rating_count
from public.ratings
group by menu_item_id;

create view public.brand_item_ratings
with (security_invoker = true) as
select
  r.brand_id,
  mi.name as item_name,
  round(avg(rt.score)::numeric, 2) as avg_score,
  count(*) as rating_count
from public.ratings rt
join public.menu_items mi on mi.id = rt.menu_item_id
join public.restaurants r on r.id = mi.restaurant_id
where r.brand_id is not null
group by r.brand_id, mi.name;

grant select on public.menu_item_ratings to anon, authenticated;
grant select on public.brand_item_ratings to anon, authenticated;
