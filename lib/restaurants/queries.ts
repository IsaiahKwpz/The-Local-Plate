import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type TypedClient = SupabaseClient<Database>;

// restaurants is a full-table read with no natural per-entity scope (unlike
// a restaurant's own menu_items, which is bounded by definition) - paginate
// with .range() so it never silently truncates past the 1000-row PostgREST
// cap as the restaurant count grows, the same fix already applied to
// menu_item_tags for the same reason.
export async function paginateAll<T>(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const pageSize = 1000;
  let from = 0;
  const all: T[] = [];
  while (true) {
    const { data, error } = await fetchPage(from, from + pageSize - 1);
    if (error) throw error;
    if (!data) break;
    all.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

export async function getActiveRestaurants(supabase: TypedClient) {
  return paginateAll((from, to) =>
    supabase
      .from("restaurants")
      .select("id, name, address, type, status, lat, lng")
      .order("name")
      .range(from, to),
  );
}

export async function getHomeStats(supabase: TypedClient) {
  const [
    { count: restaurantCount },
    { count: dishCount },
    { count: independentCount },
    { data: ratedRestaurantCount },
  ] = await Promise.all([
    supabase.from("restaurants").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("menu_items").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase
      .from("restaurants")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")
      .eq("type", "independent"),
    supabase.rpc("count_rated_restaurants"),
  ]);

  return {
    restaurantCount: restaurantCount ?? 0,
    dishCount: dishCount ?? 0,
    independentCount: independentCount ?? 0,
    ratedRestaurantCount: ratedRestaurantCount ?? 0,
  };
}

// "Explore local" - independent (non-chain) restaurants only, per spec's
// existing type column, no new schema needed. Shows a real dish count
// rather than a rating figure, since these restaurants (freshly ingested)
// mostly have no ratings yet - a fabricated-looking score would be
// misleading; a real item count is honest and still useful.
export async function getExploreLocalRestaurants(supabase: TypedClient, limit = 3) {
  const { data: restaurants, error } = await supabase
    .from("restaurants")
    .select("id, name, address")
    .eq("type", "independent")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  if (restaurants.length === 0) return [];

  const ids = restaurants.map((r) => r.id);
  const { data: items, error: itemsError } = await supabase
    .from("menu_items")
    .select("restaurant_id")
    .in("restaurant_id", ids)
    .eq("is_active", true);
  if (itemsError) throw itemsError;

  const countByRestaurant = new Map<string, number>();
  for (const item of items) {
    countByRestaurant.set(item.restaurant_id, (countByRestaurant.get(item.restaurant_id) ?? 0) + 1);
  }

  return restaurants.map((r) => ({ ...r, itemCount: countByRestaurant.get(r.id) ?? 0 }));
}

// Alphabetical order clusters every location of one chain together (e.g. six
// Boston Pizza rows in a row) - fetch a larger pool and pick one restaurant
// per brand (plus every independent) before sampling, so the homepage
// preview actually reads as a variety of places rather than one chain.
export async function getRestaurantsPreview(supabase: TypedClient, limit = 6) {
  const data = await paginateAll((from, to) =>
    supabase
      .from("restaurants")
      .select("id, name, address, type, brand_id")
      .eq("status", "active")
      .order("name")
      .range(from, to),
  );

  const seenBrands = new Set<string>();
  const deduped = data.filter((r) => {
    if (!r.brand_id) return true;
    if (seenBrands.has(r.brand_id)) return false;
    seenBrands.add(r.brand_id);
    return true;
  });

  for (let i = deduped.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deduped[i], deduped[j]] = [deduped[j], deduped[i]];
  }

  return deduped.slice(0, limit);
}

type RatingAggregate = {
  avg_score: number | null;
  rating_count: number | null;
  avg_taste_score: number | null;
  avg_value_score: number | null;
  avg_uniqueness_score: number | null;
  avg_healthiness_score: number | null;
};

export type MenuItemWithRating = Database["public"]["Tables"]["menu_items"]["Row"] & {
  locationRating: RatingAggregate | null;
  brandRating: RatingAggregate | null;
};

export async function getRestaurantWithMenu(supabase: TypedClient, restaurantId: string) {
  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("*, brand:brands(id, name)")
    .eq("id", restaurantId)
    .single();

  if (restaurantError) throw restaurantError;

  const { data: menuItems, error: menuError } = await supabase
    .from("menu_items")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("category")
    .order("name");

  if (menuError) throw menuError;

  const itemIds = menuItems.map((item) => item.id);

  const locationRatingsByItem = new Map<string, RatingAggregate>();
  if (itemIds.length > 0) {
    const { data: locationRatings, error: locationRatingsError } = await supabase
      .from("menu_item_ratings")
      .select("*")
      .in("menu_item_id", itemIds);

    if (locationRatingsError) throw locationRatingsError;
    for (const r of locationRatings) {
      if (r.menu_item_id) locationRatingsByItem.set(r.menu_item_id, r);
    }
  }

  const brandRatingsByName = new Map<string, RatingAggregate>();
  if (restaurant.type === "chain" && restaurant.brand_id) {
    const { data: brandRatings, error: brandRatingsError } = await supabase
      .from("brand_item_ratings")
      .select("*")
      .eq("brand_id", restaurant.brand_id);

    if (brandRatingsError) throw brandRatingsError;
    for (const r of brandRatings) {
      if (r.item_name) brandRatingsByName.set(r.item_name, r);
    }
  }

  const items: MenuItemWithRating[] = menuItems.map((item) => ({
    ...item,
    locationRating: locationRatingsByItem.get(item.id) ?? null,
    brandRating: brandRatingsByName.get(item.name) ?? null,
  }));

  return { restaurant, items };
}

export type BrandDishLocation = {
  menuItemId: string;
  restaurantId: string;
  restaurantName: string;
  restaurantAddress: string;
  price: number | null;
  currency: string;
  locationRating: RatingAggregate | null;
};

// Powers the "which locations have this dish" page linked from a brand's
// grouped search result - the brand-wide rollup itself (brand_item_ratings)
// already exists for the location page's "All [Brand] locations" badge;
// this is the missing other half, listing the individual locations behind
// that rollup.
export async function getBrandDishLocations(supabase: TypedClient, brandId: string, itemName: string) {
  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("id, name")
    .eq("id", brandId)
    .single();
  if (brandError) throw brandError;

  const [{ data: brandRating }, { data: restaurants, error: restaurantsError }] = await Promise.all([
    supabase
      .from("brand_item_ratings")
      .select("*")
      .eq("brand_id", brandId)
      .eq("item_name", itemName)
      .maybeSingle(),
    supabase.from("restaurants").select("id, name, address").eq("brand_id", brandId).eq("status", "active"),
  ]);
  if (restaurantsError) throw restaurantsError;

  const restaurantById = new Map(restaurants.map((r) => [r.id, r]));
  const restaurantIds = restaurants.map((r) => r.id);
  if (restaurantIds.length === 0) {
    return { brand, brandRating: brandRating ?? null, locations: [] as BrandDishLocation[] };
  }

  const { data: menuItems, error: itemsError } = await supabase
    .from("menu_items")
    .select("id, price, currency, restaurant_id")
    .eq("name", itemName)
    .eq("is_active", true)
    .in("restaurant_id", restaurantIds);
  if (itemsError) throw itemsError;

  const itemIds = menuItems.map((item) => item.id);
  const locationRatingsByItem = new Map<string, RatingAggregate>();
  if (itemIds.length > 0) {
    const { data: ratings, error: ratingsError } = await supabase
      .from("menu_item_ratings")
      .select("*")
      .in("menu_item_id", itemIds);
    if (ratingsError) throw ratingsError;
    for (const r of ratings) {
      if (r.menu_item_id) locationRatingsByItem.set(r.menu_item_id, r);
    }
  }

  const locations: BrandDishLocation[] = menuItems
    .map((item) => {
      const restaurant = restaurantById.get(item.restaurant_id);
      if (!restaurant) return null;
      return {
        menuItemId: item.id,
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        restaurantAddress: restaurant.address,
        price: item.price,
        currency: item.currency,
        locationRating: locationRatingsByItem.get(item.id) ?? null,
      };
    })
    .filter((location): location is BrandDishLocation => location !== null)
    .sort((a, b) => a.restaurantName.localeCompare(b.restaurantName));

  return { brand, brandRating: brandRating ?? null, locations };
}
