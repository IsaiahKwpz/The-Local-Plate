import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Only allow redirecting back to a relative in-app path - same guard as
// safeRedirectTarget in lib/auth/actions.ts, applied here to the `next`
// query param instead of a FormData field.
function safeNext(nextParam: string | null): string {
  if (nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")) {
    return nextParam;
  }
  return "/";
}

// Confirmation emails link here (see supabase/templates/confirmation.html)
// instead of Supabase's own hosted /auth/v1/verify endpoint, since verifying
// server-side in our own route is what lets the SSR client set the session
// cookie on our domain - Supabase's hosted verify endpoint has no way to do
// that for a separate app domain.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(searchParams.get("next"));

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      redirect(next);
    }
  }

  redirect("/login?error=confirmation-failed");
}
