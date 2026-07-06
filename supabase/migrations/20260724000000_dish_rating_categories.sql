-- Adds optional sub-category scoring (taste/value/uniqueness/healthiness)
-- alongside the existing overall `score`. Per product decision: the overall
-- rating stays a separate, explicitly-chosen number (a dish can be great
-- overall without being "unique", or vice versa) rather than being computed
-- from the sub-scores, so `score` and its existing rate-limit/anomaly-
-- detection triggers and aggregate views need zero changes. Sub-scores are
-- nullable so the ~7,800 existing seeded ratings need no backfill - they
-- simply have no sub-category breakdown, same as any rating a user submits
-- without picking one (the app will require all four on new submissions,
-- but the column-level constraint only guards the 1-5 range, not presence).

alter table public.ratings
  add column taste_score smallint check (taste_score between 1 and 5),
  add column value_score smallint check (value_score between 1 and 5),
  add column uniqueness_score smallint check (uniqueness_score between 1 and 5),
  add column healthiness_score smallint check (healthiness_score between 1 and 5);

-- CREATE OR REPLACE VIEW can append new output columns without dropping the
-- view (existing grants/dependents are unaffected) as long as the existing
-- columns keep their names, order, and types - true here, these are added
-- at the end. avg() ignores nulls on its own, so legacy rows with no
-- sub-scores simply don't participate in these averages instead of needing
-- any special-casing.
create or replace view public.menu_item_ratings
with (security_invoker = true) as
select
  menu_item_id,
  round(avg(score)::numeric, 2) as avg_score,
  count(*) as rating_count,
  round(avg(taste_score)::numeric, 2) as avg_taste_score,
  round(avg(value_score)::numeric, 2) as avg_value_score,
  round(avg(uniqueness_score)::numeric, 2) as avg_uniqueness_score,
  round(avg(healthiness_score)::numeric, 2) as avg_healthiness_score
from public.ratings
group by menu_item_id;

create or replace view public.brand_item_ratings
with (security_invoker = true) as
select
  r.brand_id,
  mi.name as item_name,
  round(avg(rt.score)::numeric, 2) as avg_score,
  count(*) as rating_count,
  round(avg(rt.taste_score)::numeric, 2) as avg_taste_score,
  round(avg(rt.value_score)::numeric, 2) as avg_value_score,
  round(avg(rt.uniqueness_score)::numeric, 2) as avg_uniqueness_score,
  round(avg(rt.healthiness_score)::numeric, 2) as avg_healthiness_score
from public.ratings rt
join public.menu_items mi on mi.id = rt.menu_item_id
join public.restaurants r on r.id = mi.restaurant_id
where r.brand_id is not null
group by r.brand_id, mi.name;
