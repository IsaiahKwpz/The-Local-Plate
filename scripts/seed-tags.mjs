// One-off seed script for Build Order step 4 — tags + associations so the
// unified search has real dish/cuisine data to match against before the
// trust-gated tag creation/application flow (step 8) exists.
// Run with: node scripts/seed-tags.mjs (after scripts/seed.mjs)

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

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function main() {
  const { data: tags, error: tagError } = await supabase
    .from("tags")
    .insert([
      { name: "Poutine", type: "dish_type" },
      { name: "Ramen", type: "dish_type" },
      { name: "Noodles", type: "dish_type" },
      { name: "Burger", type: "dish_type" },
      { name: "Bagel", type: "dish_type" },
      { name: "Latte", type: "dish_type" },
      { name: "Diner", type: "cuisine" },
      { name: "Japanese", type: "cuisine" },
      { name: "Coffee Shop", type: "cuisine" },
    ])
    .select();
  if (tagError) throw tagError;
  const tagByName = Object.fromEntries(tags.map((t) => [t.name, t]));

  const { data: restaurants, error: restaurantError } = await supabase
    .from("restaurants")
    .select("id, name");
  if (restaurantError) throw restaurantError;
  const restaurantByName = Object.fromEntries(restaurants.map((r) => [r.name, r]));

  const { data: menuItems, error: menuItemError } = await supabase
    .from("menu_items")
    .select("id, name, restaurant_id");
  if (menuItemError) throw menuItemError;

  function itemAt(restaurantName, itemName) {
    const restaurant = restaurantByName[restaurantName];
    const item = menuItems.find(
      (i) => i.restaurant_id === restaurant.id && i.name === itemName,
    );
    if (!item) throw new Error(`Menu item not found: ${itemName} @ ${restaurantName}`);
    return item;
  }

  const menuItemTags = [
    { item: itemAt("Ossington Diner", "Classic Poutine"), tag: "Poutine" },
    { item: itemAt("Ossington Diner", "Diner Burger"), tag: "Burger" },
    // Applied without the word "noodles" in the item name, to exercise
    // tag-only matching (as opposed to a plain name substring match).
    { item: itemAt("Kensington Noodle House", "Spicy Ramen"), tag: "Ramen" },
    { item: itemAt("Kensington Noodle House", "Spicy Ramen"), tag: "Noodles" },
    { item: itemAt("Maple Leaf Coffee Co. - Queen St", "Maple Latte"), tag: "Latte" },
    { item: itemAt("Maple Leaf Coffee Co. - Queen St", "Everything Bagel"), tag: "Bagel" },
    { item: itemAt("Maple Leaf Coffee Co. - King St", "Maple Latte"), tag: "Latte" },
    { item: itemAt("Maple Leaf Coffee Co. - King St", "Everything Bagel"), tag: "Bagel" },
  ].map(({ item, tag }) => ({ menu_item_id: item.id, tag_id: tagByName[tag].id }));

  const { error: mitError } = await supabase.from("menu_item_tags").insert(menuItemTags);
  if (mitError) throw mitError;

  const restaurantTags = [
    { restaurant: "Ossington Diner", tag: "Diner" },
    { restaurant: "Kensington Noodle House", tag: "Japanese" },
    { restaurant: "Maple Leaf Coffee Co. - Queen St", tag: "Coffee Shop" },
    { restaurant: "Maple Leaf Coffee Co. - King St", tag: "Coffee Shop" },
  ].map(({ restaurant, tag }) => ({
    restaurant_id: restaurantByName[restaurant].id,
    tag_id: tagByName[tag].id,
  }));

  const { error: rtError } = await supabase.from("restaurant_tags").insert(restaurantTags);
  if (rtError) throw rtError;

  console.log(
    `Seeded ${tags.length} tags, ${menuItemTags.length} menu item tags, ${restaurantTags.length} restaurant tags.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
