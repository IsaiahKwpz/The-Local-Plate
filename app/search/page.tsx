import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  searchRestaurants,
  searchMenuItems,
  searchMenuItemsByTags,
  getBrowseCategories,
  groupByRestaurant,
  filterMenuItems,
  type MenuItemSearchResult,
} from "@/lib/search/queries";
import { RatingBadge } from "@/components/rating-badge";
import { CategorySidebar } from "@/components/category-sidebar";
import { SearchFilters } from "@/components/search-filters";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    tags?: string;
    minPrice?: string;
    maxPrice?: string;
    minRating?: string;
  }>;
}) {
  const { q, tags, minPrice, maxPrice, minRating } = await searchParams;
  const query = q?.trim() ?? "";
  const tagIds = tags ? tags.split(",").filter(Boolean) : [];
  const hasSearch = query.length > 0 || tagIds.length > 0;
  const supabase = await createClient();
  const categories = await getBrowseCategories(supabase);

  let restaurants: Awaited<ReturnType<typeof searchRestaurants>> = [];
  let groups: ReturnType<typeof groupByRestaurant> = [];

  if (hasSearch) {
    const [restaurantsResult, rawMenuItems]: [
      Awaited<ReturnType<typeof searchRestaurants>>,
      MenuItemSearchResult[],
    ] = await Promise.all([
      tagIds.length > 0 ? Promise.resolve([]) : searchRestaurants(supabase, query),
      tagIds.length > 0 ? searchMenuItemsByTags(supabase, tagIds) : searchMenuItems(supabase, query),
    ]);
    restaurants = restaurantsResult;

    const menuItems = filterMenuItems(rawMenuItems, {
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      minRating: minRating ? Number(minRating) : undefined,
    });
    groups = groupByRestaurant(menuItems);
  }

  const heading =
    tagIds.length > 0
      ? categories
          .filter((c) => tagIds.includes(c.id))
          .map((c) => c.name)
          .join(", ")
      : query;

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="font-display text-2xl font-bold">
        {hasSearch ? <>Results for &ldquo;{heading}&rdquo;</> : "Browse by category"}
      </h1>
      {!hasSearch && (
        <p className="mt-2 text-ink-soft">Or search for a restaurant or a dish above.</p>
      )}

      <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-[220px_1fr]">
        <aside className="flex flex-col gap-6">
          <div>
            <h2 className="mb-2 font-display text-sm font-bold uppercase tracking-wide text-ink-soft">
              Categories
            </h2>
            <CategorySidebar
              categories={categories}
              activeTagIds={tagIds}
              minPrice={minPrice}
              maxPrice={maxPrice}
              minRating={minRating}
            />
          </div>
          {hasSearch && (
            <div>
              <h2 className="mb-2 font-display text-sm font-bold uppercase tracking-wide text-ink-soft">
                Filters
              </h2>
              <SearchFilters
                q={tagIds.length > 0 ? undefined : query}
                tags={tagIds.length > 0 ? tagIds.join(",") : undefined}
                minPrice={minPrice}
                maxPrice={maxPrice}
                minRating={minRating}
              />
            </div>
          )}
        </aside>

        <div className="flex flex-col gap-8">
          {!hasSearch && (
            <p className="text-sm text-ink-soft">
              Pick a category from the sidebar, or use the search bar above.
            </p>
          )}

          {hasSearch && tagIds.length === 0 && (
            <section>
              <h2 className="mb-3 font-display text-lg font-bold">Restaurants</h2>
              {restaurants.length === 0 ? (
                <p className="text-sm text-ink-soft">No matching restaurants.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {restaurants.map((restaurant) => (
                    <li key={restaurant.id} className="rounded border border-rule bg-surface p-4">
                      <Link
                        href={`/restaurants/${restaurant.id}`}
                        className="font-display font-bold underline"
                      >
                        {restaurant.name}
                      </Link>
                      <p className="text-sm text-ink-soft">{restaurant.address}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {hasSearch && (
            <section>
              <h2 className="mb-3 font-display text-lg font-bold">Dishes</h2>
              {groups.length === 0 ? (
                <p className="text-sm text-ink-soft">No matching dishes.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {groups.map((group) => (
                    <details
                      key={group.restaurantId}
                      className="rounded border border-rule bg-surface open:pb-2"
                    >
                      <summary className="flex cursor-pointer items-center justify-between gap-4 p-4 font-display font-bold">
                        <span>{group.restaurantName}</span>
                        <span className="text-sm font-normal text-ink-soft">
                          {group.items.length} {group.items.length === 1 ? "match" : "matches"}
                        </span>
                      </summary>
                      <div className="px-4 pb-1">
                        <Link
                          href={`/restaurants/${group.restaurantId}`}
                          className="text-sm underline"
                        >
                          View restaurant page →
                        </Link>
                      </div>
                      <ul className="flex flex-col gap-3 px-4">
                        {group.items.map((item) => (
                          <li key={item.id} className="border-t border-dashed border-rule pt-3">
                            <div className="flex items-baseline justify-between gap-4">
                              <Link href={`/menu-items/${item.id}`} className="font-medium underline">
                                {item.name}
                              </Link>
                              {item.price != null && (
                                <span className="text-sm text-ink-soft">
                                  ${item.price.toFixed(2)} {item.currency}
                                </span>
                              )}
                            </div>
                            <div className="mt-1">
                              <RatingBadge
                                rating={{ avg_score: item.avg_score, rating_count: item.rating_count }}
                              />
                            </div>
                          </li>
                        ))}
                      </ul>
                    </details>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
