"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ClaimActionState = {
  error?: string;
  success?: boolean;
};

export async function submitRestaurantClaim(
  _prevState: ClaimActionState,
  formData: FormData,
): Promise<ClaimActionState> {
  const restaurantId = formData.get("restaurantId") as string;
  const message = ((formData.get("message") as string) ?? "").trim();
  if (!restaurantId) return { error: "Missing restaurant." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to sign in to claim this restaurant." };

  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("owner_user_id")
    .eq("id", restaurantId)
    .single();
  if (restaurantError || !restaurant) return { error: "Restaurant not found." };
  if (restaurant.owner_user_id) return { error: "This restaurant has already been claimed." };

  const { error } = await supabase.from("restaurant_claims").insert({
    restaurant_id: restaurantId,
    user_id: user.id,
    message: message || null,
  });
  if (error) return { error: error.message };

  revalidatePath(`/restaurants/${restaurantId}`);
  return { success: true };
}

// RLS ("owners can toggle their own approval requirement") is the actual
// enforcement here - the column-scoped grant means this UPDATE silently
// affects zero rows for anyone other than the restaurant's owner_user_id.
export async function setRequireOwnerApproval(
  _prevState: ClaimActionState,
  formData: FormData,
): Promise<ClaimActionState> {
  const restaurantId = formData.get("restaurantId") as string;
  const value = formData.get("value") === "true";
  if (!restaurantId) return { error: "Missing restaurant." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to sign in." };

  const { error } = await supabase
    .from("restaurants")
    .update({ require_owner_approval: value })
    .eq("id", restaurantId);
  if (error) return { error: error.message };

  revalidatePath(`/restaurants/${restaurantId}`);
  return { success: true };
}
