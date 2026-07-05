-- Ratings got a per-account daily rate limit at Build Order step 6
-- (enforce_rating_rate_limit); reports, restaurant claims, menu-item edits
-- (both the queued and goes-live-immediately paths), tag proposals, and
-- photo uploads never did - a signed-in account could submit an unlimited
-- stream of any of these with zero throttling. One generic trigger function
-- (parameterized via TG_ARGV, since each table names its user-reference
-- column differently) applied to all five surfaces, rather than five
-- near-identical copies of the ratings trigger.
--
-- Limits are per-field-change generous where a single legitimate submission
-- naturally produces multiple rows (editing three fields in one go inserts
-- three pending_edits/edit_logs rows), and tight where one submission is
-- always exactly one row (reports, claims, tag proposals, photos).

create function public.enforce_submission_rate_limit()
returns trigger
language plpgsql
as $$
declare
  user_field text := TG_ARGV[0];
  daily_limit integer := TG_ARGV[1]::integer;
  label text := TG_ARGV[2];
  user_id_value uuid := (to_jsonb(NEW) ->> user_field)::uuid;
  recent_count integer;
begin
  execute format(
    'select count(*) from %I where %I = $1 and created_at > now() - interval ''24 hours''',
    TG_TABLE_NAME, user_field
  ) into recent_count using user_id_value;

  if recent_count >= daily_limit then
    raise exception 'Rate limit exceeded: you can submit up to % % per 24 hours.', daily_limit, label;
  end if;

  return NEW;
end;
$$;

create trigger reports_rate_limit
  before insert on public.reports
  for each row execute function public.enforce_submission_rate_limit('reporter_id', '20', 'reports');

create trigger restaurant_claims_rate_limit
  before insert on public.restaurant_claims
  for each row execute function public.enforce_submission_rate_limit('user_id', '10', 'restaurant claims');

create trigger pending_edits_rate_limit
  before insert on public.pending_edits
  for each row execute function public.enforce_submission_rate_limit('user_id', '50', 'field edits');

create trigger edit_logs_rate_limit
  before insert on public.edit_logs
  for each row execute function public.enforce_submission_rate_limit('user_id', '50', 'field edits');

create trigger pending_tags_rate_limit
  before insert on public.pending_tags
  for each row execute function public.enforce_submission_rate_limit('proposed_by', '10', 'tag proposals');

create trigger photos_rate_limit
  before insert on public.photos
  for each row execute function public.enforce_submission_rate_limit('uploaded_by', '20', 'photos');
