import Link from "next/link";

export function BrowseCategories({
  categories,
  activeTagId,
}: {
  categories: { id: string; name: string; count: number }[];
  activeTagId?: string;
}) {
  if (categories.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/search?tag=${category.id}&tagName=${encodeURIComponent(category.name)}`}
          className={`rounded-full border px-3 py-1 text-sm transition ${
            activeTagId === category.id
              ? "border-olive bg-olive text-white"
              : "border-rule bg-surface text-ink hover:border-olive"
          }`}
        >
          {category.name} <span className={activeTagId === category.id ? "opacity-80" : "text-ink-soft"}>({category.count})</span>
        </Link>
      ))}
    </div>
  );
}
