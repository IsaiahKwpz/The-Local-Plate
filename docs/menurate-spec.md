# MenuRate.com — Product Spec (v1)

## 1. Concept

A public website where every restaurant's menu is listed individually, and users can rate
**specific menu items** — not just the restaurant as a whole. Answers the question existing
platforms (Yelp, Google, Uber Eats, DoorDash) don't: *"which specific dish here is actually good?"*

**Launch scope:** Ontario, Canada (single province to start, may narrow to one city for true v1).

---

## 2. Positioning & Competitive Landscape

- **Uber Eats / DoorDash / Skip**: overall restaurant rating + private item-level feedback shown
  only to the restaurant as internal analytics. Not public, not browsable by diners.
- **Yelp / Google Maps**: restaurant-level reviews only. Occasional dish mention in a photo/review
  but unstructured and not aggregated per item.
- **TheFork / OpenTable**: restaurant-level, reservation-focused.
- **Beli**: ranks *restaurants* against each other socially, not individual dishes.

**Gap**: no mainstream platform offers structured, public, per-dish ratings — and none let you
search *across* restaurants by dish. This is the wedge.

**Key risk (not legal, structural)**: two-sided marketplace cold-start — ratings are only useful
once there's density. Solved by seeding data via scraping rather than waiting on pure crowdsourcing
from zero (see Section 5).

**Honest limitation**: no existing playbook for per-dish rating UX at scale — this is being
designed from scratch, not copied from a proven model. Also not a technical moat — a larger
platform could bolt this on later. Advantage has to come from being first + focused + dense in a
niche geography before it's worth a competitor's attention.

---

## 3. Legal Considerations (Canada / Ontario specific — not legal advice, confirm with a lawyer)

- **Copyright**: Facts (dish names, prices) are not copyrightable. Restaurant-written descriptions
  and photos ARE copyrighted — do not scrape/copy these verbatim. Paraphrase or crowdsource instead.
- **Trademarks**: Using restaurant names to identify them is fine (nominative use). Do not copy
  logos/brand assets in a way that implies endorsement.
- **Scraping**: Lower risk scraping restaurant-owned domains directly. Higher risk scraping
  third-party aggregators (Yelp, Uber Eats) — they actively enforce ToS and have litigated against
  scrapers before. **Rule: scrape restaurant-owned sites only, never aggregators.**
- **No Section 230 equivalent in Canada.** Unlike the US, there's no blanket statutory shield for
  user-generated content. Liability for defamatory reviews is more case-by-case, with courts
  weighing whether the platform had notice and failed to act. Mitigation: a genuinely responsive
  takedown process (not just a ToS clause), a working report/removal flow, real moderation.
- **Ontario's anti-SLAPP protection is weaker for online reviews than it might first appear.**
  Ontario's Protection of Public Participation Act (s. 137.1, Courts of Justice Act) lets
  defendants get meritless "public interest" lawsuits dismissed early — but in *Prescott v.
  Benchwood Builders*, the Ontario Court of Appeal ruled that online consumer reviews are **not
  automatically** a matter of public interest, and reversed a dismissal where the reviews reflected
  a bitter private dispute rather than a broader societal concern. That case is currently under
  appeal to the Supreme Court of Canada, so the exact boundary is unsettled. **Practical effect:
  don't assume a harsh user review is automatically shielded speech here — a restaurant owner
  suing an individual reviewer has a real chance of success right now.** This makes the platform's
  own takedown/moderation responsiveness the actual practical defense, not a legal presumption to
  lean on.
- **Canada's Competition Act already prohibits fake/misleading reviews** — this is not just a US
  FTC issue. The Competition Bureau enforces this under the misleading advertising provisions
  (ss. 52, 74.01) and has published specific guidance on fake online reviews. Two consequences:
  (1) MenuRate's own rating integrity matters legally, not just reputationally — see the
  rating-manipulation safeguards in Section 6; (2) any sponsored/promoted restaurant placement
  (Section 4) must be clearly labeled as such — not just good UX, a compliance requirement.
