"use client";

import { useState } from "react";
import Link from "next/link";

function buildTagHref(
  nextTagIds: string[],
  extraParams: { minPrice?: string; maxPrice?: string; minRating?: string },
) {
  const params = new URLSearchParams();
  if (nextTagIds.length > 0) params.set("tags", nextTagIds.join(","));
  if (extraParams.minPrice) params.set("minPrice", extraParams.minPrice);
  if (extraParams.maxPrice) params.set("maxPrice", extraParams.maxPrice);
  if (extraParams.minRating) params.set("minRating", extraParams.minRating);
  const query = params.toString();
  return query ? `/search?${query}` : "/search";
}

export function CategorySidebar({
  categories,
  activeTagIds = [],
  minPrice,
  maxPrice,
  minRating,
}: {
  categories: { id: string; name: string; count: number }[];
  activeTagIds?: string[];
  minPrice?: string;
  maxPrice?: string;
  minRating?: string;
}) {
  const [filterText, setFilterText] = useState("");

  if (categories.length === 0) return null;

  const extraParams = { minPrice, maxPrice, minRating };
  const toggleHref = (categoryId: string) => {
    const isActive = activeTagIds.includes(categoryId);
    const nextIds = isActive
      ? activeTagIds.filter((id) => id !== categoryId)
      : [...activeTagIds, categoryId];
    return buildTagHref(nextIds, extraParams);
  };

  const query = filterText.trim().toLowerCase();
  const visibleCategories = categories.filter(
    (category) => activeTagIds.includes(category.id) || category.name.toLowerCase().includes(query),
  );

  return (
    <div className="flex flex-col gap-2">
      {activeTagIds.length > 0 && (
        <Link href={buildTagHref([], extraParams)} className="self-start text-xs text-ink-soft underline">
          Clear categories
        </Link>
      )}

      <input
        type="text"
        value={filterText}
        onChange={(e) => setFilterText(e.target.value)}
        placeholder="Filter categories..."
        className="w-full rounded border border-rule bg-surface px-2 py-1 text-sm"
      />

      <div className="flex max-h-72 flex-col gap-0.5 overflow-y-auto">
        {visibleCategories.length === 0 ? (
          <p className="px-1 py-1 text-sm text-ink-soft">No matching categories.</p>
        ) : (
          visibleCategories.map((category) => {
            const isActive = activeTagIds.includes(category.id);
            return (
              <Link
                key={category.id}
                href={toggleHref(category.id)}
                aria-pressed={isActive}
                className={`flex items-center justify-between rounded px-3 py-1.5 text-sm transition ${
                  isActive ? "bg-olive text-white" : "text-ink hover:bg-ground"
                }`}
              >
                <span className="flex items-center gap-2">
                  {isActive && <span aria-hidden>✓</span>}
                  {category.name}
                </span>
                <span className={isActive ? "opacity-80" : "text-ink-soft"}>{category.count}</span>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
