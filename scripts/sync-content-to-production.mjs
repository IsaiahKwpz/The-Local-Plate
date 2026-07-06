// Ports real content (brands, restaurants, menu items, tags, tag links) from
// the dev/staging Supabase project into the production one, deliberately
// leaving ratings/restaurant_ratings behind - production should only ever
// show real user reviews, never the dev project's seeded/fake ones.
// IDs are carried over as-is (not remapped) so foreign keys between the
// copied tables stay consistent; restaurants.owner_user_id is always nulled
// since no profiles exist yet in the production project.
// Safe to re-run: everything is upserted by primary key, so running this
// again after adding more real restaurants in dev just brings prod up to
// date rather than duplicating rows.
// Run with: node scripts/sync-content-to-production.mjs
// Requires NEXT_PUBLIC_SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY (source) and
// PROD_SUPABASE_URL/PROD_SUPABASE_SERVICE_ROLE_KEY (destination) in .env.local.

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

const source = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const dest = createClient(env.PROD_SUPABASE_URL, env.PROD_SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function fetchAll(client, table, columns) {
  const pageSize = 1000;
  let from = 0;
  const all = [];
  while (true) {
    const { data, error } = await client.from(table).select(columns).range(from, from + pageSize - 1);
    if (error) throw error;
    all.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

async function upsertInChunks(table, rows, chunkSize = 500) {
  if (rows.length === 0) {
    console.log(`${table}: nothing to copy.`);
    return;
  }
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await dest.from(table).upsert(chunk, { onConflict: "id" });
    if (error) throw new Error(`${table}: ${error.message}`);
  }
  console.log(`${table}: copied ${rows.length} rows.`);
}

async function main() {
  const brands = await fetchAll(source, "brands", "id, name, created_at");
  await upsertInChunks("brands", brands);

  const restaurants = await fetchAll(
    source,
    "restaurants",
    "id, name, address, lat, lng, type, brand_id, status, source, created_at, require_owner_approval",
  );
  // owner_user_id deliberately omitted/nulled - no profiles exist in
  // production yet, and every dev restaurant is unowned anyway.
  await upsertInChunks(
    "restaurants",
    restaurants.map((r) => ({ ...r, owner_user_id: null })),
  );

  const tags = await fetchAll(source, "tags", "id, name, type, created_at");
  await upsertInChunks("tags", tags);

  const menuItems = await fetchAll(
    source,
    "menu_items",
    "id, restaurant_id, name, price, currency, category, description, status, is_active, created_at",
  );
  await upsertInChunks("menu_items", menuItems);

  const menuItemTags = await fetchAll(source, "menu_item_tags", "menu_item_id, tag_id");
  // Composite primary key (menu_item_id, tag_id) - no single "id" column to
  // conflict on.
  if (menuItemTags.length > 0) {
    for (let i = 0; i < menuItemTags.length; i += 500) {
      const chunk = menuItemTags.slice(i, i + 500);
      const { error } = await dest.from("menu_item_tags").upsert(chunk, { onConflict: "menu_item_id,tag_id" });
      if (error) throw new Error(`menu_item_tags: ${error.message}`);
    }
    console.log(`menu_item_tags: copied ${menuItemTags.length} rows.`);
  } else {
    console.log("menu_item_tags: nothing to copy.");
  }

  console.log("Done. Ratings and restaurant_ratings were intentionally left out.");
}

main();
