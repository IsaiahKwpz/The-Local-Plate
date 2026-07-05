const RATING_OPTIONS = [4, 3, 2, 1];
const RADIUS_OPTIONS = [1, 2, 5, 10, 20];

export function SearchFilters({
  q,
  tags,
  minPrice,
  maxPrice,
  minRating,
  address,
  radiusKm,
  locationError,
}: {
  q?: string;
  tags?: string;
  minPrice?: string;
  maxPrice?: string;
  minRating?: string;
  address?: string;
  radiusKm?: string;
  locationError?: boolean;
}) {
  const hasFilters = Boolean(minPrice || maxPrice || minRating || address);
  const clearParams = new URLSearchParams();
  if (q) clearParams.set("q", q);
  if (tags) clearParams.set("tags", tags);
  const clearHref = clearParams.toString() ? `/search?${clearParams.toString()}` : "/search";

  return (
    <form method="get" action="/search" className="flex flex-col gap-4">
      {q && <input type="hidden" name="q" value={q} />}
      {tags && <input type="hidden" name="tags" value={tags} />}

      <div>
        <h3 className="mb-2 text-sm font-medium text-ink-soft">Near an address</h3>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            name="address"
            defaultValue={address}
            placeholder="e.g. 123 Bank St, Ottawa"
            className="w-full rounded border border-rule bg-surface px-2 py-1 text-sm"
          />
          <select
            name="radiusKm"
            defaultValue={radiusKm ?? "5"}
            className="w-full rounded border border-rule bg-surface px-2 py-1 text-sm"
          >
            {RADIUS_OPTIONS.map((n) => (
              <option key={n} value={n}>
                within {n} km
              </option>
            ))}
          </select>
        </div>
        {locationError && (
          <p className="mt-1 text-xs text-rust">Couldn&rsquo;t find that address. Try being more specific.</p>
        )}
      </div>

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
