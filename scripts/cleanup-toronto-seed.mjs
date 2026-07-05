// One-off cleanup: removes the 4 placeholder Toronto restaurants created by
// scripts/seed.mjs (Build Order step 3, before the real scraper existed).
// They leaked into the "Top rated" list once ratings were seeded across the
// whole menu_items table. Deleting the restaurants cascades to their
// menu_items, ratings, and tag links via existing FK constraints; the
// now-unreferenced brand row is removed last.
//
// Run with: node scripts/cleanup-toronto-seed.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const NAMES = [
  "Ossington Diner",
  "Kensington Noodle House",
  "Maple Leaf Coffee Co. - Queen St",
  "Maple Leaf Coffee Co. - King St",
];

async function main() {
  const { data: restaurants, error: fetchError } = await supabase
    .from("restaurants")
    .select("id, name, brand_id")
    .in("name", NAMES);
  if (fetchError) throw fetchError;

  if (restaurants.length === 0) {
    console.log("No matching placeholder restaurants found - already cleaned up.");
    return;
  }

  const ids = restaurants.map((r) => r.id);
  const brandIds = [...new Set(restaurants.map((r) => r.brand_id).filter(Boolean))];

  const { error: deleteError } = await supabase.from("restaurants").delete().in("id", ids);
  if (deleteError) throw deleteError;
  console.log(`Deleted ${restaurants.length} restaurants (cascaded menu_items/ratings/tags).`);

  if (brandIds.length > 0) {
    const { error: brandDeleteError } = await supabase.from("brands").delete().in("id", brandIds);
    if (brandDeleteError) throw brandDeleteError;
    console.log(`Deleted ${brandIds.length} now-unreferenced brand(s).`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
