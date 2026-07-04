import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMenuItemDetail, getRatingsForItem, getUserRating } from "@/lib/ratings/queries";
import { RatingBadge } from "@/components/rating-badge";
import { RatingForm } from "@/components/rating-form";

export default async function MenuItemPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const { itemId } = await params;
  const supabase = await createClient();

  const detail = await getMenuItemDetail(supabase, itemId).catch(() => null);
  if (!detail) notFound();
  const { item, restaurant, locationRating, brandRating } = detail;

  const [
    {
      data: { user },
    },
    ratings,
  ] = await Promise.all([supabase.auth.getUser(), getRatingsForItem(supabase, itemId)]);

  const userRating = user ? await getUserRating(supabase, itemId, user.id) : null;
  const isChain = restaurant.type === "chain" && restaurant.brand !== null;

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link href={`/restaurants/${restaurant.id}`} className="text-sm underline">
        ← {restaurant.name}
      </Link>

      <h1 className="mt-2 text-2xl font-semibold">{item.name}</h1>
      {!item.is_active && (
        <p className="text-xs text-gray-400">No longer on the menu</p>
      )}
      {item.description && <p className="mt-1 text-gray-600">{item.description}</p>}
      {item.price != null && (
        <p className="mt-1 text-sm text-gray-500">
          ${item.price.toFixed(2)} {item.currency}
        </p>
      )}

      <div className="mt-4 flex flex-col gap-1">
        <RatingBadge rating={locationRating} label={isChain ? "This location" : undefined} />
        {isChain && (
          <RatingBadge rating={brandRating} label={`All ${restaurant.brand!.name} locations`} />
        )}
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-medium">Rate this</h2>
        {user ? (
          <RatingForm
            menuItemId={item.id}
            restaurantId={restaurant.id}
            existingRating={userRating}
          />
        ) : (
          <p className="text-sm text-gray-600">
            <Link href={`/login?next=/menu-items/${item.id}`} className="underline">
              Sign in
            </Link>{" "}
            or{" "}
            <Link href={`/sign-up?next=/menu-items/${item.id}`} className="underline">
              sign up
            </Link>{" "}
            to rate this.
          </p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-medium">Ratings ({ratings.length})</h2>
        {ratings.length === 0 ? (
          <p className="text-sm text-gray-500">No ratings yet — be the first.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {ratings.map((r) => (
              <li key={r.id} className="rounded border p-4">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-medium">{r.user?.display_name ?? "Anonymous"}</span>
                  <span className="text-sm text-gray-500" aria-label={`${r.score} out of 5`}>
                    {"★".repeat(r.score)}
                    {"☆".repeat(5 - r.score)}
                  </span>
                </div>
                {r.comment && <p className="mt-1 text-sm text-gray-600">{r.comment}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
