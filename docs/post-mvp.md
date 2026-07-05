# Post-MVP Progress

Tracks work that comes after MVP v1.0 (see [`build-progress.md`](build-progress.md) — all 11
Build Order steps from the spec are done as of that milestone). This file is for everything after:
UI/design work, deployment, and anything else that isn't one of the original 11 numbered steps.

## Status: deployed and publicly reachable (Railway)

The app is live at a Railway-generated `*.up.railway.app` domain, connected to the same
`menurate-production` Supabase project used in local dev — confirmed reachable from multiple
devices/networks. Supabase Auth's Site URL/Redirect URLs were updated to match. See "Known gaps"
below for what's still open now that the site is actually reachable by other people.

### Product rename: MenuRate → The Local Plate
Decided 2026-07-04, after a round of design-concept brainstorming (see below) surfaced that
"MenuRate" read as more clinical/utilitarian than the warm direction the visual design landed on.
- Renamed everywhere in the repo: `package.json`, UI copy (header/footer/homepage), `app/layout.tsx`
  metadata, docs (`README.md`, this file, `build-progress.md`, `menurate-spec.md`), scraper
  User-Agent strings, `supabase/config.toml`'s local `project_id`.
- GitHub repo renamed too (was `IsaiahKwpz/MenuRate.Com`) — see the actual current name in
  `build-progress.md`'s "Live infrastructure" section once confirmed.
- **Left alone, deliberately**: the live Supabase project's actual name (`menurate-production`) and
  its project ref/URL — renaming a Supabase project's display name is purely cosmetic and doesn't
  affect the connection, so this was left for the user to do later via the Supabase dashboard
  whenever they want to, with zero urgency.
- Footer contact email is a placeholder (`hello@thelocalplate.com`) — no real inbox exists at that
  domain yet. Swap for the real address once one exists.

### UI / visual design pass
**Landed on "Concept M"** — a warm, homey "kitchen table" aesthetic: wood-grain header band, a thin
gingham-checkered accent strip, olive/rust accent colors (Bricolage Grotesque display font + Karla
body font), and restaurant listings styled as slightly-rotated recipe cards for the **Explore
Local** section. Implemented across the homepage, header, footer, search, and restaurant pages.

**Explore Local** — a homepage section surfacing only independent (non-chain) restaurants, using
the existing `restaurants.type = 'independent'` column (no schema change needed). Chains still
appear in the regular full restaurant list, just not in this section.

Not yet acted on:
- Popular-search suggestions in the search bar (cheap version: reuse existing rating_count/tag-usage
  data, no new tracking needed) — mentioned early on, not yet scoped.
- Copy tone rule established during review: never phrase anything as if a dish/restaurant "isn't
  worth" something — always frame positively (see the dedicated feedback memory on this).

### Search: group chain locations under one brand result — done
Chain search results now group by brand (one card for "Lone Star Texas Grill" instead of 8 near-
identical location rows), with dishes deduped by exact name within the brand. Each dish expands
inline to show which locations carry it (with per-location price/rating), plus a link to a
dedicated `/brands/[brandId]/dishes/[itemName]` page with the full location list and brand-wide
rating. Independent restaurants are unaffected.

### Search: address + radius, price/rating filters, dietary tags — done
- **Address + radius**: type an address and a distance (1–20 km), see restaurants/dishes within
  range with distance shown on each result. Geocoded via OSM Nominatim (same free provider as
  ingestion-time geocoding), cached in a `geocode_cache` table so a repeat address never re-hits
  the API. Distance computed in SQL via the haversine formula against restaurants' existing
  lat/lng.
- **Price/rating filters**: always visible in the sidebar (previously only appeared after a search
  or category pick), and fully functional standalone via a `browse_menu_items` RPC.
- **Dietary tags** (vegetarian/vegan/gluten-free/dairy-free): same keyword-over-real-dish-names
  heuristic as the original dish-type auto-tagging (`scripts/auto-tag-diet.mjs`) — 146 real tag
  applications, zero fabricated (Dairy-Free matched 0 dishes and was left at 0). Category and
  dietary tags are separate facets that combine as AND across facets, OR within each.
- Category sidebar is now searchable (a "Filter categories..." box) instead of one long list, and
  category counts were fixed after discovering they'd been silently undercounted past the
  1,000-row PostgREST response cap once `menu_item_tags` grew past that size.

### Map view — done
`/restaurants` has a List/Map toggle (Leaflet + OpenStreetMap tiles, no API key) showing every
restaurant as a pin, each with a popup linking to its restaurant page. Uses the lat/lng already
populated at ingestion time.

### Pre-launch hardening pass
Prompted by a full codebase readiness review. Fixed:
- Three more queries (`getActiveRestaurants`, `getRestaurantsPreview`, the admin merge picker) that
  read entire tables with no pagination — same 1,000-row-cap risk as the category-count bug above,
  not yet biting at current data volume but would silently truncate as it grows.
- The admin moderation queues (open reports, pending edits/tags/claims/photos) had the same
  unbounded-read bug — the riskiest instance, since a spam wave or moderation backlog is exactly
  the scenario that would push a queue past 1,000 rows, right when an admin most needs an accurate
  count.
- Added daily rate limits to reports, restaurant claims, menu edits, tag proposals, and photo
  uploads — previously only ratings had any submission throttling.
- Added `error.tsx`, `not-found.tsx`, and `loading.tsx` — none of Next's App Router special files
  existed anywhere before this.
- Fixed a real horizontal-overflow bug on mobile (homepage stat row, a flex-basis:0% edge case) —
  the first time this project's UI had actually been checked at a phone-sized viewport rather than
  desktop-only.

### Deployment — done
Live on Railway, connected to the same `menurate-production` Supabase project as local dev.

### Known gaps carried over from MVP v1.0 — now more urgent
The site is publicly reachable, which changes the urgency of these:
- **Email confirmation is still off** — anyone can sign up with any email address, including one
  they don't own, with no verification step. Re-enable in `supabase/config.toml`'s
  `[auth.email] enable_confirmations` before actually sharing the URL widely.
- **Seeded demo ratings still in the database** — ~7,800 ratings from 40 fake `.invalid`-domain
  reviewer accounts (`scripts/seed-ratings.mjs`), created to make the app look populated for
  testing. Once real users rate things, their ratings will sit mixed in with synthetic ones with
  no visual distinction. Decide whether to clear this before a real launch.
- No automated image-moderation API is configured — every photo upload still holds for manual
  admin review instead of an automated pass/fail.
