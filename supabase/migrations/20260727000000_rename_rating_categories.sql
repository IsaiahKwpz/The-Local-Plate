-- Rebrands two of the four dish sub-categories: Uniqueness -> Presentation,
-- Healthiness -> Nutrition (Taste and Value keep their names, just gain a
-- "Plate " prefix in the UI). This is a real column rename, not just a UI
-- relabel - "Presentation" is a genuinely different axis than "Uniqueness"
-- was, so the column itself is renamed rather than leaving a
-- uniqueness_score column permanently mislabeled in the UI as "Plate
-- Presentation". Safe to repurpose the existing values: every row with a
-- sub-score today is either seeded/synthetic data (random noise around the
-- overall score, not a real per-category judgement) or a handful of test
-- ratings, so there's no real "uniqueness opinion" being dishonestly
-- relabeled as a "presentation opinion".
alter table public.ratings rename column uniqueness_score to presentation_score;
alter table public.ratings rename column healthiness_score to nutrition_score;

-- CREATE OR REPLACE VIEW can't rename an existing output column (only add
-- new ones at the end), so these need a real drop + recreate.
drop view if exists public.menu_item_ratings;
drop view if exists public.brand_item_ratings;

create view public.menu_item_ratings
with (security_invoker = true) as
select
  menu_item_id,
  round(avg(score)::numeric, 2) as avg_score,
  count(*) as rating_count,
  round(avg(taste_score)::numeric, 2) as avg_taste_score,
  round(avg(value_score)::numeric, 2) as avg_value_score,
  round(avg(presentation_score)::numeric, 2) as avg_presentation_score,
  round(avg(nutrition_score)::numeric, 2) as avg_nutrition_score
from public.ratings
group by menu_item_id;

create view public.brand_item_ratings
with (security_invoker = true) as
select
  r.brand_id,
  mi.name as item_name,
  round(avg(rt.score)::numeric, 2) as avg_score,
  count(*) as rating_count,
  round(avg(rt.taste_score)::numeric, 2) as avg_taste_score,
  round(avg(rt.value_score)::numeric, 2) as avg_value_score,
  round(avg(rt.presentation_score)::numeric, 2) as avg_presentation_score,
  round(avg(rt.nutrition_score)::numeric, 2) as avg_nutrition_score
from public.ratings rt
join public.menu_items mi on mi.id = rt.menu_item_id
join public.restaurants r on r.id = mi.restaurant_id
where r.brand_id is not null
group by r.brand_id, mi.name;

grant select on public.menu_item_ratings to anon, authenticated;
grant select on public.brand_item_ratings to anon, authenticated;
