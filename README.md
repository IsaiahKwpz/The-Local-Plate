# MenuRate.com

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
prisma/       schema + migrations (if using Prisma over the Supabase client directly)
scraper/      standalone scraper — separate concern from the web app runtime
public/       static assets
tests/        automated tests
docs/         spec, ToS/privacy drafts, planning docs
```

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in Supabase + other keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — start the dev server
- `npm run build` / `npm run start` — production build/run
- `npm run lint` — ESLint

## Build order

Being built incrementally per spec Section 11 (schema/auth first, then discovery, search, ratings,
integrity, reporting, contributions, scraper, claim flow, photo moderation).
