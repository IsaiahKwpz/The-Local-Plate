"use server";

import { createClient } from "@/lib/supabase/server";
import { geocodeAddress } from "@/lib/geo/geocode";

export type SubmissionActionState = {
  error?: string;
  success?: boolean;
};

// Unlike editing an existing menu item, a brand-new restaurant always queues
// for admin review regardless of the submitter's trust score - same
// reasoning as proposing a brand-new tag (step 8): there's no existing
// record to anchor trust against, so quality control benefits from a human
// look before it goes live.
export async function submitNewRestaurant(
  _prevState: SubmissionActionState,
  formData: FormData,
): Promise<SubmissionActionState> {
  const name = ((formData.get("name") as string) ?? "").trim();
  const address = ((formData.get("address") as string) ?? "").trim();
  if (!name || !address) return { error: "Name and address are required." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to sign in to add a restaurant." };

  const coords = await geocodeAddress(address);

  const { error } = await supabase.from("pending_restaurants").insert({
    name,
    address,
    lat: coords?.lat ?? null,
    lng: coords?.lng ?? null,
    submitted_by: user.id,
  });
  if (error) return { error: error.message };

  return { success: true };
}

export async function submitNewMenuItem(
  _prevState: SubmissionActionState,
  formData: FormData,
): Promise<SubmissionActionState> {
  const restaurantId = formData.get("restaurantId") as string;
  const name = ((formData.get("name") as string) ?? "").trim();
  const priceRaw = ((formData.get("price") as string) ?? "").trim();
  const category = ((formData.get("category") as string) ?? "").trim() || null;
  const description = ((formData.get("description") as string) ?? "").trim() || null;

  if (!restaurantId || !name) return { error: "Name is required." };

  let price: number | null = null;
  if (priceRaw !== "") {
    const parsed = Number(priceRaw);
    if (Number.isNaN(parsed)) return { error: "Price must be a number." };
    price = parsed;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to sign in to add a dish." };

  const { error } = await supabase.from("pending_menu_items").insert({
    restaurant_id: restaurantId,
    name,
    price,
    category,
    description,
    submitted_by: user.id,
  });
  if (error) return { error: error.message };

  return { success: true };
}
