// One-off: tags real menu items with attribute (dietary) tags based on
// keyword matches in their own name (e.g. "Vegan Buddha Bowl" -> Vegan),
// same heuristic-over-real-names approach as auto-tag-dishes.mjs for
// dish-type tags - not fabricated, just surfacing what a restaurant's own
// menu already states in the dish name. Deliberately conservative: only
// covers the 4 most commonly self-labeled diets, and requires the fuller
// phrase ("gluten free"/"gluten-free") rather than a bare "gf" abbreviation
// to avoid false positives. Vegan items are also tagged Vegetarian, since
// every vegan dish is vegetarian by definition.
// Run with: node scripts/auto-tag-diet.mjs

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

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

const DIET_PATTERNS = [
  { tag: "Vegan", pattern: /\bvegan\b/i, alsoTag: "Vegetarian" },
  { tag: "Vegetarian", pattern: /\bveg(etarian|gie)\b/i },
  { tag: "Gluten-Free", pattern: /gluten[\s-]?free/i },
  { tag: "Dairy-Free", pattern: /dairy[\s-]?free/i },
];

async function findOrCreateTag(name) {
  const { data: existing } = await supabase.from("tags").select("id").eq("name", name).maybeSingle();
  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("tags")
    .insert({ name, type: "attribute" })
    .select("id")
    .single();
  if (error) throw error;
  return created.id;
}

function matchTags(itemName) {
  const matched = new Set();
  for (const { tag, pattern, alsoTag } of DIET_PATTERNS) {
    if (pattern.test(itemName)) {
      matched.add(tag);
      if (alsoTag) matched.add(alsoTag);
    }
  }
  return [...matched];
}

async function fetchAllActiveItems() {
  const PAGE = 1000;
  const items = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("menu_items")
      .select("id, name")
      .eq("is_active", true)
      .range(from, from + PAGE - 1);
    if (error) throw error;
    items.push(...data);
    if (data.length < PAGE) break;
  }
  return items;
}

async function main() {
  const items = await fetchAllActiveItems();
  console.log(`Scanning ${items.length} active menu items...`);

  const tagIdByName = new Map();
  for (const { tag } of DIET_PATTERNS) {
    if (tagIdByName.has(tag)) continue;
    tagIdByName.set(tag, await findOrCreateTag(tag));
  }

  const rows = [];
  const perTagCount = new Map();
  for (const item of items) {
    for (const tagName of matchTags(item.name)) {
      rows.push({ menu_item_id: item.id, tag_id: tagIdByName.get(tagName) });
      perTagCount.set(tagName, (perTagCount.get(tagName) ?? 0) + 1);
    }
  }
  console.log(`${rows.length} tag applications to insert (duplicates skipped by DB).`);

  const BATCH = 500;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error: insertError } = await supabase
      .from("menu_item_tags")
      .upsert(batch, { onConflict: "menu_item_id,tag_id", ignoreDuplicates: true });
    if (insertError) throw insertError;
    inserted += batch.length;
    console.log(`  ...${inserted}/${rows.length}`);
  }

  console.log("\nPer-tag match counts:");
  for (const [tag, count] of [...perTagCount.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${tag.padEnd(16)} ${count}`);
  }
}

main();
