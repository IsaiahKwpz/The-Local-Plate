-- Build Order step 10 (spec Section 11, "Restaurant claim flow" / Phase 3 in
-- Section 5): "Owner claims listing, can edit directly, optionally can
-- require approval on further crowd edits to their own listing. Also acts
-- as a legal safety valve - claiming implies consent to be listed."
--
-- `restaurants.owner_user_id` and `restaurants.source` ('scraped'/'claimed')
-- already exist from the initial schema (step 1) but were never wired up -
-- this migration is what actually populates and acts on them. Claims go
-- through the same "pending row + admin approval via service role" shape as
-- pending_edits/pending_tags (step 8) rather than any automated business
-- verification (e.g. domain-matched email) - there's no such integration at
-- this stage, and a human reviewing a claim is the safer default than
-- letting anyone self-certify ownership.

create table public.restaurant_claims (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  message text,
  status public.edit_status not null default 'pending',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id)
);

create index restaurant_claims_restaurant_id_idx on public.restaurant_claims (restaurant_id);

alter table public.restaurant_claims enable row level security;

create policy "users can see their own claims"
  on public.restaurant_claims for select
  using (auth.uid() = user_id);

create policy "users can submit a claim"
  on public.restaurant_claims for insert
  with check (auth.uid() = user_id);

-- No update/delete policy for regular users - approval/rejection happens via
-- the admin service-role client, same as pending_edits/pending_tags.

-- ── Owner-controlled crowd-edit gate ─────────────────────────────────────
-- "optionally can require approval on further crowd edits to their own
-- listing" - a per-restaurant override on top of step 8's trust gating.

alter table public.restaurants
  add column require_owner_approval boolean not null default false;

-- Column-scoped, same reasoning as step 8's menu_items grant: the blanket
-- UPDATE grant from step 1's grant_api_roles migration would otherwise let
-- any authenticated request touch owner_user_id/source/status directly -
-- restrict to the one field an owner should ever be able to flip themselves.
revoke update on public.restaurants from authenticated, anon;
grant update (require_owner_approval) on public.restaurants to authenticated;

create policy "owners can toggle their own approval requirement"
  on public.restaurants for update
  using (auth.uid() = owner_user_id)
  with check (auth.uid() = owner_user_id);

-- ── Owner bypass + per-restaurant approval override on menu item edits ──
-- Replaces step 8's direct-edit policy: an owner can always edit their own
-- restaurant's items directly; anyone else's direct-edit privilege (trust-
-- based) is suspended for restaurants that opted into require_owner_approval.

create function public.is_restaurant_owner(target_user_id uuid, target_restaurant_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.restaurants r
    where r.id = target_restaurant_id and r.owner_user_id = target_user_id
  );
$$;

drop policy "established users can edit menu items directly" on public.menu_items;

create policy "owners or established users can edit menu items directly"
  on public.menu_items for update
  using (
    auth.uid() is not null
    and (
      public.is_restaurant_owner(auth.uid(), restaurant_id)
      or (
        not public.is_low_trust(auth.uid())
        and not exists (
          select 1 from public.restaurants r
          where r.id = restaurant_id and r.require_owner_approval
        )
      )
    )
  )
  with check (
    auth.uid() is not null
    and (
      public.is_restaurant_owner(auth.uid(), restaurant_id)
      or (
        not public.is_low_trust(auth.uid())
        and not exists (
          select 1 from public.restaurants r
          where r.id = restaurant_id and r.require_owner_approval
        )
      )
    )
  );
