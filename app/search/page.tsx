import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  searchRestaurants,
  searchMenuItems,
  searchMenuItemsByTag,
  getBrowseCategories,
  groupByRestaurant,
  type MenuItemSearchResult,
} from "@/lib/search/queries";
import { RatingBadge } from "@/components/rating-badge";
import { BrowseCategories } from "@/components/browse-categories";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string; tagName?: string }>;
}) {
  const { q, tag, tagName } = await searchParams;
  const query = q?.trim() ?? "";
  const supabase = await createClient();
  const categories = await getBrowseCategories(supabase);

  if (!query && !tag) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-display text-2xl font-bold">Browse by category</h1>
        <p className="mt-2 text-ink-soft">Or search for a restaurant or a dish above.</p>
        <div className="mt-6">
          <BrowseCategories categories={categories} />
        </div>
      </main>
    );
  }

  const [restaurants, menuItems]: [
    Awaited<ReturnType<typeof searchRestaurants>>,
    MenuItemSearchResult[],
  ] = await Promise.all([
    tag ? Promise.resolve([]) : searchRestaurants(supabase, query),
    tag ? searchMenuItemsByTag(supabase, tag) : searchMenuItems(supabase, query),
  ]);

  const groups = groupByRestaurant(menuItems);
  const heading = tag ? (tagName ?? "Category") : query;

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-2xl font-bold">
        Results for &ldquo;{heading}&rdquo;
      </h1>

      <div className="mt-4">
        <BrowseCategories categories={categories} activeTagId={tag} />
      </div>

      {!tag && (
        <section className="mt-8">
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

      <section className="mt-8">
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
    </main>
  );
}
