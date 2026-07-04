import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type TypedClient = SupabaseClient<Database>;

export async function getMenuItemDetail(supabase: TypedClient, itemId: string) {
  const { data: item, error: itemError } = await supabase
    .from("menu_items")
    .select("*, restaurant:restaurants(*, brand:brands(id, name))")
    .eq("id", itemId)
    .single();

  if (itemError) throw itemError;

  const { data: locationRating } = await supabase
    .from("menu_item_ratings")
    .select("*")
    .eq("menu_item_id", itemId)
    .maybeSingle();

  let brandRating = null;
  if (item.restaurant.type === "chain" && item.restaurant.brand_id) {
    const { data } = await supabase
      .from("brand_item_ratings")
      .select("*")
      .eq("brand_id", item.restaurant.brand_id)
      .eq("item_name", item.name)
      .maybeSingle();
    brandRating = data;
  }

  return {
    item,
    restaurant: item.restaurant,
    locationRating: locationRating ?? null,
    brandRating,
  };
}

export async function getRatingsForItem(supabase: TypedClient, itemId: string) {
  const { data, error } = await supabase
    .from("ratings")
    .select("id, score, comment, created_at, user:profiles(display_name)")
    .eq("menu_item_id", itemId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  return data;
}

export async function getUserRating(supabase: TypedClient, itemId: string, userId: string) {
  const { data, error } = await supabase
    .from("ratings")
    .select("score, comment")
    .eq("menu_item_id", itemId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}
