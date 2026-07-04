"use server";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type ReportActionState = {
  error?: string;
  success?: boolean;
};

type ReportTargetType = Database["public"]["Enums"]["report_target_type"];

export async function fileReport(
  _prevState: ReportActionState,
  formData: FormData,
): Promise<ReportActionState> {
  const targetType = formData.get("targetType") as ReportTargetType;
  const targetId = formData.get("targetId") as string;
  const reason = formData.get("reason") as string;

  if (!targetType || !targetId || !reason) {
    return { error: "Pick a reason for the report." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to sign in to report this." };
  }

  const { error } = await supabase.from("reports").insert({
    target_type: targetType,
    target_id: targetId,
    reporter_id: user.id,
    reason,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
