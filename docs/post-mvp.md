# Post-MVP Progress

Tracks work that comes after MVP v1.0 (see [`build-progress.md`](build-progress.md) — all 11
Build Order steps from the spec are done as of that milestone). This file is for everything after:
UI/design work, deployment, and anything else that isn't one of the original 11 numbered steps.

## Status: in progress — rename + Concept M implementation

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
In progress. Went through several rounds of concept mockups (Artifacts, not code) covering a
full visual identity: color palette, typography, homepage layout, and a dark/light theme system.
**Landed on "Concept M"** — a warm, homey "kitchen table" aesthetic: wood-grain header band, a thin
gingham-checkered accent strip, olive/rust accent colors (Bricolage Grotesque display font + Karla
body font), and restaurant listings styled as slightly-rotated recipe cards for the new **Explore
Local** section. Being implemented directly into the app now (see `build-progress.md` once done,
or check the live homepage/header/footer for current state).

New feature born from this process: **Explore Local** — a homepage section surfacing only
independent (non-chain) restaurants, using the existing `restaurants.type = 'independent'` column
(no schema change needed). Chains still appear in the regular full restaurant list, just not in
this section.

Other feedback gathered during the process, not yet fully acted on:
- `/restaurants` browse page: still the original single-column list — worth revisiting once the
  homepage redesign settles, to decide whether it should adopt the same recipe-card/grid treatment
  or stay a plainer list.
- Popular-search suggestions in the search bar (cheap version: reuse existing rating_count/tag-usage
  data, no new tracking needed) — mentioned early on, not yet scoped.
- Copy tone rule established during review: never phrase anything as if a dish/restaurant "isn't
  worth" something — always frame positively (see the dedicated feedback memory on this).

### Search: group chain locations under one brand result
Not started — discussed 2026-07-04. Today, searching a chain name (e.g. "Boston Pizza") returns
every location as a separate near-identical result (7 rows for Boston Pizza alone), since each
location is its own `restaurants` row. Proposed instead: search matches the brand once; clicking it
opens a brand page listing its locations (ideally with distance/city once geolocation exists), and
picking a location lands on the existing per-location detail page. Fits the data model already in
place — `brands` table + the "All [Brand] locations" aggregate rating view both already exist from
Step 3, this just finishes surfacing that grouping in search. Independent (non-chain) restaurants
are unaffected — search still goes straight to their detail page. Real scope: updated search query
to match brands, plus a new brand-landing page/route — not just a styling change.

### Deployment
Not started. Spec recommends Railway (Section 8) with Vercel as a viable alternative. Currently
runs only via `npm run dev` against the live Supabase project — nothing is reachable outside the
local machine yet.

### Known gaps carried over from MVP v1.0
See `build-progress.md`'s "Known gaps to revisit before real users" section — email confirmation,
image-moderation API, scraper source list. Re-check that list before any real launch, independent of
whatever UI work happens first.
