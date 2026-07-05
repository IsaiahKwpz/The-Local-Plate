-- The Local Plate — initial schema (spec Section 7) + RLS policies (Section 6/11 step 1)

create extension if not exists pgcrypto;

-- ── Enums ────────────────────────────────────────────────────────────────

create type restaurant_type as enum ('independent', 'chain');
create type restaurant_status as enum ('active', 'closed', 'temporarily_closed');
create type restaurant_source as enum ('scraped', 'claimed');
create type menu_item_status as enum ('unverified', 'confirmed');
create type tag_type as enum ('dish_type', 'cuisine', 'attribute');
create type report_target_type as enum ('menu_item', 'restaurant', 'rating');
create type report_status as enum ('open', 'dismissed', 'removed');

-- ── Tables ───────────────────────────────────────────────────────────────

-- App-facing user profile. auth.users (Supabase Auth) already holds
-- credentials/email; this row holds the app-specific fields from Section 7.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  trust_score integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  lat double precision,
  lng double precision,
  type restaurant_type not null,
  brand_id uuid references public.brands (id),
  status restaurant_status not null default 'active',
  source restaurant_source not null default 'scraped',
  owner_user_id uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  constraint chain_requires_brand check (
    (type = 'chain' and brand_id is not null) or
    (type = 'independent' and brand_id is null)
  )
);

create index restaurants_brand_id_idx on public.restaurants (brand_id);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  name text not null,
  price numeric(10, 2),
  currency text not null default 'CAD',
  category text,
  description text,
  status menu_item_status not null default 'unverified',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index menu_items_restaurant_id_idx on public.menu_items (restaurant_id);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  type tag_type not null,
  created_at timestamptz not null default now()
);

create table public.menu_item_tags (
  menu_item_id uuid not null references public.menu_items (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (menu_item_id, tag_id)
);

create table public.restaurant_tags (
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (restaurant_id, tag_id)
);

create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  menu_item_id uuid not null references public.menu_items (id) on delete cascade,
  score smallint not null check (score between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, menu_item_id)
);

create index ratings_menu_item_id_idx on public.ratings (menu_item_id);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  target_type report_target_type not null,
  target_id uuid not null,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null,
  status report_status not null default 'open',
  created_at timestamptz not null default now()
);

create index reports_target_idx on public.reports (target_type, target_id);

create table public.edit_logs (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references public.menu_items (id) on delete cascade,
  user_id uuid not null references public.profiles (id),
  field text not null,
  old_value text,
  new_value text,
  created_at timestamptz not null default now()
);

create index edit_logs_menu_item_id_idx on public.edit_logs (menu_item_id);

-- ── Auto-create profile row on signup ───────────────────────────────────

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Keep ratings.updated_at current on re-rate ──────────────────────────

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger ratings_set_updated_at
  before update on public.ratings
  for each row execute function public.set_updated_at();

-- ── Row Level Security ───────────────────────────────────────────────────
-- Discovery (Section 6) requires no account, so all read-heavy tables get
-- public select policies. Writes stay locked down to the service role
-- (scraper, admin moderation) until later build-order steps add scoped
-- policies for contribution/claim flows.

alter table public.profiles enable row level security;
alter table public.brands enable row level security;
alter table public.restaurants enable row level security;
alter table public.menu_items enable row level security;
alter table public.tags enable row level security;
alter table public.menu_item_tags enable row level security;
alter table public.restaurant_tags enable row level security;
alter table public.ratings enable row level security;
alter table public.reports enable row level security;
alter table public.edit_logs enable row level security;

-- profiles: public read (display names shown alongside ratings), self-update only
create policy "profiles are publicly readable"
  on public.profiles for select
  using (true);

create policy "users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- brands / restaurants / menu_items / tags / tag links: public read only
create policy "brands are publicly readable"
  on public.brands for select
  using (true);

create policy "restaurants are publicly readable"
  on public.restaurants for select
  using (true);

create policy "menu items are publicly readable"
  on public.menu_items for select
  using (true);

create policy "tags are publicly readable"
  on public.tags for select
  using (true);

create policy "menu item tags are publicly readable"
  on public.menu_item_tags for select
  using (true);

create policy "restaurant tags are publicly readable"
  on public.restaurant_tags for select
  using (true);

-- ratings: public read; a user may only create/update their own rating
create policy "ratings are publicly readable"
  on public.ratings for select
  using (true);

create policy "users can rate as themselves"
  on public.ratings for insert
  with check (auth.uid() = user_id);

create policy "users can update their own rating"
  on public.ratings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- reports: reporter can file and see their own; moderation queue reads via service role
create policy "users can see their own reports"
  on public.reports for select
  using (auth.uid() = reporter_id);

create policy "users can file reports as themselves"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

-- edit_logs: public accountability trail, append-only by the acting user
create policy "edit log is publicly readable"
  on public.edit_logs for select
  using (true);

create policy "users can log their own edits"
  on public.edit_logs for insert
  with check (auth.uid() = user_id);
