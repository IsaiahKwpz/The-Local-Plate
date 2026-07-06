import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth/actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { SearchBarWithSuggestions } from "@/components/search-bar-with-suggestions";
import { getBrowseCategories } from "@/lib/search/queries";

export async function SiteHeader() {
  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    categories,
  ] = await Promise.all([supabase.auth.getUser(), getBrowseCategories(supabase)]);
  const popularSearches = categories.slice(0, 8);

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
          <SearchBarWithSuggestions suggestions={popularSearches} />
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/restaurants/new" className="underline decoration-white/40 underline-offset-2">
              Add a restaurant
            </Link>
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
