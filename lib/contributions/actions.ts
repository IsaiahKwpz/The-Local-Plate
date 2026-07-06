"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isLowTrust } from "@/lib/contributions/trust";
import {
  EDITABLE_FIELDS,
  buildMenuItemUpdate,
  EDITABLE_RESTAURANT_FIELDS,
  type EditableField,
  type EditableRestaurantField,
} from "@/lib/contributions/fields";
import { geocodeAddress } from "@/lib/geo/geocode";
import type { Database } from "@/lib/supabase/types";

export type ContributionActionState = {
  error?: string;
  success?: boolean;
  queued?: boolean;
};

type Change = { field: EditableField; oldValue: string | null; newValue: string };

function diffMenuItem(
  item: { name: string; price: number | null; category: string | null; description: string | null },
  formData: FormData,
): Change[] {
  const changes: Change[] = [];

  const priceSubmitted = ((formData.get("price") as string) ?? "").trim();
  if (priceSubmitted !== "") {
    const submittedNum = Number(priceSubmitted);
    const current = item.price;
    if (!Number.isNaN(submittedNum) && (current === null || Math.abs(submittedNum - current) >= 0.005)) {
      changes.push({
        field: "price",
        oldValue: current == null ? null : String(current),
        newValue: submittedNum.toFixed(2),
      });
    }
  }

  for (const field of EDITABLE_FIELDS) {
    if (field === "price") continue;

    const submitted = ((formData.get(field) as string) ?? "").trim();
    const current = item[field];
    const currentStr = current == null ? "" : String(current);
    if (submitted === currentStr) continue;
    if (field !== "description" && submitted === "") continue; // name/category can't be cleared

    changes.push({ field, oldValue: current == null ? null : String(current), newValue: submitted });
  }

  return changes;
}

