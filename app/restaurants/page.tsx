import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveRestaurants } from "@/lib/restaurants/queries";
import { RestaurantsViewToggle } from "@/components/restaurants-view-toggle";
import { RestaurantMap } from "@/components/restaurant-map";

export default async function RestaurantsPage() {
  const supabase = await createClient();
  const restaurants = await getActiveRestaurants(supabase);

  const list = (
    <>
      {restaurants.length === 0 ? (
        <p className="mt-6 text-ink-soft">No restaurants yet.</p>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {restaurants.map((restaurant) => (
            <li key={restaurant.id} className="rounded border border-rule bg-surface p-4">
              <Link
                href={`/restaurants/${restaurant.id}`}
                className="font-display font-bold hover:underline"
              >
                {restaurant.name}
              </Link>
              <p className="text-sm text-ink-soft">{restaurant.address}</p>
              <div className="mt-2 flex gap-2 text-xs">
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
    </>
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <h1 className="font-display text-2xl font-bold">Restaurants</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {restaurants.length} on the list, Ottawa · Don&apos;t see your favourite spot?{" "}
        <Link href="/restaurants/new" className="underline">
          Add a restaurant
        </Link>
      </p>

      <div className="mt-6">
        <RestaurantsViewToggle list={list} map={<RestaurantMap restaurants={restaurants} />} />
      </div>
    </main>
  );
}
