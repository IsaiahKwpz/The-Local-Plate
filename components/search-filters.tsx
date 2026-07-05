const RATING_OPTIONS = [4, 3, 2, 1];

export function SearchFilters({
  q,
  tags,
  minPrice,
  maxPrice,
  minRating,
}: {
  q?: string;
  tags?: string;
  minPrice?: string;
  maxPrice?: string;
  minRating?: string;
}) {
  const hasFilters = Boolean(minPrice || maxPrice || minRating);
  const clearParams = new URLSearchParams();
  if (q) clearParams.set("q", q);
  if (tags) clearParams.set("tags", tags);
  const clearHref = clearParams.toString() ? `/search?${clearParams.toString()}` : "/search";

  return (
    <form method="get" action="/search" className="flex flex-col gap-4">
      {q && <input type="hidden" name="q" value={q} />}
      {tags && <input type="hidden" name="tags" value={tags} />}

      <div>
        <h3 className="mb-2 text-sm font-medium text-ink-soft">Price</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            name="minPrice"
            defaultValue={minPrice}
            placeholder="Min"
            min={0}
            step="0.01"
            className="w-full rounded border border-rule bg-surface px-2 py-1 text-sm"
          />
          <span className="text-ink-soft">–</span>
          <input
            type="number"
            name="maxPrice"
            defaultValue={maxPrice}
            placeholder="Max"
            min={0}
            step="0.01"
            className="w-full rounded border border-rule bg-surface px-2 py-1 text-sm"
          />
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium text-ink-soft">Minimum rating</h3>
        <select
          name="minRating"
          defaultValue={minRating ?? ""}
          className="w-full rounded border border-rule bg-surface px-2 py-1 text-sm"
        >
          <option value="">Any</option>
          {RATING_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}+ stars
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="rounded bg-olive px-3 py-2 text-sm font-medium text-white transition hover:opacity-90"
      >
        Apply filters
      </button>
      {hasFilters && (
        <a href={clearHref} className="text-center text-sm text-ink-soft underline">
          Clear filters
        </a>
      )}
    </form>
  );
}