export async function submitMenuItemEdit(
  _prevState: ContributionActionState,
  formData: FormData,
): Promise<ContributionActionState> {
  const menuItemId = formData.get("menuItemId") as string;
  if (!menuItemId) return { error: "Missing item." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to sign in to suggest an edit." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("created_at, trust_score, is_admin")
    .eq("id", user.id)
    .single();
  if (!profile) return { error: "Profile not found." };

  const { data: item, error: itemError } = await supabase
    .from("menu_items")
    .select("name, price, category, description, restaurant:restaurants(owner_user_id, require_owner_approval)")
    .eq("id", menuItemId)
    .single();
  if (itemError || !item) return { error: "Menu item not found." };

  const changes = diffMenuItem(item, formData);
  if (changes.length === 0) {
    return { error: "No changes to submit." };
  }

  // The restaurant's owner always edits their own listing live; everyone
  // else's direct-edit privilege is suspended if the owner opted into
  // require_owner_approval, regardless of the editor's own trust score.
  // RLS backs this up independently (see the step-10 migration) - a
  // request that shouldn't go live directly would have its UPDATE silently
  // affect zero rows even if this branch were somehow bypassed.
  const isOwner = item.restaurant?.owner_user_id === user.id;
  const mustQueue = !isOwner && (isLowTrust(profile) || item.restaurant?.require_owner_approval === true);

  if (mustQueue) {
    const { error } = await supabase.from("pending_edits").insert(
      changes.map((c) => ({
        menu_item_id: menuItemId,
        user_id: user.id,
        field: c.field,
        old_value: c.oldValue,
        new_value: c.newValue,
      })),
    );
    if (error) return { error: error.message };

    return { success: true, queued: true };
  }

  // Owner, or an established user on a restaurant that hasn't opted into
  // owner approval: goes live immediately.
  const update: Database["public"]["Tables"]["menu_items"]["Update"] = changes.reduce(
    (acc, c) => ({ ...acc, ...buildMenuItemUpdate(c.field, c.newValue) }),
    {},
  );

  const { error: updateError } = await supabase
    .from("menu_items")
    .update(update)
    .eq("id", menuItemId);
  if (updateError) return { error: updateError.message };

  const { error: logError } = await supabase.from("edit_logs").insert(
    changes.map((c) => ({
      menu_item_id: menuItemId,
      user_id: user.id,
      field: c.field,
      old_value: c.oldValue,
      new_value: c.newValue,
    })),
  );
  if (logError) return { error: logError.message };

  revalidatePath(`/menu-items/${menuItemId}`);
  return { success: true, queued: false };
}

type RestaurantChange = { field: EditableRestaurantField; oldValue: string | null; newValue: string };

function diffRestaurant(
  restaurant: { name: string; address: string },
  formData: FormData,
): RestaurantChange[] {
  const changes: RestaurantChange[] = [];

  for (const field of EDITABLE_RESTAURANT_FIELDS) {
    const submitted = ((formData.get(field) as string) ?? "").trim();
    if (!submitted || submitted === restaurant[field]) continue;
    changes.push({ field, oldValue: restaurant[field], newValue: submitted });
  }

  return changes;
}

export async function submitRestaurantEdit(
  _prevState: ContributionActionState,
  formData: FormData,
): Promise<ContributionActionState> {
  const restaurantId = formData.get("restaurantId") as string;
  if (!restaurantId) return { error: "Missing restaurant." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to sign in to suggest an edit." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("created_at, trust_score, is_admin")
    .eq("id", user.id)
    .single();
  if (!profile) return { error: "Profile not found." };

  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("name, address, owner_user_id, require_owner_approval")
    .eq("id", restaurantId)
    .single();
  if (restaurantError || !restaurant) return { error: "Restaurant not found." };

  const changes = diffRestaurant(restaurant, formData);
  if (changes.length === 0) {
    return { error: "No changes to submit." };
  }

  const isOwner = restaurant.owner_user_id === user.id;
  const mustQueue = !isOwner && (isLowTrust(profile) || restaurant.require_owner_approval === true);

  if (mustQueue) {
    const { error } = await supabase.from("pending_restaurant_edits").insert(
      changes.map((c) => ({
        restaurant_id: restaurantId,
        user_id: user.id,
        field: c.field,
        old_value: c.oldValue,
        new_value: c.newValue,
      })),
    );
    if (error) return { error: error.message };

    return { success: true, queued: true };
  }

  const update: Database["public"]["Tables"]["restaurants"]["Update"] = {};
  for (const c of changes) {
    if (c.field === "name") update.name = c.newValue;
    if (c.field === "address") update.address = c.newValue;
  }

  // Re-geocode when the address changes, so lat/lng (radius search + the
  // location snapshot map) stay in sync with what's actually on file.
  const addressChange = changes.find((c) => c.field === "address");
  if (addressChange) {
    const coords = await geocodeAddress(addressChange.newValue);
    if (coords) {
      update.lat = coords.lat;
      update.lng = coords.lng;
    }
  }

  const { error: updateError } = await supabase.from("restaurants").update(update).eq("id", restaurantId);
  if (updateError) return { error: updateError.message };

  revalidatePath(`/restaurants/${restaurantId}`);
  return { success: true, queued: false };
}

export async function applyTag(
  _prevState: ContributionActionState,
  formData: FormData,
): Promise<ContributionActionState> {
  const menuItemId = formData.get("menuItemId") as string;
  const tagId = formData.get("tagId") as string;
  if (!menuItemId || !tagId) return { error: "Pick a tag." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to sign in to add a tag." };

  const { error } = await supabase.from("menu_item_tags").insert({
    menu_item_id: menuItemId,
    tag_id: tagId,
  });
  if (error) return { error: error.message };

  revalidatePath(`/menu-items/${menuItemId}`);
  return { success: true };
}

export async function proposeTag(
  _prevState: ContributionActionState,
  formData: FormData,
): Promise<ContributionActionState> {
  const name = ((formData.get("name") as string) ?? "").trim();
  const type = formData.get("type") as "dish_type" | "cuisine" | "attribute";
  if (!name || !type) return { error: "Name and type are required." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to sign in to propose a tag." };

  const { error } = await supabase.from("pending_tags").insert({
    name,
    type,
    proposed_by: user.id,
  });
  if (error) return { error: error.message };

  return { success: true, queued: true };
}
