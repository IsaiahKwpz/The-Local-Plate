# The Local Plate

Public per-dish restaurant rating platform, launching in Ontario, Canada. Full product spec lives
in [`docs/menurate-spec.md`](docs/menurate-spec.md) — this file is just dev setup.

## Stack

Next.js (App Router, TypeScript, Tailwind) + Supabase (Postgres, Auth, Storage). See spec Section 8
for the full rationale.

## Repository layout

```
app/          Next.js App Router — pages + API routes
components/   shared React components
lib/          business logic: Supabase client, tag-matching, rating aggregation
supabase/     SQL migrations (schema + RLS policies) + CLI config
scraper/      standalone scraper — separate concern from the web app runtime
public/       static assets
tests/        automated tests
docs/         spec, ToS/privacy drafts, planning docs
```

Schema/query tooling: Supabase CLI (SQL migrations) + `@supabase/supabase-js` directly, not Prisma —
RLS policies are native Postgres and `supabase-js` respects them via the logged-in user's JWT.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in Supabase + other keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database

```bash
npm run db:link     # link this repo to your Supabase project (first time only)
npm run db:push     # apply supabase/migrations/*.sql to the linked project
npm run db:diff     # generate a new migration from schema changes made in the dashboard
npm run db:types    # regenerate lib/supabase/types.ts from the linked project
```

## Scripts

- `npm run dev` — start the dev server
- `npm run build` / `npm run start` — production build/run
- `npm run lint` — ESLint
- `npm run scrape` — run the standalone scraper (`scraper/`) against the URLs in
  `scraper/sources.mjs`

## Build order

Being built incrementally per spec Section 11 (schema/auth first, then discovery, search, ratings,
integrity, reporting, contributions, scraper, claim flow, photo moderation). See
[`docs/build-progress.md`](docs/build-progress.md) for what's done, what's left, and known gaps.
