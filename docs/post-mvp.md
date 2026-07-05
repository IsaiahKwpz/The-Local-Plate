# Post-MVP Progress

Tracks work that comes after MVP v1.0 (see [`build-progress.md`](build-progress.md) — all 11
Build Order steps from the spec are done as of that milestone). This file is for everything after:
UI/design work, deployment, and anything else that isn't one of the original 11 numbered steps.

## Status: planning

### UI / visual design pass
Not started — currently discussing direction, nothing implemented yet.

Context: the app has been functionally verified at every step but has had zero design attention —
default Tailwind spacing/typography, no color palette, plain bordered lists. User feedback gathered
so far (not yet acted on):

- Full visual design pass: real color palette, typography scale, spacing rhythm, card/button
  styles — make it look like a designed product, not a scaffold.
- Homepage rework: bring the search bar onto the homepage directly (currently only in the header),
  add real content below the fold instead of a single CTA.
- `/restaurants` browse page: responsive card grid instead of the current single-column list —
  feels sparse regardless of restaurant count.
- Dark mode / theme system: light/dark toggle backed by a real design-token system (CSS variables
  or Tailwind theme config) shared by both themes, not just an inverted palette.
- Popular-search suggestions in the search bar (cheap version: reuse existing rating_count/tag-usage
  data, no new tracking needed) — mentioned earlier, not yet scoped against the above.

User is open to brainstorming collaboratively, or having Claude/Fable generate creative direction
options to react to rather than specifying requirements upfront. Fable (Anthropic's creative-writing
model) was specifically discussed as a possible fit for generative creative-direction work.

### Deployment
Not started. Spec recommends Railway (Section 8) with Vercel as a viable alternative. Currently
runs only via `npm run dev` against the live Supabase project — nothing is reachable outside the
local machine yet.

### Known gaps carried over from MVP v1.0
See `build-progress.md`'s "Known gaps to revisit before real users" section — email confirmation,
image-moderation API, scraper source list. Re-check that list before any real launch, independent of
whatever UI work happens first.
