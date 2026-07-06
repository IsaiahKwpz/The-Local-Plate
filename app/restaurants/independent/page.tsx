import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getIndependentRestaurants } from "@/lib/restaurants/queries";

export default async function IndependentRestaurantsPage() {
  const supabase = await createClient();
  const restaurants = await getIndependentRestaurants(supabase);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <h1 className="font-display text-2xl font-bold">Independent restaurants</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {restaurants.length} kitchens owned and run right here in Ottawa, not part of any chain.
      </p>

      {restaurants.length === 0 ? (
        <p className="mt-6 text-ink-soft">No independent restaurants yet.</p>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {restaurants.map((restaurant) => (
            <li key={restaurant.id} className="rounded border border-rule bg-surface p-4">
              <span className="text-xs font-bold tracking-wide text-olive uppercase">Independent</span>
              <Link
                href={`/restaurants/${restaurant.id}`}
                className="mt-1 block font-display font-bold hover:underline"
              >
                {restaurant.name}
              </Link>
              <p className="text-sm text-ink-soft">{restaurant.address}</p>
              <p className="mt-2 text-sm font-semibold text-rust">
                {restaurant.itemCount} {restaurant.itemCount === 1 ? "dish" : "dishes"} on the menu
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
