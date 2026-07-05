// One-off: tags real menu items with dish_type tags based on keyword matches
// in their name (e.g. "Wagyu Smash Burger" -> "Burger"). This is a heuristic
// over real, already-ingested dish names - not fabricated data - to give the
// category-browse feature (search page) real content instead of an empty
// tag system. Imperfect coverage is expected and fine; items that don't
// match anything are just left untagged, same as if a person hadn't gotten
// to them yet via the normal tag-contribution flow.
// Run with: node scripts/auto-tag-dishes.mjs

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

// Order matters only in that an item can match multiple entries - that's
// intentional (e.g. "Seafood Pasta" gets both Pasta and Seafood).
const KEYWORD_TAGS = [
  { tag: "Pizza", keywords: ["pizza"] },
  { tag: "Burger", keywords: ["burger"] },
  { tag: "Sushi", keywords: ["sushi", "sashimi", "nigiri", " maki"] },
  {
    tag: "Pasta",
    keywords: [
      "pasta", "spaghetti", "fettuccine", "penne", "lasagna", "ravioli",
      "linguine", "rigatoni", "gnocchi", "carbonara", "alfredo", "tagliatelle",
      "agnolotti", "malfatti", "bucatini",
    ],
  },
  { tag: "Wings", keywords: ["wings"] },
  { tag: "Tacos", keywords: ["taco"] },
  { tag: "Poutine", keywords: ["poutine"] },
  {
    tag: "Curry",
    keywords: ["curry", "vindaloo", "korma", "tikka masala", "butter chicken", "rogan josh", "biryani"],
  },
  { tag: "Salad", keywords: ["salad"] },
  { tag: "Soup", keywords: ["soup", "chowder"] },
  { tag: "Sandwich", keywords: ["sandwich", "club sandwich", "wrap", "grilled cheese"] },
  { tag: "Steak", keywords: ["steak", "striploin", "ribeye", "rib eye", "sirloin", "tenderloin"] },
  {
    tag: "Seafood",
    keywords: ["shrimp", "salmon", "lobster", "scallop", "fish", "crab", "oyster", "calamari", "clam"],
  },
  {
    tag: "Dessert",
    keywords: [
      "cake", "cheesecake", "brownie", "ice cream", "tiramisu", "pie", "cookie",
      "pudding", "creme brulee", "crème brûlée", "gelato", "churro",
    ],
  },
  { tag: "Breakfast", keywords: ["omelette", "omelet", "pancake", "waffle", "eggs benedict", "french toast"] },
  { tag: "Ribs", keywords: ["ribs"] },
  { tag: "Fries", keywords: ["fries"] },
  { tag: "Nachos", keywords: ["nachos"] },
  { tag: "Chicken Tenders", keywords: ["tenders", "chicken fingers"] },
  { tag: "Noodles", keywords: ["noodle", "udon", "pho", "ramen"] },
  { tag: "Vietnamese", keywords: ["banh mi", "bánh mì", "pho", "vermicelli"] },
];

async function findOrCreateTag(name) {
  const { data: existing } = await supabase.from("tags").select("id").eq("name", name).maybeSingle();
  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("tags")
    .insert({ name, type: "dish_type" })
    .select("id")
    .single();
  if (error) throw error;
  return created.id;
}

function matchTags(itemName) {
  const lower = itemName.toLowerCase();
  const matched = [];
  for (const { tag, keywords } of KEYWORD_TAGS) {
    if (keywords.some((kw) => lower.includes(kw))) matched.push(tag);
  }
  return matched;
}

async function fetchAllActiveItems() {
  // The API caps any single response at max_rows (supabase/config.toml,
  // currently 1000) - paginate with .range() rather than trusting one query
  // to return everything.
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
  for (const { tag } of KEYWORD_TAGS) {
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
