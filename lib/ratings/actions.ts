"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type RatingActionState = {
  error?: string;
  success?: boolean;
};

export async function submitRating(
  _prevState: RatingActionState,
  formData: FormData,
): Promise<RatingActionState> {
  const menuItemId = formData.get("menuItemId") as string;
  const restaurantId = formData.get("restaurantId") as string;
  const score = Number(formData.get("score"));
  const comment = (formData.get("comment") as string)?.trim() || null;

  if (!menuItemId || !Number.isInteger(score) || score < 1 || score > 5) {
    return { error: "Pick a rating from 1 to 5." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to sign in to rate this." };
  }

  // One rating per (user, item) - re-rating updates the existing row rather
  // than creating a duplicate (spec Section 6), enforced by the unique
  // constraint on ratings(user_id, menu_item_id) from the step-1 migration.
  const { error } = await supabase
    .from("ratings")
    .upsert(
      { user_id: user.id, menu_item_id: menuItemId, score, comment },
      { onConflict: "user_id,menu_item_id" },
    );

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/menu-items/${menuItemId}`);
  if (restaurantId) revalidatePath(`/restaurants/${restaurantId}`);

  return { success: true };
}
