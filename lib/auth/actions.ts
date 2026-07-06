"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = {
  error?: string;
  success?: boolean;
  confirmationSent?: boolean;
};

// Only allow redirecting back to a relative in-app path (e.g. the item page
// someone was on when prompted to sign in) - never an absolute/protocol-
// relative URL, which would make this an open redirect.
function safeRedirectTarget(formData: FormData): string {
  const next = formData.get("next") as string | null;
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return "/";
}

export async function signUp(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const displayName = (formData.get("displayName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!displayName || !email || !password) {
    return { error: "All fields are required." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });

  if (error) {
    return { error: error.message };
  }

  // Email confirmations are on (supabase/config.toml) - a brand-new signup
  // gets a profile row via the auth.users trigger but no session until the
  // confirmation link is clicked, so redirecting as if signed in here would
  // silently strand the user on `next` without an actual session.
  if (!data.session) {
    return { confirmationSent: true };
  }

  revalidatePath("/", "layout");
  redirect(safeRedirectTarget(formData));
}

export async function signIn(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect(safeRedirectTarget(formData));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
