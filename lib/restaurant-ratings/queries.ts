import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type TypedClient = SupabaseClient<Database>;

export async function getRestaurantRatingAgg(supabase: TypedClient, restaurantId: string) {
  const { data, error } = await supabase
    .from("restaurant_ratings_agg")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getRestaurantReviews(supabase: TypedClient, restaurantId: string) {
  const { data, error } = await supabase
    .from("restaurant_ratings")
    .select("id, score, comment, created_at, user:profiles(display_name)")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return data;
}

export async function getUserRestaurantRating(supabase: TypedClient, restaurantId: string, userId: string) {
  const { data, error } = await supabase
    .from("restaurant_ratings")
    .select("score, comment")
    .eq("restaurant_id", restaurantId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}
