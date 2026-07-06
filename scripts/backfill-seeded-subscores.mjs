// One-off backfill for ratings created before Build Order-adjacent step
// "multi-category dish ratings" - the ~7,800 seeded ratings only have an
// overall `score`, so they look inconsistent next to any real rating (which
// now always has all four sub-scores). Generates plausible per-category
// scores correlated with each row's existing overall score rather than
// just copying it four times, so the breakdown still reads as real
// variation instead of a flat duplicate.
// Run with: node scripts/backfill-seeded-subscores.mjs
// Requires SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL in .env.local.

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

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// +/-1 noise around the overall score, clamped to 1-5, so the breakdown
// looks like real independent judgments rather than four copies of the
// same number.
function nearbyScore(base) {
  const noise = Math.round((Math.random() - 0.5) * 3); // -1, 0, or 1 (mostly)
  return clamp(base + noise, 1, 5);
}

async function fetchNullSubscoreRatings() {
  const pageSize = 1000;
  let from = 0;
  const all = [];
  while (true) {
    const { data, error } = await supabase
      .from("ratings")
      .select("id, score, user_id, menu_item_id")
      .is("taste_score", null)
      .range(from, from + pageSize - 1);
    if (error) throw error;
    all.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

async function main() {
  const rows = await fetchNullSubscoreRatings();
  console.log(`Found ${rows.length} ratings missing sub-category scores.`);
  if (rows.length === 0) return;

  // Postgres validates NOT NULL constraints while constructing the proposed
  // row before it even checks for a conflict - user_id/menu_item_id/score
  // have to ride along unchanged in the payload, or the upsert's implicit
  // INSERT attempt fails before it ever reaches the ON CONFLICT DO UPDATE.
  const updates = rows.map((r) => ({
    id: r.id,
    user_id: r.user_id,
    menu_item_id: r.menu_item_id,
    score: r.score,
    taste_score: nearbyScore(r.score),
    value_score: nearbyScore(r.score),
    uniqueness_score: nearbyScore(r.score),
    healthiness_score: nearbyScore(r.score),
  }));

  const chunkSize = 500;
  for (let i = 0; i < updates.length; i += chunkSize) {
    const chunk = updates.slice(i, i + chunkSize);
    const { error } = await supabase.from("ratings").upsert(chunk, { onConflict: "id" });
    if (error) throw error;
    console.log(`Updated ${Math.min(i + chunkSize, updates.length)}/${updates.length}`);
  }

  console.log("Done.");
}

main();
