-- Two new user-facing contribution surfaces: submitting a brand-new
-- restaurant, and submitting a brand-new dish on an existing restaurant.
-- Unlike editing an existing menu item (step 8's trust-gating - an
-- established user's edit goes live immediately), creating a brand-new
-- entity always queues for admin review regardless of trust score. This
-- matches the precedent already set for tags: applying an existing tag is
-- trust-gated/instant, but proposing a brand-new tag always queues since
-- "vocabulary-quality control benefits from human judgment" - the same
-- reasoning applies to a whole new restaurant or dish with no existing
-- record to anchor trust against.

alter type public.restaurant_source add value 'user_submitted';

create table public.pending_restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  lat double precision,
  lng double precision,
  submitted_by uuid not null references public.profiles (id),
  status public.edit_status not null default 'pending',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id)
);

alter table public.pending_restaurants enable row level security;

create policy "users can see their own pending restaurants"
  on public.pending_restaurants for select
  using (auth.uid() = submitted_by);

create policy "users can submit a new restaurant"
  on public.pending_restaurants for insert
  with check (auth.uid() = submitted_by);

create table public.pending_menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  name text not null,
  price numeric(10, 2),
  category text,
  description text,
  submitted_by uuid not null references public.profiles (id),
  status public.edit_status not null default 'pending',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id)
);

create index pending_menu_items_restaurant_id_idx on public.pending_menu_items (restaurant_id);

alter table public.pending_menu_items enable row level security;

create policy "users can see their own pending menu items"
  on public.pending_menu_items for select
  using (auth.uid() = submitted_by);

create policy "users can submit a new menu item"
  on public.pending_menu_items for insert
  with check (auth.uid() = submitted_by);

-- Reuses the generic per-account daily limit trigger from the pre-launch
-- hardening pass rather than one-off logic - a whole new restaurant is a
-- heavier action than a claim so its limit is tighter; a new dish is
-- comparable to a field edit so it shares that limit.
create trigger pending_restaurants_rate_limit
  before insert on public.pending_restaurants
  for each row execute function public.enforce_submission_rate_limit('submitted_by', '5', 'new restaurant submissions');

create trigger pending_menu_items_rate_limit
  before insert on public.pending_menu_items
  for each row execute function public.enforce_submission_rate_limit('submitted_by', '50', 'new dish submissions');
