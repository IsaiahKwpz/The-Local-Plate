import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveRestaurants } from "@/lib/restaurants/queries";

export default async function RestaurantsPage() {
  const supabase = await createClient();
  const restaurants = await getActiveRestaurants(supabase);

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-6 text-2xl font-semibold">Restaurants</h1>
      {restaurants.length === 0 ? (
        <p className="text-gray-500">No restaurants yet.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {restaurants.map((restaurant) => (
            <li key={restaurant.id} className="rounded border p-4">
              <Link
                href={`/restaurants/${restaurant.id}`}
                className="text-lg font-medium underline"
              >
                {restaurant.name}
              </Link>
              <p className="text-sm text-gray-500">{restaurant.address}</p>
              <div className="mt-1 flex gap-2 text-xs">
                <span className="rounded bg-gray-100 px-2 py-0.5">{restaurant.type}</span>
                {restaurant.status !== "active" && (
                  <span className="rounded bg-yellow-100 px-2 py-0.5">
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
