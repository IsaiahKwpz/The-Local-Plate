// One-off: brings the already-seeded demo ratings (scripts/seed-ratings.mjs)
// up to ~50% comment coverage. That script originally commented ~20% of
// rows; re-running it wouldn't touch existing rows (the unique
// (user_id, menu_item_id) constraint blocks re-inserts), so this updates
// existing null-comment rows in place instead. Only ever touches ratings
// from the seed reviewer accounts (the ".invalid" email domain), never
// anything a real user submitted.
// Run with: node scripts/backfill-seed-comments.mjs

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((line) => line.includes("=") && !line.trim().startsWith("#"))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
    }),
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TARGET_FRACTION = 0.5;

const POSITIVE_COMMENTS = [
  "Really solid, would order again.",
  "One of my favourites here.",
  "Better than I expected.",
  "Great portion for the price.",
  "Consistently good every time.",
];
const NEUTRAL_COMMENTS = ["It's fine, nothing special.", "Decent but a bit pricey.", "Average, wouldn't rush back for this one."];
const NEGATIVE_COMMENTS = ["Wasn't a fan.", "Disappointing compared to other spots.", "Wouldn't order this again."];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function commentFor(score) {
  if (score >= 4) return pick(POSITIVE_COMMENTS);
  if (score === 3) return pick(NEUTRAL_COMMENTS);
  return pick(NEGATIVE_COMMENTS);
}

async function getSeedReviewerIds() {
  const ids = [];
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    for (const user of data.users) {
      if (user.email?.endsWith("@thelocalplate.invalid")) ids.push(user.id);
    }
    if (data.users.length < 200) break;
    page += 1;
  }
  return ids;
}

async function fetchAllSeedRatings(reviewerIds) {
  const pageSize = 1000;
  let from = 0;
  const rows = [];
  while (true) {
    const { data, error } = await supabase
      .from("ratings")
      .select("id, score, comment")
      .in("user_id", reviewerIds)
      .range(from, from + pageSize - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return rows;
}

async function main() {
  console.log("Finding seed reviewer accounts...");
  const reviewerIds = await getSeedReviewerIds();
  console.log(`${reviewerIds.length} seed reviewer accounts found.`);

  console.log("Fetching their ratings...");
  const ratings = await fetchAllSeedRatings(reviewerIds);
  const withComment = ratings.filter((r) => r.comment != null);
  const withoutComment = ratings.filter((r) => r.comment == null);
  console.log(`${ratings.length} total ratings, ${withComment.length} already have a comment.`);

  const targetTotal = Math.round(ratings.length * TARGET_FRACTION);
  const needed = Math.max(0, targetTotal - withComment.length);
  console.log(`Target ~${TARGET_FRACTION * 100}% (${targetTotal}) - adding comments to ${needed} more.`);

  const shuffled = [...withoutComment].sort(() => Math.random() - 0.5).slice(0, needed);

  let updated = 0;
  for (const row of shuffled) {
    const { error } = await supabase
      .from("ratings")
      .update({ comment: commentFor(row.score) })
      .eq("id", row.id);
    if (error) throw error;
    updated += 1;
    if (updated % 100 === 0) console.log(`  ...${updated}/${shuffled.length}`);
  }

  console.log(`Done. Added comments to ${updated} ratings (${withComment.length + updated}/${ratings.length} now have one).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
