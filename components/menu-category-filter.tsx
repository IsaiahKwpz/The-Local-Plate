"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { RatingBadge } from "@/components/rating-badge";
import { RatingBreakdown } from "@/components/rating-breakdown";

type RatingAggregate = {
  avg_score: number | null;
  rating_count: number | null;
  avg_taste_score: number | null;
  avg_value_score: number | null;
  avg_presentation_score: number | null;
  avg_nutrition_score: number | null;
} | null;

export type FilterableMenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  currency: string;
  is_active: boolean;
  category: string;
  tags: string[];
  locationRating: RatingAggregate;
  brandRating: RatingAggregate;
};

export function MenuCategoryFilter({
  items,
  categories,
  isChain,
  brandName,
}: {
  items: FilterableMenuItem[];
  categories: string[];
  isChain: boolean;
  brandName?: string;
}) {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (activeCategory !== "All" && item.category !== activeCategory) return false;
      if (!q) return true;
      return item.name.toLowerCase().includes(q) || item.tags.some((t) => t.toLowerCase().includes(q));
    });
  }, [items, activeCategory, query]);

  const filteredByCategory = new Map<string, FilterableMenuItem[]>();
  for (const item of filtered) {
    if (!filteredByCategory.has(item.category)) filteredByCategory.set(item.category, []);
    filteredByCategory.get(item.category)!.push(item);
  }

  return (
    <div className="mt-8">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search this menu by dish or tag…"
        className="w-full rounded border border-rule bg-surface px-3 py-2 text-sm text-ink"
      />

      <div className="mt-3 flex flex-wrap gap-2">
        {["All", ...categories].map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveCategory(category)}
            aria-pressed={activeCategory === category}
            className={`rounded-full px-3 py-1 text-sm transition ${
              activeCategory === category
                ? "bg-olive text-white"
                : "border border-rule text-ink hover:border-olive"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-6 text-sm text-ink-soft">No dishes match that search.</p>
      ) : (
        categories
          .filter((category) => filteredByCategory.has(category))
          .map((category) => (
            <section key={category} className="mt-6">
              <h2 className="mb-3 font-display text-lg font-bold text-ink">{category}</h2>
              <ul className="flex flex-col gap-4">
                {filteredByCategory.get(category)!.map((item) => (
                  <li key={item.id} className="rounded border border-rule bg-surface p-4">
                    <div className="flex items-baseline justify-between gap-4">
                      <Link
                        href={`/menu-items/${item.id}`}
                        className={`font-medium underline ${!item.is_active ? "text-ink-soft" : "text-ink"}`}
                      >
                        {item.name}
                      </Link>
                      {item.price != null && (
                        <span className="text-sm text-ink-soft">
                          ${item.price.toFixed(2)} {item.currency}
                        </span>
                      )}
                    </div>
                    {!item.is_active && <p className="text-xs text-ink-soft">No longer on the menu</p>}
                    {item.description && <p className="text-sm text-ink-soft">{item.description}</p>}
                    <div className="mt-2 flex flex-col gap-1">
                      <RatingBadge rating={item.locationRating} label={isChain ? "This location" : undefined} />
                      <RatingBreakdown rating={item.locationRating} />
                      {isChain && (
                        <>
                          <RatingBadge rating={item.brandRating} label={`All ${brandName} locations`} />
                          <RatingBreakdown rating={item.brandRating} />
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))
      )}
    </div>
  );
}
