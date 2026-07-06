import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  searchRestaurants,
  searchMenuItems,
  searchMenuItemsByTags,
  browseMenuItems,
  getBrowseCategories,
  groupSearchResults,
  groupSearchRestaurants,
  getBrandItemRatings,
  filterMenuItems,
  getTopRatedDishes,
  getTopRatedRestaurants,
  getRestaurantsWithinRadius,
  type MenuItemSearchResult,
} from "@/lib/search/queries";
import { geocodeAddress } from "@/lib/geo/geocode";
import { RatingBadge } from "@/components/rating-badge";
import { CategorySidebar } from "@/components/category-sidebar";
import { SearchFilters } from "@/components/search-filters";
import { RestaurantsViewToggle } from "@/components/restaurants-view-toggle";
import { RestaurantMap } from "@/components/restaurant-map";
import { FilterDrawer } from "@/components/filter-drawer";

function formatDistance(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m away` : `${km.toFixed(1)} km away`;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    tags?: string;
    dietTags?: string;
    minPrice?: string;
    maxPrice?: string;
    minRating?: string;
    address?: string;
    radiusKm?: string;
  }>;
}) {
  const { q, tags, dietTags, minPrice, maxPrice, minRating, address, radiusKm } = await searchParams;
  const query = q?.trim() ?? "";
  const tagIds = tags ? tags.split(",").filter(Boolean) : [];
  const dietTagIds = dietTags ? dietTags.split(",").filter(Boolean) : [];
  const hasTagFilter = tagIds.length > 0 || dietTagIds.length > 0;
  const hasSearch = query.length > 0 || hasTagFilter;
  const trimmedAddress = address?.trim() ?? "";
  const hasFilters = Boolean(minPrice || maxPrice || minRating || trimmedAddress);
  const showResults = hasSearch || hasFilters;
  const supabase = await createClient();
  const [categories, dietCategories] = await Promise.all([
    getBrowseCategories(supabase),
    getBrowseCategories(supabase, "attribute"),
  ]);

  let restaurants: Awaited<ReturnType<typeof searchRestaurants>> = [];
  let groups: ReturnType<typeof groupSearchResults> = [];
  let brandRatings = new Map<string, { avg_score: number | null; rating_count: number | null }>();
  let topDishes: Awaited<ReturnType<typeof getTopRatedDishes>> = [];
  let topRestaurants: Awaited<ReturnType<typeof getTopRatedRestaurants>> = [];
  let distanceByRestaurant = new Map<string, number>();
  let locationError = false;

  if (!showResults) {
    [topDishes, topRestaurants] = await Promise.all([
      getTopRatedDishes(supabase),
      getTopRatedRestaurants(supabase),
    ]);
  }

  if (showResults) {
    let restaurantIdFilter: Set<string> | undefined;

    if (trimmedAddress) {
      const coords = await geocodeAddress(trimmedAddress);
      if (!coords) {
        locationError = true;
      } else {
        const radius = radiusKm ? Number(radiusKm) : 5;
        const nearby = await getRestaurantsWithinRadius(supabase, coords.lat, coords.lng, radius);
        restaurantIdFilter = new Set(nearby.map((r) => r.id));
        distanceByRestaurant = new Map(nearby.map((r) => [r.id, r.distance_km]));
      }
    }

    let rawMenuItems: MenuItemSearchResult[];
    if (hasSearch) {
      const [restaurantsResult, itemsResult] = await Promise.all([
        hasTagFilter ? Promise.resolve([]) : searchRestaurants(supabase, query),
        hasTagFilter ? searchMenuItemsByTags(supabase, tagIds, dietTagIds) : searchMenuItems(supabase, query),
      ]);
      restaurants = restaurantIdFilter
        ? restaurantsResult.filter((r) => restaurantIdFilter!.has(r.id))
        : restaurantsResult;
      rawMenuItems = itemsResult;
    } else {
      rawMenuItems = await browseMenuItems(supabase);
    }

    const menuItems = filterMenuItems(rawMenuItems, {
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      minRating: minRating ? Number(minRating) : undefined,
      restaurantIds: restaurantIdFilter,
    });
    groups = groupSearchResults(menuItems);

    const brandIds = groups.filter((g) => g.brandId).map((g) => g.brandId!);
    brandRatings = await getBrandItemRatings(supabase, brandIds);
  }

  const selectedTagNames = [
    ...categories.filter((c) => tagIds.includes(c.id)),
    ...dietCategories.filter((c) => dietTagIds.includes(c.id)),
  ].map((c) => c.name);

  const heading = selectedTagNames.length > 0 ? selectedTagNames.join(", ") : query;

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="font-display text-2xl font-bold">
        {hasSearch ? (
          <>Results for &ldquo;{heading}&rdquo;</>
        ) : hasFilters ? (
          "Filtered dishes"
        ) : (
          "Browse by category"
        )}
      </h1>
      {!showResults && (
        <p className="mt-2 text-ink-soft">Or search for a restaurant or a dish above.</p>
      )}

      <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-[220px_1fr]">
        <FilterDrawer>
          <div>
            <h2 className="mb-2 font-display text-sm font-bold uppercase tracking-wide text-ink-soft">
              Categories
            </h2>
            <CategorySidebar
              categories={categories}
              activeIds={tagIds}
              paramName="tags"
              placeholder="Filter categories..."
              clearLabel="Clear categories"
              minPrice={minPrice}
              maxPrice={maxPrice}
              minRating={minRating}
              address={address}
              radiusKm={radiusKm}
              otherFacetParam="dietTags"
              otherFacetValue={dietTagIds.length > 0 ? dietTagIds.join(",") : undefined}
            />
          </div>
          {dietCategories.length > 0 && (
            <div>
              <h2 className="mb-2 font-display text-sm font-bold uppercase tracking-wide text-ink-soft">
                Dietary
              </h2>
              <CategorySidebar
                categories={dietCategories}
                activeIds={dietTagIds}
                paramName="dietTags"
                placeholder="Filter dietary tags..."
                clearLabel="Clear dietary tags"
                minPrice={minPrice}
                maxPrice={maxPrice}
                minRating={minRating}
                address={address}
                radiusKm={radiusKm}
                otherFacetParam="tags"
                otherFacetValue={tagIds.length > 0 ? tagIds.join(",") : undefined}
              />
            </div>
          )}
          <div>
            <h2 className="mb-2 font-display text-sm font-bold uppercase tracking-wide text-ink-soft">
              Filters
            </h2>
            <SearchFilters
              q={hasTagFilter ? undefined : query}
              tags={tagIds.length > 0 ? tagIds.join(",") : undefined}
              dietTags={dietTagIds.length > 0 ? dietTagIds.join(",") : undefined}
              minPrice={minPrice}
              maxPrice={maxPrice}
              minRating={minRating}
              address={address}
              radiusKm={radiusKm}
              locationError={locationError}
            />
          </div>
        </FilterDrawer>

        <div className="flex flex-col gap-8">
          {!showResults && (
            <>
              <p className="text-sm text-ink-soft">
                Pick a category from the sidebar, or use the search bar above.
              </p>

              {topRestaurants.length > 0 && (
                <section>
                  <h2 className="mb-3 font-display text-lg font-bold">Top rated restaurants</h2>
                  <ul className="flex flex-col gap-3">
                    {topRestaurants.map((restaurant) => (
                      <li key={restaurant.id} className="rounded border border-rule bg-surface p-4">
                        <div className="flex items-baseline justify-between gap-4">
                          <Link
                            href={`/restaurants/${restaurant.id}`}
                            className="font-display font-bold underline"
                          >
                            {restaurant.name}
                          </Link>
                          <RatingBadge
                            rating={{ avg_score: restaurant.avg_score, rating_count: restaurant.rating_count }}
                          />
                        </div>
                        <p className="text-sm text-ink-soft">{restaurant.address}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {topDishes.length > 0 && (
                <section>
                  <h2 className="mb-3 font-display text-lg font-bold">Top rated dishes</h2>
                  <ul className="flex flex-col gap-3">
                    {topDishes.map((dish) => (
                      <li key={dish.id} className="rounded border border-rule bg-surface p-4">
                        <div className="flex items-baseline justify-between gap-4">
                          <Link href={`/menu-items/${dish.id}`} className="font-medium underline">
                            {dish.name}
                          </Link>
                          {dish.price != null && (
                            <span className="text-sm text-ink-soft">
                              ${dish.price.toFixed(2)} {dish.currency}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-ink-soft">{dish.restaurant_name}</p>
                        <div className="mt-1">
                          <RatingBadge
                            rating={{ avg_score: dish.avg_score, rating_count: dish.rating_count }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}

          {hasSearch && !hasTagFilter && (
            <section>
              <h2 className="mb-3 font-display text-lg font-bold">Restaurants</h2>
              {restaurants.length === 0 ? (
                <p className="text-sm text-ink-soft">No matching restaurants.</p>
              ) : (
                <RestaurantsViewToggle
                  list={
                    <ul className="flex flex-col gap-3">
                      {groupSearchRestaurants(restaurants).map((group) =>
                        group.locations.length > 1 ? (
                          <li key={group.key}>
                            <details className="rounded border border-rule bg-surface open:pb-2">
                              <summary className="flex cursor-pointer items-center justify-between gap-4 p-4 font-display font-bold">
                                <span>{group.label}</span>
                                <span className="text-sm font-normal text-ink-soft">
                                  {group.locations.length} locations
                                </span>
                              </summary>
                              <ul className="flex flex-col gap-3 px-4">
                                {group.locations.map((restaurant) => (
                                  <li key={restaurant.id} className="border-t border-dashed border-rule pt-3">
                                    <div className="flex items-baseline justify-between gap-4">
                                      <Link
                                        href={`/restaurants/${restaurant.id}`}
                                        className="font-medium underline"
                                      >
                                        {restaurant.name}
                                      </Link>
                                      {distanceByRestaurant.has(restaurant.id) && (
                                        <span className="text-sm text-ink-soft">
                                          {formatDistance(distanceByRestaurant.get(restaurant.id)!)}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-ink-soft">{restaurant.address}</p>
                                  </li>
                                ))}
                              </ul>
                            </details>
                          </li>
                        ) : (
                          <li key={group.key} className="rounded border border-rule bg-surface p-4">
                            <div className="flex items-baseline justify-between gap-4">
                              <Link
                                href={`/restaurants/${group.locations[0].id}`}
                                className="font-display font-bold underline"
                              >
                                {group.locations[0].name}
                              </Link>
                              {distanceByRestaurant.has(group.locations[0].id) && (
                                <span className="text-sm text-ink-soft">
                                  {formatDistance(distanceByRestaurant.get(group.locations[0].id)!)}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-ink-soft">{group.locations[0].address}</p>
                          </li>
                        ),
                      )}
                    </ul>
                  }
                  map={
                    <RestaurantMap
                      restaurants={restaurants.map((restaurant) => ({
                        id: restaurant.id,
                        name: restaurant.name,
                        address: restaurant.address,
                        lat: restaurant.lat,
                        lng: restaurant.lng,
                      }))}
                    />
                  }
                />
              )}
            </section>
          )}

          {showResults && (
            <section>
              <h2 className="mb-3 font-display text-lg font-bold">Dishes</h2>
              {groups.length === 0 ? (
                <p className="text-sm text-ink-soft">No matching dishes.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {groups.map((group) => (
                    <details key={group.key} className="rounded border border-rule bg-surface open:pb-2">
                      <summary className="flex cursor-pointer items-center justify-between gap-4 p-4 font-display font-bold">
                        <span>{group.label}</span>
                        <span className="text-sm font-normal text-ink-soft">
                          {group.dishes.length} {group.dishes.length === 1 ? "match" : "matches"}
                          {group.isBrand && group.locationCount > 1
                            ? ` · ${group.locationCount} locations`
                            : ""}
                        </span>
                      </summary>

                      {!group.isBrand && (
                        <div className="px-4 pb-1">
                          <Link
                            href={`/restaurants/${group.dishes[0].items[0].restaurant_id}`}
                            className="text-sm underline"
                          >
                            View restaurant page →
                          </Link>
                        </div>
                      )}

                      <ul className="flex flex-col gap-3 px-4">
                        {group.dishes.map((dish) => {
                          const soleItem = dish.items[0];

                          if (!group.isBrand) {
                            const distance = distanceByRestaurant.get(soleItem.restaurant_id);
                            return (
                              <li key={dish.name} className="border-t border-dashed border-rule pt-3">
                                <div className="flex items-baseline justify-between gap-4">
                                  <Link
                                    href={`/menu-items/${soleItem.id}`}
                                    className="font-medium underline"
                                  >
                                    {dish.name}
                                  </Link>
                                  {soleItem.price != null && (
                                    <span className="text-sm text-ink-soft">
                                      ${soleItem.price.toFixed(2)} {soleItem.currency}
                                    </span>
                                  )}
                                </div>
                                <div className="mt-1 flex items-center gap-3">
                                  <RatingBadge
                                    rating={{
                                      avg_score: soleItem.avg_score,
                                      rating_count: soleItem.rating_count,
                                    }}
                                  />
                                  {distance != null && (
                                    <span className="text-xs text-ink-soft">{formatDistance(distance)}</span>
                                  )}
                                </div>
                              </li>
                            );
                          }

                          const brandRating = group.brandId
                            ? (brandRatings.get(`${group.brandId}:${dish.name}`) ?? null)
                            : null;

                          return (
                            <li key={dish.name} className="border-t border-dashed border-rule pt-3">
                              <details>
                                <summary className="cursor-pointer">
                                  <div className="flex items-baseline justify-between gap-4">
                                    <span className="font-medium underline">{dish.name}</span>
                                    <span className="text-sm text-ink-soft">
                                      {dish.items.length} {dish.items.length === 1 ? "location" : "locations"}
                                    </span>
                                  </div>
                                  <div className="mt-1">
                                    <RatingBadge rating={brandRating} label={`All ${group.label} locations`} />
                                  </div>
                                </summary>
                                <div className="mt-3 flex flex-col gap-3">
                                  <Link
                                    href={`/brands/${group.brandId}/dishes/${encodeURIComponent(dish.name)}`}
                                    className="inline-block self-start rounded bg-olive px-3 py-1.5 text-sm font-medium text-white transition hover:opacity-90"
                                  >
                                    View full details →
                                  </Link>
                                  <ul className="flex flex-col gap-2">
                                    {dish.items.map((item) => {
                                      const distance = distanceByRestaurant.get(item.restaurant_id);
                                      return (
                                        <li key={item.id} className="border-l-2 border-rule pl-3">
                                          <div className="flex items-baseline justify-between gap-4">
                                            <Link
                                              href={`/restaurants/${item.restaurant_id}`}
                                              className="text-sm underline"
                                            >
                                              {item.restaurant_name}
                                            </Link>
                                            {item.price != null && (
                                              <span className="text-xs text-ink-soft">
                                                ${item.price.toFixed(2)} {item.currency}
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-3">
                                            <RatingBadge
                                              rating={{ avg_score: item.avg_score, rating_count: item.rating_count }}
                                              label="This location"
                                            />
                                            {distance != null && (
                                              <span className="text-xs text-ink-soft">{formatDistance(distance)}</span>
                                            )}
                                          </div>
                                        </li>
                                      );
                                    })}
                                  </ul>
                                </div>
                              </details>
                            </li>
                          );
                        })}
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
