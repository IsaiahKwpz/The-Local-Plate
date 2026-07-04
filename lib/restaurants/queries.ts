import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type TypedClient = SupabaseClient<Database>;

export async function getActiveRestaurants(supabase: TypedClient) {
  const { data, error } = await supabase
    .from("restaurants")
    .select("id, name, address, type, status")
    .order("name");

  if (error) throw error;
  return data;
}

type RatingAggregate = { avg_score: number | null; rating_count: number | null };

export type MenuItemWithRating = Database["public"]["Tables"]["menu_items"]["Row"] & {
  locationRating: RatingAggregate | null;
  brandRating: RatingAggregate | null;
};

export async function getRestaurantWithMenu(supabase: TypedClient, restaurantId: string) {
  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("*, brand:brands(id, name)")
    .eq("id", restaurantId)
    .single();

  if (restaurantError) throw restaurantError;

  const { data: menuItems, error: menuError } = await supabase
    .from("menu_items")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("category")
    .order("name");

  if (menuError) throw menuError;

  const itemIds = menuItems.map((item) => item.id);

  const locationRatingsByItem = new Map<string, RatingAggregate>();
  if (itemIds.length > 0) {
    const { data: locationRatings, error: locationRatingsError } = await supabase
      .from("menu_item_ratings")
      .select("*")
      .in("menu_item_id", itemIds);

    if (locationRatingsError) throw locationRatingsError;
    for (const r of locationRatings) {
      if (r.menu_item_id) locationRatingsByItem.set(r.menu_item_id, r);
    }
  }

  const brandRatingsByName = new Map<string, RatingAggregate>();
  if (restaurant.type === "chain" && restaurant.brand_id) {
    const { data: brandRatings, error: brandRatingsError } = await supabase
      .from("brand_item_ratings")
      .select("*")
      .eq("brand_id", restaurant.brand_id);

    if (brandRatingsError) throw brandRatingsError;
    for (const r of brandRatings) {
      if (r.item_name) brandRatingsByName.set(r.item_name, r);
    }
  }

  const items: MenuItemWithRating[] = menuItems.map((item) => ({
    ...item,
    locationRating: locationRatingsByItem.get(item.id) ?? null,
    brandRating: brandRatingsByName.get(item.name) ?? null,
  }));

  return { restaurant, items };
}
