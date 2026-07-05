import Link from "next/link";

function buildHref(
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

export function BrowseCategories({
  categories,
  activeTagIds = [],
  variant = "chips",
  minPrice,
  maxPrice,
  minRating,
}: {
  categories: { id: string; name: string; count: number }[];
  activeTagIds?: string[];
  variant?: "chips" | "list";
  minPrice?: string;
  maxPrice?: string;
  minRating?: string;
}) {
  if (categories.length === 0) return null;

  const extraParams = { minPrice, maxPrice, minRating };
  const toggleHref = (categoryId: string) => {
    const isActive = activeTagIds.includes(categoryId);
    const nextIds = isActive
      ? activeTagIds.filter((id) => id !== categoryId)
      : [...activeTagIds, categoryId];
    return buildHref(nextIds, extraParams);
  };

  if (variant === "list") {
    return (
      <div className="flex flex-col gap-0.5">
        {activeTagIds.length > 0 && (
          <Link
            href={buildHref([], extraParams)}
            className="mb-1 self-start text-xs text-ink-soft underline"
          >
            Clear categories
          </Link>
        )}
        {categories.map((category) => {
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
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => {
        const isActive = activeTagIds.includes(category.id);
        return (
          <Link
            key={category.id}
            href={toggleHref(category.id)}
            aria-pressed={isActive}
            className={`rounded-full border px-3 py-1 text-sm transition ${
              isActive
                ? "border-olive bg-olive text-white"
                : "border-rule bg-surface text-ink hover:border-olive"
            }`}
          >
            {category.name} <span className={isActive ? "opacity-80" : "text-ink-soft"}>({category.count})</span>
          </Link>
        );
      })}
    </div>
  );
}
