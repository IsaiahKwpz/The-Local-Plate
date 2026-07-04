-- The "menurate-production" project was created with "Automatically expose
-- new tables" turned off, so the anon/authenticated roles never received
-- base table privileges on anything created after project setup — Postgres
-- denies access at the grant level before RLS policies are even evaluated.
--
-- Restore the standard Supabase posture: broad table-level grants to the API
-- roles, with the RLS policies from 20260704173823_initial_schema.sql doing
-- the actual authorization. Applies to future tables too via default
-- privileges, so this doesn't need repeating in every migration.

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated;
