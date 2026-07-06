"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// Was previously a pure CSS `:focus-within` dropdown, which is flaky on
// real mobile touch: blur/focus timing around a tap on a link inside the
// dropdown can race with the dropdown's own visibility, swallowing the tap
// (confirmed broken on an actual phone, not just a narrow desktop browser
// window). A document-level "click outside to close" listener is robust on
// both desktop and mobile, since a tap on a suggestion link is "inside" the
// container and never triggers the close handler - the link's own
// navigation just proceeds normally with nothing racing against it.
export function SearchBarWithSuggestions({
  suggestions,
}: {
  suggestions: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleOutside(e: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("click", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("click", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative max-w-sm min-w-0 flex-1">
      <form action="/search" method="GET">
        <input
          type="search"
          name="q"
          placeholder="Search restaurants or dishes…"
          onFocus={() => setOpen(true)}
          className="w-full rounded border border-white/25 bg-white/10 px-3 py-1.5 text-sm text-[#F3E9DC] placeholder:text-[#F3E9DC]/60 focus:outline-none focus:ring-1 focus:ring-[#E8C87E]"
        />
      </form>

      {open && suggestions.length > 0 && (
        <div className="absolute top-full right-0 left-0 z-20 mt-1 rounded border border-rule bg-surface p-2 shadow-lg">
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
