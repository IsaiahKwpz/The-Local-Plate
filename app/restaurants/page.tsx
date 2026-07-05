import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveRestaurants } from "@/lib/restaurants/queries";

export default async function RestaurantsPage() {
  const supabase = await createClient();
  const restaurants = await getActiveRestaurants(supabase);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-2xl font-bold">Restaurants</h1>
      <p className="mt-1 text-sm text-ink-soft">{restaurants.length} on the list, Ottawa</p>
      {restaurants.length === 0 ? (
        <p className="mt-6 text-ink-soft">No restaurants yet.</p>
      ) : (
        <ul className="mt-6">
          {restaurants.map((restaurant) => (
            <li
              key={restaurant.id}
              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-dashed border-rule py-4"
            >
              <div>
                <Link
                  href={`/restaurants/${restaurant.id}`}
                  className="font-display font-bold hover:underline"
                >
                  {restaurant.name}
                </Link>
                <p className="text-sm text-ink-soft">{restaurant.address}</p>
              </div>
              <div className="flex gap-2 text-xs">
                <span className="rounded-full border border-rule px-2 py-0.5 text-ink-soft">
                  {restaurant.type === "independent" ? "Independent" : "Chain"}
                </span>
                {restaurant.status !== "active" && (
                  <span className="rounded-full bg-rust/10 px-2 py-0.5 text-rust">
                    {restaurant.status.replace("_", " ")}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
