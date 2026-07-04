import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { searchRestaurants, searchMenuItems } from "@/lib/search/queries";
import { RatingBadge } from "@/components/rating-badge";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  if (!query) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-12">
        <p className="text-gray-500">Search for a restaurant or a dish above.</p>
      </main>
    );
  }

  const supabase = await createClient();
  const [restaurants, menuItems] = await Promise.all([
    searchRestaurants(supabase, query),
    searchMenuItems(supabase, query),
  ]);

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-6 text-2xl font-semibold">
        Results for &ldquo;{query}&rdquo;
      </h1>

      <section>
        <h2 className="mb-3 text-lg font-medium">Restaurants</h2>
        {restaurants.length === 0 ? (
          <p className="text-sm text-gray-500">No matching restaurants.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {restaurants.map((restaurant) => (
              <li key={restaurant.id} className="rounded border p-4">
                <Link
                  href={`/restaurants/${restaurant.id}`}
                  className="font-medium underline"
                >
                  {restaurant.name}
                </Link>
                <p className="text-sm text-gray-500">{restaurant.address}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-medium">Dishes</h2>
        {menuItems.length === 0 ? (
          <p className="text-sm text-gray-500">No matching dishes.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {menuItems.map((item) => (
              <li key={item.id} className="rounded border p-4">
                <div className="flex items-baseline justify-between gap-4">
                  <Link href={`/menu-items/${item.id}`} className="font-medium underline">
                    {item.name}
                  </Link>
                  {item.price != null && (
                    <span className="text-sm text-gray-500">
                      ${item.price.toFixed(2)} {item.currency}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{item.restaurant_name}</p>
                <div className="mt-1">
                  <RatingBadge
                    rating={{ avg_score: item.avg_score, rating_count: item.rating_count }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
