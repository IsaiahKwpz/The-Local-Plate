import { createClient } from "@/lib/supabase/server";

/**
 * Verifies the CURRENT session (via cookies, not a trusted client claim)
 * belongs to an admin. Server Actions are independently callable network
 * endpoints, so every admin action calls this itself rather than trusting
 * that the page already checked.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    throw new Error("Not authorized");
  }

  return user;
}
