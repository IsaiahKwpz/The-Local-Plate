"use client";

import { useState } from "react";
import Link from "next/link";

function buildTagHref(paramName: string, nextIds: string[], extraParams: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  if (nextIds.length > 0) params.set(paramName, nextIds.join(","));
  for (const [key, value] of Object.entries(extraParams)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `/search?${query}` : "/search";
}

// Generic faceted tag picker - used for both the dish-category facet
// (paramName="tags") and the dietary facet (paramName="dietTags"). Each
// instance preserves the OTHER facet's current selection via
// otherFacetParam/otherFacetValue, so toggling one doesn't clear the other -
// the two facets combine as AND (category AND diet), OR within each.
export function CategorySidebar({
  categories,
  activeIds = [],
  paramName = "tags",
  placeholder = "Filter categories...",
  clearLabel = "Clear categories",
  minPrice,
  maxPrice,
  minRating,
  address,
  radiusKm,
  otherFacetParam,
  otherFacetValue,
}: {
  categories: { id: string; name: string; count: number }[];
  activeIds?: string[];
  paramName?: string;
  placeholder?: string;
  clearLabel?: string;
  minPrice?: string;
  maxPrice?: string;
  minRating?: string;
  address?: string;
  radiusKm?: string;
  otherFacetParam?: string;
  otherFacetValue?: string;
}) {
  const [filterText, setFilterText] = useState("");

  if (categories.length === 0) return null;

  const extraParams: Record<string, string | undefined> = { minPrice, maxPrice, minRating, address, radiusKm };
  if (otherFacetParam) extraParams[otherFacetParam] = otherFacetValue;

  const toggleHref = (id: string) => {
    const isActive = activeIds.includes(id);
    const nextIds = isActive ? activeIds.filter((x) => x !== id) : [...activeIds, id];
    return buildTagHref(paramName, nextIds, extraParams);
  };

  const query = filterText.trim().toLowerCase();
  const visibleCategories = categories.filter(
    (category) => activeIds.includes(category.id) || category.name.toLowerCase().includes(query),
  );

  return (
    <div className="flex flex-col gap-2">
      {activeIds.length > 0 && (
        <Link href={buildTagHref(paramName, [], extraParams)} className="self-start text-xs text-ink-soft underline">
          {clearLabel}
        </Link>
      )}

      <input
        type="text"
        value={filterText}
        onChange={(e) => setFilterText(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded border border-rule bg-surface px-2 py-1 text-sm"
      />

      <div className="flex max-h-72 flex-col gap-0.5 overflow-y-auto">
        {visibleCategories.length === 0 ? (
          <p className="px-1 py-1 text-sm text-ink-soft">No matching categories.</p>
        ) : (
          visibleCategories.map((category) => {
            const isActive = activeIds.includes(category.id);
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
