import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth/actions";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();
    displayName = profile?.display_name ?? user.email ?? null;
  }

  return (
    <header className="flex items-center justify-between gap-4 border-b px-6 py-4">
      <Link href="/" className="font-semibold whitespace-nowrap">
        MenuRate
      </Link>
      <form action="/search" method="GET" className="max-w-sm flex-1">
        <input
          type="search"
          name="q"
          placeholder="Search restaurants or dishes…"
          className="w-full rounded border px-3 py-1.5 text-sm"
        />
      </form>
      <nav className="flex items-center gap-4 text-sm">
        {user ? (
          <>
            <span>{displayName}</span>
            <form action={signOut}>
              <button type="submit" className="underline">
                Sign out
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" className="underline">
              Sign in
            </Link>
            <Link href="/sign-up" className="underline">
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
