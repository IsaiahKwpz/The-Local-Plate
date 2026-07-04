-- Build Order step 8 (spec Section 6, "Contribution (menu edits)").
--
-- Trust gating: "new/low-trust accounts... account age under a threshold,
-- or low trust_score" vs "established... go live immediately". Spec gives
-- no concrete numbers, so this migration picks them:
--   - established = account older than 7 days AND trust_score hasn't been
--     penalized below the starting baseline
--   - trust_score default raised from 0 to 5 so the penalty in step 7
--     (floored at 0) has room to actually signal "been penalized" instead
--     of colliding with "brand new" at the same value
--   - admins always count as established, regardless of age/score
-- is_low_trust() is used both by RLS (the actual enforcement) and by app
-- code (to decide whether to write live or queue for review) - keeping the
-- rule in one place means those two can't drift apart.

alter table public.profiles alter column trust_score set default 5;

create function public.is_low_trust(target_user_id uuid)
returns boolean
language sql
stable
as $$
  select
    not p.is_admin
    and (p.created_at > now() - interval '7 days' or p.trust_score < 5)
  from public.profiles p
  where p.id = target_user_id;
$$;

-- ── Pending queues ───────────────────────────────────────────────────────
-- "There is only ever one current/live value per field per item" - a
-- low-trust edit must not touch menu_items at all until approved, so it
-- needs a home separate from both the live row and the append-only
-- edit_logs history.

create type public.edit_status as enum ('pending', 'approved', 'rejected');

create table public.pending_edits (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references public.menu_items (id) on delete cascade,
  user_id uuid not null references public.profiles (id),
  field text not null,
  old_value text,
  new_value text not null,
  status public.edit_status not null default 'pending',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id)
);

create index pending_edits_menu_item_id_idx on public.pending_edits (menu_item_id);

create table public.pending_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type public.tag_type not null,
  proposed_by uuid not null references public.profiles (id),
  status public.edit_status not null default 'pending',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id)
);

alter table public.pending_edits enable row level security;
alter table public.pending_tags enable row level security;

create policy "users can see their own pending edits"
  on public.pending_edits for select
  using (auth.uid() = user_id);

create policy "users can submit their own pending edits"
  on public.pending_edits for insert
  with check (auth.uid() = user_id);

create policy "users can see their own pending tags"
  on public.pending_tags for select
  using (auth.uid() = proposed_by);

create policy "users can propose tags as themselves"
  on public.pending_tags for insert
  with check (auth.uid() = proposed_by);

-- ── Established users can edit menu items directly ──────────────────────
-- Column-scoped: the blanket UPDATE grant from step 1's grant_api_roles
-- migration would otherwise let any authenticated request touch ANY
-- column (restaurant_id, is_active, status...), not just the four fields
-- the edit form actually exposes. Revoke the blanket grant and re-grant
-- only those columns, so this is enforced at the database level even
-- against a handcrafted API call, not just by the app's own form.

revoke update on public.menu_items from authenticated, anon;
grant update (name, price, category, description) on public.menu_items to authenticated;

create policy "established users can edit menu items directly"
  on public.menu_items for update
  using (auth.uid() is not null and not public.is_low_trust(auth.uid()))
  with check (auth.uid() is not null and not public.is_low_trust(auth.uid()));

-- ── Tag application is low-friction; tag creation is not ────────────────
-- "Applying an existing tag... is low-friction (any user in good
-- standing). Creating a brand-new tag requires a higher trust threshold or
-- admin approval." Application goes straight to menu_item_tags; creation
-- always queues in pending_tags above - chose admin approval over a trust
-- threshold because the stated goal (keeping the tag vocabulary clean, not
-- fragmenting into "poutine"/"Poutine"/"poutines") is a judgment call a
-- human catches far more reliably than a numeric cutoff would.

create policy "authenticated users can apply existing tags"
  on public.menu_item_tags for insert
  with check (auth.uid() is not null);

-- ── Report-triggered auto-revert ─────────────────────────────────────────
-- "if reports on an item/field cross a threshold, automatically revert to
-- the last known-good version pending review." Reports aren't structured
-- per-field, so this reverts the single most recent edit_logs entry for
-- the item once its open-report count crosses the threshold - the report
-- itself is already sitting in the /admin/reports queue from step 7 for a
-- human to look at; this just limits damage while that happens. Threshold
-- is lower than step 6's burst threshold (3 vs 5) since this is "something
-- is clearly wrong with this content," not "coordinated manipulation."

create function public.revert_last_edit_on_report_threshold()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  report_threshold constant integer := 3;
  open_report_count integer;
  last_edit record;
begin
  if new.target_type != 'menu_item' then
    return new;
  end if;

  select count(*) into open_report_count
  from public.reports
  where target_type = 'menu_item' and target_id = new.target_id and status = 'open';

  if open_report_count < report_threshold then
    return new;
  end if;

  select * into last_edit
  from public.edit_logs
  where menu_item_id = new.target_id
  order by created_at desc
  limit 1;

  if last_edit is null then
    return new;
  end if;

  -- format(%I) protects against SQL injection in the identifier, but not
  -- against acting on a column this trigger was never meant to touch -
  -- allowlist to exactly the columns the contribution-edit flow writes to.
  if last_edit.field not in ('name', 'price', 'category', 'description') then
    return new;
  end if;

  execute format('update public.menu_items set %I = $1 where id = $2', last_edit.field)
    using last_edit.old_value, new.target_id;

  insert into public.edit_logs (menu_item_id, user_id, field, old_value, new_value)
  values (new.target_id, last_edit.user_id, last_edit.field, last_edit.new_value, last_edit.old_value);

  return new;
end;
$$;

create trigger reports_revert_on_threshold
  after insert on public.reports
  for each row execute function public.revert_last_edit_on_report_threshold();
