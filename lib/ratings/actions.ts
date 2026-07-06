"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type RatingActionState = {
  error?: string;
  success?: boolean;
};

const SUB_SCORE_FIELDS = ["taste_score", "value_score", "uniqueness_score", "healthiness_score"] as const;

function readScore(formData: FormData, field: string): number | null {
  const raw = formData.get(field);
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  return Number.isInteger(n) ? n : null;
}

export async function submitRating(
  _prevState: RatingActionState,
  formData: FormData,
): Promise<RatingActionState> {
  const menuItemId = formData.get("menuItemId") as string;
  const restaurantId = formData.get("restaurantId") as string;
  const score = readScore(formData, "score");
  const comment = (formData.get("comment") as string)?.trim() || null;

  if (!menuItemId || score == null || score < 1 || score > 5) {
    return { error: "Pick an overall rating from 1 to 5." };
  }

  const subScores: Record<string, number> = {};
  for (const field of SUB_SCORE_FIELDS) {
    const value = readScore(formData, field);
    if (value == null || value < 1 || value > 5) {
      return { error: "Pick a 1-5 score for every category." };
    }
    subScores[field] = value;
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
  // The overall `score` stays a separate, explicitly-chosen number rather
  // than an average of the sub-scores - a dish can be great overall without
  // being "unique", by design.
  const { error } = await supabase
    .from("ratings")
    .upsert(
      { user_id: user.id, menu_item_id: menuItemId, score, comment, ...subScores },
      { onConflict: "user_id,menu_item_id" },
    );

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/menu-items/${menuItemId}`);
  if (restaurantId) revalidatePath(`/restaurants/${restaurantId}`);

  return { success: true };
}
