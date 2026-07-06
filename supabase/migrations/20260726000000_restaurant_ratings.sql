-- Overall (whole-restaurant) reviews, separate from the existing per-dish
-- ratings table - a restaurant can be great overall without every dish
-- being individually rated, and vice versa. Mirrors ratings' shape/RLS/rate-
-- limit exactly, scoped to restaurant_id instead of menu_item_id. Lower
-- priority than the per-dish system per product decision, so no sub-category
-- scores and no anomaly/burst-detection trigger here - just the core
-- rate-and-comment loop plus the same upsert-aware daily rate limit.

create table public.restaurant_ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  score smallint not null check (score between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, restaurant_id)
);

create index restaurant_ratings_restaurant_id_idx on public.restaurant_ratings (restaurant_id);

alter table public.restaurant_ratings enable row level security;

create policy "restaurant ratings are publicly readable"
  on public.restaurant_ratings for select
  using (true);

create policy "users can rate restaurants as themselves"
  on public.restaurant_ratings for insert
  with check (auth.uid() = user_id);

create policy "users can update their own restaurant rating"
  on public.restaurant_ratings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Same upsert-aware daily cap as enforce_rating_rate_limit (step 6/6.1) - a
-- BEFORE INSERT trigger fires even on an ON CONFLICT DO UPDATE path, so
-- re-rating (an update in practice) must not count against the new-rating
-- limit.
create function public.enforce_restaurant_rating_rate_limit()
returns trigger
language plpgsql
as $$
declare
  daily_limit constant integer := 20;
  recent_count integer;
  already_rated boolean;
begin
  select exists (
    select 1 from public.restaurant_ratings
    where user_id = new.user_id and restaurant_id = new.restaurant_id
  ) into already_rated;

  if already_rated then
    return new;
  end if;

  select count(*) into recent_count
  from public.restaurant_ratings
  where user_id = new.user_id
    and created_at > now() - interval '24 hours';

  if recent_count >= daily_limit then
    raise exception 'Rate limit exceeded: you can submit up to % new restaurant ratings per 24 hours.', daily_limit;
  end if;

  return new;
end;
$$;

create trigger restaurant_ratings_rate_limit
  before insert on public.restaurant_ratings
  for each row execute function public.enforce_restaurant_rating_rate_limit();

create view public.restaurant_ratings_agg
with (security_invoker = true) as
select
  restaurant_id,
  round(avg(score)::numeric, 2) as avg_score,
  count(*) as rating_count
from public.restaurant_ratings
group by restaurant_id;

grant select on public.restaurant_ratings_agg to anon, authenticated;
