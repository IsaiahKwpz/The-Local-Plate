// One-off seed script for Build Order step 3 — manually-entered restaurants
// to build/test the discovery UI before the scraper (step 9) exists.
// Run with: node scripts/seed.mjs
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

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function main() {
  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .insert({ name: "Maple Leaf Coffee Co." })
    .select()
    .single();
  if (brandError) throw brandError;

  const { data: restaurants, error: restaurantError } = await supabase
    .from("restaurants")
    .insert([
      {
        name: "Ossington Diner",
        address: "123 Ossington Ave, Toronto, ON",
        type: "independent",
      },
      {
        name: "Kensington Noodle House",
        address: "45 Baldwin St, Toronto, ON",
        type: "independent",
      },
      {
        name: "Maple Leaf Coffee Co. - Queen St",
        address: "200 Queen St W, Toronto, ON",
        type: "chain",
        brand_id: brand.id,
      },
      {
        name: "Maple Leaf Coffee Co. - King St",
        address: "500 King St W, Toronto, ON",
        type: "chain",
        brand_id: brand.id,
      },
    ])
    .select();
  if (restaurantError) throw restaurantError;

  const byName = Object.fromEntries(restaurants.map((r) => [r.name, r]));

  const menuItems = [
    // Ossington Diner
    { restaurant: "Ossington Diner", name: "Classic Poutine", price: 9.5, category: "Appetizers" },
    { restaurant: "Ossington Diner", name: "Diner Burger", price: 14.0, category: "Mains" },
    { restaurant: "Ossington Diner", name: "Pancake Stack", price: 11.0, category: "Breakfast" },
    // Kensington Noodle House
    { restaurant: "Kensington Noodle House", name: "Spicy Ramen", price: 16.0, category: "Mains" },
    { restaurant: "Kensington Noodle House", name: "Gyoza (6pc)", price: 8.0, category: "Appetizers" },
    { restaurant: "Kensington Noodle House", name: "Miso Soup", price: 4.5, category: "Appetizers" },
    // Chain — same item names across both locations to test the brand rollup
    { restaurant: "Maple Leaf Coffee Co. - Queen St", name: "Maple Latte", price: 5.25, category: "Drinks" },
    { restaurant: "Maple Leaf Coffee Co. - Queen St", name: "Everything Bagel", price: 3.75, category: "Breakfast" },
    { restaurant: "Maple Leaf Coffee Co. - King St", name: "Maple Latte", price: 5.25, category: "Drinks" },
    { restaurant: "Maple Leaf Coffee Co. - King St", name: "Everything Bagel", price: 3.75, category: "Breakfast" },
  ].map(({ restaurant, ...item }) => ({
    ...item,
    restaurant_id: byName[restaurant].id,
    status: "confirmed",
  }));

  const { error: itemError } = await supabase.from("menu_items").insert(menuItems);
  if (itemError) throw itemError;

  console.log(`Seeded 1 brand, ${restaurants.length} restaurants, ${menuItems.length} menu items.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
