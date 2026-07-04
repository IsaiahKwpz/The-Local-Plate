-- Build Order step 7 (spec Section 6, "Moderation" + "Report").

-- ── Admin flag ───────────────────────────────────────────────────────────
-- Simplest possible gate for a single-admin MVP: a boolean on profiles,
-- checked server-side before any /admin/reports read or action. No
-- separate roles/permissions system - not needed until there's more than
-- one moderator.

alter table public.profiles add column is_admin boolean not null default false;

-- ── Trust score penalty on removal ──────────────────────────────────────
-- "Trust_score decreases automatically when a user's contributions get
-- removed enough times (cheap first-pass anti-spam...)". A function (not
-- a raw update from app code) so the floor-at-zero logic lives in one
-- place. service_role only - called from the admin Remove action, never
-- exposed to end users.

create function public.decrement_trust_score(target_user_id uuid)
returns void
language sql
security definer set search_path = public
as $$
  update public.profiles
  set trust_score = greatest(0, trust_score - 1)
  where id = target_user_id;
$$;

revoke execute on function public.decrement_trust_score(uuid) from public;
grant execute on function public.decrement_trust_score(uuid) to service_role;

-- ── Duplicate-restaurant merge ───────────────────────────────────────────
-- "for when the ingestion-time dedup check misses a match" (that check
-- itself is step 9's job, once the scraper exists). Reassigns the
-- duplicate's menu items and cuisine tags onto the primary restaurant,
-- repoints any reports that were filed against the duplicate, then removes
-- the now-empty duplicate row. One function so the whole merge is atomic -
-- app code doing this as several separate calls could leave menu items
-- reassigned but the duplicate row still present if one step failed
-- partway through. service_role only, same reasoning as above.

create function public.merge_restaurants(primary_id uuid, duplicate_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if primary_id = duplicate_id then
    raise exception 'Cannot merge a restaurant into itself.';
  end if;

  update public.menu_items
  set restaurant_id = primary_id
  where restaurant_id = duplicate_id;

  insert into public.restaurant_tags (restaurant_id, tag_id)
  select primary_id, tag_id
  from public.restaurant_tags
  where restaurant_id = duplicate_id
  on conflict (restaurant_id, tag_id) do nothing;

  delete from public.restaurant_tags where restaurant_id = duplicate_id;

  update public.reports
  set target_id = primary_id
  where target_type = 'restaurant' and target_id = duplicate_id;

  delete from public.restaurants where id = duplicate_id;
end;
$$;

revoke execute on function public.merge_restaurants(uuid, uuid) from public;
grant execute on function public.merge_restaurants(uuid, uuid) to service_role;
