import Link from "next/link";

export function buildTagHref(
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
}: {
  categories: { id: string; name: string; count: number }[];
  activeTagIds?: string[];
}) {
  if (categories.length === 0) return null;

  const toggleHref = (categoryId: string) => {
    const isActive = activeTagIds.includes(categoryId);
    const nextIds = isActive
      ? activeTagIds.filter((id) => id !== categoryId)
      : [...activeTagIds, categoryId];
    return buildTagHref(nextIds, {});
  };

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
