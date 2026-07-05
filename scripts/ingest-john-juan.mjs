import { readFileSync } from "node:fs";
import { createScraperClient, ingestRestaurant } from "../scraper/ingest.mjs";
import { geocode } from "../scraper/geocode.mjs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((line) => line.includes("=") && !line.trim().startsWith("#"))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
    }),
);

const supabase = createScraperClient(env);

const restaurant = {
  name: "John Juan Burrito",
  address: "1091 St. Laurent Blvd., Ottawa, ON K1K 3B1",
  type: "independent",
  items: [
    { name: "Burrito (Small)", price: 10.25, category: "Burrito" },
    { name: "Burrito (Regular)", price: 13.25, category: "Burrito" },
    { name: "Burrito - Add Guacamole", price: 2.0, category: "Burrito" },
    { name: "Quesadilla (Small)", price: 14.0, category: "Quesadilla" },
    { name: "Quesadilla (Regular)", price: 18.0, category: "Quesadilla" },
    { name: "Quesadilla - Add Guacamole (Small)", price: 2.25, category: "Quesadilla" },
    { name: "Quesadilla - Add Guacamole (Regular)", price: 3.49, category: "Quesadilla" },
    { name: "Taco Salad (includes guacamole)", price: 16.5, category: "Taco Salad" },
    { name: "Vegetarian Taco Salad", price: 13.0, category: "Taco Salad" },
    { name: "Nachos", price: 18.0, category: "Nachos" },
    { name: "Nachos - Add Guacamole", price: 4.0, category: "Nachos" },
    { name: "Burrito Bowl", price: 16.0, category: "Burrito Bowl" },
    { name: "Burrito Bowl - Add Guacamole", price: 2.0, category: "Burrito Bowl" },
    { name: "Bowl Grande (includes guacamole)", price: 23.5, category: "Bowl Grande" },
    { name: "Vegetarian Bowl Grande", price: 16.0, category: "Bowl Grande" },
    { name: "Tacos (each)", price: 5.25, category: "Tacos" },
    { name: "Tacos - Add Guacamole", price: 1.0, category: "Tacos" },
    { name: "Kids Menu", price: 10.0, category: "Kids Menu" },
  ],
};

async function main() {
  const coords = await geocode(restaurant.address);
  if (!coords) console.log("(geocoding failed - ingesting without lat/lng)");

  const result = await ingestRestaurant(supabase, restaurant, coords);
  console.log(
    `${restaurant.name}: ${result.wasNew ? "created" : "matched existing"} - ${result.itemsCreated} item(s) created`,
  );
}

main();
