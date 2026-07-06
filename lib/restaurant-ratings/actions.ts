"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type RestaurantRatingActionState = {
  error?: string;
  success?: boolean;
};

export async function submitRestaurantRating(
  _prevState: RestaurantRatingActionState,
  formData: FormData,
): Promise<RestaurantRatingActionState> {
  const restaurantId = formData.get("restaurantId") as string;
  const score = Number(formData.get("score"));
  const comment = (formData.get("comment") as string)?.trim() || null;

  if (!restaurantId || !Number.isInteger(score) || score < 1 || score > 5) {
    return { error: "Pick a rating from 1 to 5." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You need to sign in to rate this." };
  }

  const { error } = await supabase
    .from("restaurant_ratings")
    .upsert(
      { user_id: user.id, restaurant_id: restaurantId, score, comment },
      { onConflict: "user_id,restaurant_id" },
    );
  if (error) return { error: error.message };

  revalidatePath(`/restaurants/${restaurantId}`);
  return { success: true };
}
