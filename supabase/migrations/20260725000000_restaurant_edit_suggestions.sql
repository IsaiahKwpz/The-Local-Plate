-- Menu items have had a "suggest an edit" flow since Build Order step 8;
-- restaurants themselves (name/address) never got the equivalent - only
-- claim/report existed. Mirrors the same shape: a pending queue for
-- low-trust/require_owner_approval edits, direct writes for the owner or an
-- established user otherwise.

create table public.pending_restaurant_edits (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  user_id uuid not null references public.profiles (id),
  field text not null,
  old_value text,
  new_value text not null,
  status public.edit_status not null default 'pending',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id)
);

create index pending_restaurant_edits_restaurant_id_idx on public.pending_restaurant_edits (restaurant_id);

alter table public.pending_restaurant_edits enable row level security;

create policy "users can see their own pending restaurant edits"
  on public.pending_restaurant_edits for select
  using (auth.uid() = user_id);

create policy "users can submit their own pending restaurant edits"
  on public.pending_restaurant_edits for insert
  with check (auth.uid() = user_id);

create trigger pending_restaurant_edits_rate_limit
  before insert on public.pending_restaurant_edits
  for each row execute function public.enforce_submission_rate_limit('user_id', '50', 'restaurant field edits');

-- Extend the column-scoped grant from the restaurant_claims migration
-- (previously require_owner_approval only) to also cover name/address/
-- lat/lng, and consolidate into one policy shaped like the menu_items one:
-- owner bypass, or an established user as long as the restaurant hasn't
-- opted into require_owner_approval.
grant update (name, address, lat, lng, require_owner_approval) on public.restaurants to authenticated;

drop policy "owners can toggle their own approval requirement" on public.restaurants;

create policy "owners or established users can edit restaurant details directly"
  on public.restaurants for update
  using (
    auth.uid() is not null
    and (
      owner_user_id = auth.uid()
      or (not public.is_low_trust(auth.uid()) and not require_owner_approval)
    )
  )
  with check (
    auth.uid() is not null
    and (
      owner_user_id = auth.uid()
      or (not public.is_low_trust(auth.uid()) and not require_owner_approval)
    )
  );

-- The consolidated policy above would otherwise let an established
-- non-owner also flip require_owner_approval in the same request (RLS
-- policies gate rows, not individual columns within an already-permitted
-- UPDATE) - this trigger is the actual column-level guard, independent of
-- which policy let the row through. Service-role (admin) requests are
-- exempt, same as every other "admins bypass trust gating" rule already in
-- this schema.
create function public.protect_owner_approval_toggle()
returns trigger
language plpgsql
as $$
begin
  if NEW.require_owner_approval is distinct from OLD.require_owner_approval
     and auth.role() <> 'service_role'
     and (auth.uid() is null or OLD.owner_user_id is distinct from auth.uid()) then
    raise exception 'Only the restaurant owner can change require_owner_approval.';
  end if;
  return NEW;
end;
$$;

create trigger restaurants_protect_owner_approval
  before update on public.restaurants
  for each row execute function public.protect_owner_approval_toggle();
