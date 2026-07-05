import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth/actions";
import { ThemeToggle } from "@/components/theme-toggle";

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
    <>
      <header className="bg-wood text-[#F3E9DC]">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="font-display text-lg font-bold whitespace-nowrap">
            The Local <span className="text-[#E8C87E]">Plate</span>
          </Link>
          <form action="/search" method="GET" className="max-w-sm min-w-0 flex-1">
            <input
              type="search"
              name="q"
              placeholder="Search restaurants or dishes…"
              className="w-full rounded border border-white/25 bg-white/10 px-3 py-1.5 text-sm text-[#F3E9DC] placeholder:text-[#F3E9DC]/60 focus:outline-none focus:ring-1 focus:ring-[#E8C87E]"
            />
          </form>
          <nav className="flex items-center gap-4 text-sm">
            {user ? (
              <>
                <span>{displayName}</span>
                <form action={signOut}>
                  <button type="submit" className="underline decoration-white/40 underline-offset-2">
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" className="underline decoration-white/40 underline-offset-2">
                  Sign in
                </Link>
                <Link href="/sign-up" className="underline decoration-white/40 underline-offset-2">
                  Sign up
                </Link>
              </>
            )}
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <div className="gingham-strip" />
    </>
  );
}
