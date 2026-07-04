-- service_role bypasses RLS (BYPASSRLS attribute) but that's orthogonal to
-- table-level grants — it still needs explicit GRANTs to touch tables at
-- all, and "Automatically expose new tables" being off withheld those too.
-- Needed for the scraper (step 9) and /admin/reports moderation (step 7),
-- both of which use lib/supabase/admin.ts to write past RLS deliberately.

grant usage on schema public to service_role;

grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

alter default privileges in schema public
  grant select, insert, update, delete on tables to service_role;
alter default privileges in schema public
  grant usage, select on sequences to service_role;
