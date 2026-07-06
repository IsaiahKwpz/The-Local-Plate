import Link from "next/link";

// CSS-only show/hide via :focus-within (no JS state) - avoids a real race
// where a blur+setTimeout approach could hide the dropdown mid-click before
// the suggestion link's navigation registered. Focus moving to a link
// inside the group on click keeps the group "focus-within" the whole time.
export function SearchBarWithSuggestions({
  suggestions,
}: {
  suggestions: { id: string; name: string }[];
}) {
  return (
    <div className="group relative max-w-sm min-w-0 flex-1">
      <form action="/search" method="GET">
        <input
          type="search"
          name="q"
          placeholder="Search restaurants or dishes…"
          className="w-full rounded border border-white/25 bg-white/10 px-3 py-1.5 text-sm text-[#F3E9DC] placeholder:text-[#F3E9DC]/60 focus:outline-none focus:ring-1 focus:ring-[#E8C87E]"
        />
      </form>

      {suggestions.length > 0 && (
        <div className="absolute top-full right-0 left-0 z-20 mt-1 hidden rounded border border-rule bg-surface p-2 shadow-lg group-focus-within:block">
          <p className="mb-1.5 px-1 text-xs font-bold tracking-wide text-ink-soft uppercase">
            Popular searches
          </p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <Link
                key={s.id}
                href={`/search?tags=${s.id}`}
                className="rounded-full border border-rule px-2.5 py-1 text-xs text-ink transition hover:border-olive"
              >
                {s.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
