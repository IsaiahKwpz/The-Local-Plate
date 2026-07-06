"use client";

import { useState, type ReactNode } from "react";

export function MenuCategoryFilter({
  sections,
}: {
  sections: { category: string; content: ReactNode }[];
}) {
  const [active, setActive] = useState<string>("All");

  return (
    <div className="mt-8">
      <div className="flex flex-wrap gap-2">
        {["All", ...sections.map((s) => s.category)].map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActive(category)}
            aria-pressed={active === category}
            className={`rounded-full px-3 py-1 text-sm transition ${
              active === category
                ? "bg-olive text-white"
                : "border border-rule text-ink hover:border-olive"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {sections.map(({ category, content }) => (
        <div key={category} className={active === "All" || active === category ? "" : "hidden"}>
          {content}
        </div>
      ))}
    </div>
  );
}
