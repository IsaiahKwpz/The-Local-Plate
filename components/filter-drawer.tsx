"use client";

import { useState, type ReactNode } from "react";

// Search's sidebar (categories/dietary/filters) used to render inline above
// the results on mobile, pushing everything down and requiring a scroll
// just to see any matches. Below md, it's now a button that opens a
// slide-out panel instead; at md and up it's the same always-visible
// sidebar as before.
export function FilterDrawer({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-6 flex items-center gap-2 rounded border border-rule bg-surface px-4 py-2 text-sm font-medium text-ink md:hidden"
      >
        Filters & categories
      </button>

      <aside className="hidden md:flex md:flex-col md:gap-6">{children}</aside>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[85vw] max-w-sm flex-col gap-6 overflow-y-auto bg-ground p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-ink">Filters</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close filters"
                className="text-2xl leading-none text-ink-soft"
              >
                ×
              </button>
            </div>
            {children}
          </div>
        </div>
      )}
    </>
  );
}