- **PIPEDA** governs privacy (Canada's equivalent to CCPA/GDPR in spirit): need real consent
  language, a real privacy policy, and reasonable data protection appropriate to sensitivity —
  using a reputable auth provider (Supabase Auth) covers most of this by default.
- **Photos**: require user upload agreement confirming they own/license rights; have a takedown
  process for disputed images. See also proactive image moderation, Section 6.
- **Restaurant removal requests**: honor promptly — this alone defuses most real-world disputes
  before they become legal ones.
- **Incorporation**: once real users, data, or any revenue are involved, incorporating (Ontario or
  federal) separates personal liability from the business. Worth doing proactively, not after
  something goes wrong.
- **GST/HST registration**: triggers automatically once revenue crosses $30k/year. Not relevant at
  launch — just a marker for when monetization (Section 4) starts generating real revenue.
- **Accessibility (AODA)**: Ontario's legal requirement to make websites WCAG 2.0 AA-conformant
  only applies to organizations with 50+ employees — not a compliance requirement at your scale.
  Still cheap to build basic accessibility in from the start rather than retrofit later, and it
  broadens your usable audience.
- **Alcohol menu items** (if any restaurant's menu includes them): Ontario's AGCO has rules around
  alcohol advertising — low-priority edge case, worth a glance if alcohol items become common in
  scraped/crowdsourced menus.

---

## 4. Monetization

UGC review platforms monetize the business side, not the browsing/rating user — people won't pay
to read or write reviews. Realistic paths, roughly in order of how soon they become viable:

1. **Claimed-listing premium features** (ties directly to the Phase 3 restaurant-claim flow) —
   paid tier for claimed restaurants: richer photos, public responses to ratings, a "verified
   menu" badge, analytics on their own item performance. Same model Yelp/Google Business Profile
   use; needs no new infrastructure beyond what's already planned.
2. **Promoted placement** — restaurants pay for visibility in search/category results. Must be
   **clearly labeled as sponsored** (Competition Act requirement, not optional — see Section 3).
   Doesn't touch the underlying organic ratings.
3. **Display advertising** — standard web ads once real traffic exists. Low effort, low revenue
   per user, doesn't require restaurant buy-in.
4. **Affiliate/referral to ordering platforms** — "Order this dish" linking out to Uber
   Eats/DoorDash/the restaurant's own ordering page with a referral fee. Monetizes the exact
   moment the product is most useful, but requires negotiating affiliate relationships.
5. **Data licensing** (later-stage) — a large, structured dish-rating dataset becomes valuable to
   food-industry analytics or market research once there's real scale. Not a launch-day plan.

**Sequencing**: none of this matters until there's real user density in the launch city and enough
claimed restaurants for option 1 to have something to sell. Pre-revenue is the normal state at this
stage — the near-term cost question is "keep infrastructure spend near zero," not "how do I make
money" (see map cost notes in Section 7 and hosting cost notes in Section 8).

---

## 5. Data Sourcing Strategy (Phased)

**Phase 1 — Scraped baseline**
- Source restaurant existence via a business listing source (e.g. Google Places API) to find
  name/address/website — used only to *locate* restaurant sites, not to scrape Google's content.
- Scrape **restaurant-owned domains only** — never Yelp/Uber Eats/DoorDash.
- Scrape only: item name, price, category. Skip copied descriptions and photos entirely at this
  stage.
- Respect `robots.txt`, rate-limit per domain (e.g. 1 request per few seconds).
- Re-run cadence: weekly (menus don't change often enough to justify more).
- Footer link: "Are you the owner? Claim or request removal" — honor-system safety valve.
- **Duplicate check at ingestion**: fuzzy-match new entries against existing restaurants (name +
  address) before creating a new row — prevents the scraper and crowdsourced additions from
  creating two records for the same physical restaurant.

**Phase 2 — Crowdsourced enrichment**
- Users add: photos, descriptions, corrections, missing items, tags — edits/additions to an
  existing skeleton, not building from a blank page. Lower moderation burden than pure
  crowdsourcing.

**Phase 3 — Restaurant claim**
- Owner claims listing, can edit directly, optionally can require approval on further crowd edits
  to their own listing. Also acts as a legal safety valve — claiming implies consent to be listed.

---

## 6. Core User Flows

### Discovery — two paths, one search box (no account required)

- **Unified search** (primary entry point): one search bar on the homepage searches restaurant
  names *and* dish/tag names simultaneously. Results are grouped into two labeled sections —
  "Restaurants" and "Dishes" — so typing "Joe's Diner" or "poutine" both return the right kind of
  result without the user picking a mode first.
  - Searching a dish/tag (e.g. "poutine," "ramen") returns a ranked list of matching MenuItems
    **across all restaurants** in the area, sorted by rating — this is the core "which dish is
    good" query the whole product is built around.
  - Tapping a dish result shows the item detail (rating, comments, which restaurant) with a link
    through to that restaurant's full menu.
- **Browse Restaurants** (secondary path): the map/list view from before — search by
  city/neighborhood or "near me" → restaurant list or map (sorted by rating/distance) → tap
  restaurant → full menu grouped by category, each item showing avg rating + count.

### Rating (account required)
Tap item → view detail (existing ratings/comments) → tap "rate this" → prompted to sign in/up if
not already → submit score (+ optional comment) → item average updates.
**One rating per (user, item) pair** — re-rating updates the existing rating, no duplicates.

### Contribution (menu edits) — trust-gated, no forking
- There is only ever **one current/live value** per field per item — no simultaneous versions.
- Every change writes to an **EditLog** (old value, new value, who, when) — enables revert.
- **New/low-trust accounts** (e.g. account age under a threshold, or low trust_score): edits go
  into a **pending queue**, do not touch the live item until approved.
- **Established/high-trust accounts**: edits go live immediately, replacing the current value.
- Once a restaurant **claims** their listing, their edits are authoritative by default; they can
  optionally require their own approval on further crowd edits.
- **Report-triggered auto-revert**: if reports on an item/field cross a threshold, automatically
  revert to the last known-good version pending review.
- **Tag creation is more tightly gated than tag application.** Applying an existing tag to an item
  is low-friction (any user in good standing). Creating a brand-new tag requires a higher trust
  threshold or admin approval, to keep the tag vocabulary clean (otherwise "poutine," "Poutine,"
  and "poutines" fragment into three different tags and search quality degrades).

### Report
Every item/photo/comment has a flag icon → pick reason → goes to report queue → simple
confirmation to reporter ("thanks, we'll review"), no further detail needed.

### Rating integrity & anti-fraud
A separate concern from content vandalism above — this protects the **ratings themselves**:
- **Rate-limit ratings per account per day** to blunt mass review-bombing.
- **Flag anomalous patterns** for manual review — e.g. a burst of same-direction ratings hitting
  one restaurant in a short window (competitor sabotage, or an owner rallying friends to inflate
  their own score).
- **Sybil accounts** (one person, many accounts) aren't fully solvable at MVP scale — acceptable
  as a known limitation, but shouldn't be a total blind spot. Basic signup throttling per IP is a
  reasonable first line of defense.

### Moderation (day one, admin-only)
Simple internal page (`/admin/reports`) listing open reports: content preview, reason, reporter,
two actions — **Dismiss** or **Remove**. Trust_score decreases automatically when a user's
contributions get removed enough times (cheap first-pass anti-spam without a full reputation
algorithm). Also includes a **duplicate-restaurant merge tool** for when the ingestion-time dedup
check misses a match.

### Photo moderation
Reactive (user reports) is not sufficient on its own for illegal image content — that needs
proactive handling. Run uploaded photos through an automated image-moderation API (e.g. AWS
Rekognition, Google Vision SafeSearch) before or immediately after they go live, rather than
relying solely on community flagging.

---

## 7. Data Model (MVP)

| Entity | Core fields | Purpose |
|---|---|---|
| **User** | id, display_name, email (via auth provider), created_at, trust_score | Identity + edit/report throttling |
| **Brand** | id, name | Groups chain locations together (e.g. "Tim Hortons") |
| **Restaurant** | id, name, address, lat/lng, type (`independent`/`chain`), brand_id (nullable), status (`active`/`closed`/`temporarily_closed`), source (`scraped`/`claimed`), owner_user_id (nullable) | Container for one real-world restaurant location |
| **MenuItem** | id, restaurant_id, name, price, currency (default `CAD`), category, description (nullable), status (`unverified`/`confirmed`), is_active (soft-delete flag) | The thing being rated |
| **Tag** | id, name, type (`dish_type`/`cuisine`/`attribute`) | Controlled vocabulary — powers cross-restaurant dish search, restaurant cuisine filtering, and (later) dietary attributes, all through one mechanism |
| **MenuItemTag** | menu_item_id, tag_id | Links dish-type/attribute tags to items (e.g. "poutine," "spicy") |
| **RestaurantTag** | restaurant_id, tag_id | Links cuisine tags to restaurants (e.g. "Thai," "Italian"), reusing the same Tag table |
| **Rating** | id, user_id, menu_item_id, score (1–5), comment (nullable), created_at | Core action of the app — one per (user, item) |
| **Report** | id, target_type, target_id, reporter_id, reason, status | Safety valve for bad content |
| **EditLog** | id, menu_item_id, user_id, field, old_value, new_value, created_at | Accountability trail, enables revert, no forking |

**Why `is_active` instead of hard-deleting MenuItems**: when a dish is discontinued or a seasonal
menu rotates out, deleting the row would orphan its Rating and EditLog history. Marking it inactive
preserves history and lets the UI show "no longer on the menu" instead of the item just vanishing.

**Explicitly deferred to post-MVP** (additive, doesn't change the skeleton above):
"best value"/price-value scoring, restaurant-overall aggregate score, photo galleries, "best dish
here" leaderboards. (Dietary/attribute tags are *not* deferred as infrastructure — they use the
same Tag mechanism already built for dish-type search — only their population/UI is a later
priority.)

### Chain vs. independent restaurants

- Every Restaurant is explicitly marked `type: independent` or `type: chain` at creation/scrape
  time (not inferred).
- Chain restaurants link to a `Brand` (e.g. all "Tim Hortons" locations share one `brand_id`).
- **Independent restaurants**: show one rating per item — their own. No brand concept applies.
- **Chain restaurants**: show **two ratings side by side, clearly labeled**, no blending between
  them (Google Maps-style pattern people already recognize from chain business listings):
  - *"This location"* — average of Ratings on this specific Restaurant's MenuItems.
  - *"All [Brand] locations"* — average across all MenuItems with matching item name under every
    Restaurant sharing that `brand_id`.
- Matching "the same item" across locations for the brand-wide rollup: **exact name match** for
  v1. Fuzzy/canonical item matching is a future refinement, not required for MVP.
- **Confidence-weighted blending** (a single blended number leaning on brand average when a
  location has few ratings, shifting to the location's own data as it accumulates — similar to
  IMDB's weighted rating approach) is a **documented future improvement**, not built in MVP.

### Map integration

- **Discovery page** gets a map view (toggle alongside the list view) showing pins for
  restaurants in the searched area — pins clickable to a preview card and through to the full
  restaurant page.
- Restaurant `lat/lng` is populated via a **geocoding API call at ingestion time** (address →
  coordinates), not computed client-side.
- **"Near me"** uses browser geolocation (with permission prompt) to center the map / sort list by
  distance.
- **Provider (revised): Leaflet + OpenStreetMap tiles as the default**, not Google Maps — genuinely
  free, open-source, no per-load billing at all. Given pre-revenue cost sensitivity and a bounded,
  single-city restaurant list, this removes a recurring cost line entirely with only a modest
  accuracy/polish tradeoff. **Google Maps Platform remains a viable upgrade path later** once a
  monetization stream (Section 4) justifies the spend — switching is a frontend component swap
  since lat/lng data is provider-agnostic, not a data model change.
- Geocoding itself can still use a pay-per-use API (Google Geocoding or an alternative) since it's
  a one-time cost per restaurant at ingestion, cached permanently — not a recurring load-based cost
  like map tile rendering.

---

## 8. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend + backend | **Next.js (React)** | One codebase, strong SEO (menu/dish pages should be indexable), large ecosystem, works well with Claude Code |
| Database | **Postgres** (via Supabase) | Relational fit is a near-exact match for the schema above |
| Auth + DB + File Storage | **Supabase** | Bundles Postgres, auth, and photo/file storage in one platform — avoids stitching together 3 separate services; Postgres row-level security enforces access rules (e.g. "users can only edit their own ratings") at the DB level |
| Hosting | **Railway** (primary recommendation) — Vercel viable as alt. | Simpler bundled deploy (app + DB together), avoids Vercel's Hobby-tier "non-commercial only" terms ambiguity, generally cheaper bandwidth pricing at small-to-mid scale than Vercel. Migrate off either later if traffic/cost demands it — Next.js isn't locked to any specific host, and Supabase (DB/auth/storage) is already host-independent, so switching later is a redeploy, not a rewrite. |
| ORM / queries | Prisma or Supabase client library | Clean schema/migrations, Claude Code works fluently with either |
| Maps | **Leaflet + OpenStreetMap** (default), Google Maps Platform (future upgrade) | Zero recurring cost pre-revenue; see Section 7 map integration notes |
| Image moderation | AWS Rekognition or Google Vision SafeSearch | Proactive scanning on photo upload, not just reactive reports |

**Hosting cost note**: Vercel's free Hobby tier is non-commercial only by their terms and gets
expensive at scale due to bandwidth overage pricing. Railway avoids the compliance ambiguity and
tends to be cheaper at low-to-mid traffic. Revisit hosting choice once real usage data exists —
treat it as a swappable layer, not a permanent commitment.

**Build hygiene**:
- **Automated tests**, especially around rating aggregation math and the edit/revert logic — the
  most complex, most bug-prone part of the system.
- **Staging environment**: a second Supabase project + Railway deploy before pushing to
  production.
- **Backups**: confirm point-in-time recovery is enabled on Supabase — ratings and edit history
  are irreplaceable user-generated data.
- **Rate-limit your own public pages/API eventually**: once MenuRate's aggregated dish-rating data
  has real value, the platform itself becomes a plausible scraping target the same way Yelp/Uber
  Eats are today. Not urgent at launch, worth remembering later.

---

## 9. Repository Structure (top-level only)

Fine-grained structure (pages, components, API routes) is left to Next.js convention and Claude
Code — not worth pre-specifying. Worth deciding now, though: **the scraper is architecturally
separate from the web app** — it runs on its own schedule, doesn't serve user requests, and may
end up deployed independently (e.g. a scheduled job) rather than sharing the app's runtime. Settle
that shape upfront rather than let it get tangled in mid-build.

```
menurate/
├── docs/                    # this spec, ToS/privacy drafts, any future planning docs
│   └── menurate-spec.md
├── app/                     # Next.js App Router — pages + API routes
├── components/              # shared React components
├── lib/                     # business logic: Supabase client, tag-matching, rating aggregation
├── prisma/                  # schema + migrations (if using Prisma over the Supabase client directly)
├── scraper/                 # standalone scraper — separate concern from the web app runtime
├── public/                  # static assets
├── tests/                   # automated tests (see Section 8 build hygiene)
├── .env.example
├── package.json
└── README.md                # quick-start/dev setup — NOT the full spec, that lives in docs/
```

Move this spec into `docs/menurate-spec.md` once the repo exists, so it stays version-controlled
alongside the code it's guiding.

---

## 10. Mobile (future)

Not needed for MVP, but keep the door open cheaply:
- Keep business logic in a clean API layer, not tangled into page components — a future mobile
  app becomes a new client hitting the same API.
- Cheapest near-term step: make the website a **PWA** (installable, home-screen icon) — minimal
  extra work on top of a normal responsive site.
- If/when a full native app is warranted: **React Native**, reusing existing React knowledge and
  the same backend — the API and data model are already done at that point.

---

## 11. Build Order (suggested)

1. Schema + Supabase setup (tables above, RLS policies for ratings/reports)
2. Auth (Supabase Auth) + basic account flow
3. Restaurant + MenuItem read pages (discovery flow) — seed with a handful of manually-entered
   restaurants first to build/test UI before the scraper exists
4. Tag system (Tag, MenuItemTag, RestaurantTag) + unified search across restaurants and dishes
5. Rating flow (submit + display aggregate)
6. Rating integrity basics (per-account rate limits, anomaly flagging)
7. Report flow + basic `/admin/reports` page (including duplicate-merge tool)
8. Contribution flow (trust-gated edits + EditLog + trust-gated tag creation)
9. Scraper (Ontario restaurant sites, name/price/category only, with ingestion-time dedup check)
10. Restaurant claim flow
11. Photo upload + proactive image moderation

---

*This spec reflects decisions made through discussion — data sourcing (scrape-first,
aggregator-free), data model (entity skeleton including chain/brand handling and the dish/cuisine
tag system for cross-restaurant search), positioning rationale, legal risk areas specific to
Ontario/Canada (including the unsettled anti-SLAPP treatment of online reviews and Competition Act
review-integrity rules), monetization sequencing, trust & safety safeguards for both content edits
and rating manipulation, stack choice (Next.js + Supabase + Railway + Leaflet/OpenStreetMap), and
top-level repository structure (scraper kept architecturally separate from the web app). Ready to
hand to Claude Code as a build brief.*
