"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminActionState = {
  error?: string;
  success?: boolean;
};

export async function dismissReport(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();
  const reportId = formData.get("reportId") as string;

  const admin = createAdminClient();
  const { error } = await admin.from("reports").update({ status: "dismissed" }).eq("id", reportId);
  if (error) return { error: error.message };

  revalidatePath("/admin/reports");
  return { success: true };
}

export async function removeReport(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();
  const reportId = formData.get("reportId") as string;

  const admin = createAdminClient();
  const { data: report, error: reportError } = await admin
    .from("reports")
    .select("*")
    .eq("id", reportId)
    .single();
  if (reportError || !report) return { error: "Report not found." };

  // "Remove" reuses each entity's existing hide/close state rather than a
  // new moderation-specific flag - is_active already means "no longer
  // shown as current" for menu items, and status='closed' already means
  // "not an active listing" for restaurants. Ratings have no such state,
  // so removal deletes the row outright - RLS never gave regular users a
  // DELETE policy on ratings specifically so this stays admin-only.
  if (report.target_type === "menu_item") {
    await admin.from("menu_items").update({ is_active: false }).eq("id", report.target_id);
  } else if (report.target_type === "restaurant") {
    await admin.from("restaurants").update({ status: "closed" }).eq("id", report.target_id);
  } else if (report.target_type === "rating") {
    const { data: rating } = await admin
      .from("ratings")
      .select("user_id")
      .eq("id", report.target_id)
      .single();
    await admin.from("ratings").delete().eq("id", report.target_id);
    if (rating) {
      await admin.rpc("decrement_trust_score", { target_user_id: rating.user_id });
    }
  }

  const { error } = await admin.from("reports").update({ status: "removed" }).eq("id", reportId);
  if (error) return { error: error.message };

  revalidatePath("/admin/reports");
  return { success: true };
}

export async function mergeRestaurants(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();
  const primaryId = formData.get("primaryId") as string;
  const duplicateId = formData.get("duplicateId") as string;

  if (!primaryId || !duplicateId) {
    return { error: "Pick both restaurants." };
  }
  if (primaryId === duplicateId) {
    return { error: "Pick two different restaurants." };
  }

  const admin = createAdminClient();
  const { error } = await admin.rpc("merge_restaurants", {
    primary_id: primaryId,
    duplicate_id: duplicateId,
  });
  if (error) return { error: error.message };

  revalidatePath("/admin/reports");
  return { success: true };
}
