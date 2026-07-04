import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRestaurantWithMenu, type MenuItemWithRating } from "@/lib/restaurants/queries";
import { RatingBadge } from "@/components/rating-badge";

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const result = await getRestaurantWithMenu(supabase, id).catch(() => null);
  if (!result) notFound();
  const { restaurant, items } = result;

  const categories = new Map<string, MenuItemWithRating[]>();
  for (const item of items) {
    const key = item.category ?? "Other";
    if (!categories.has(key)) categories.set(key, []);
    categories.get(key)!.push(item);
  }

  const isChain = restaurant.type === "chain" && restaurant.brand !== null;

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold">{restaurant.name}</h1>
      <p className="text-sm text-gray-500">{restaurant.address}</p>
      {restaurant.status !== "active" && (
        <span className="mt-2 inline-block rounded bg-yellow-100 px-2 py-0.5 text-xs">
          {restaurant.status.replace("_", " ")}
        </span>
      )}

      {items.length === 0 ? (
        <p className="mt-8 text-gray-500">No menu items yet.</p>
      ) : (
        Array.from(categories.entries()).map(([category, categoryItems]) => (
          <section key={category} className="mt-8">
            <h2 className="mb-3 text-lg font-medium">{category}</h2>
            <ul className="flex flex-col gap-4">
              {categoryItems.map((item) => (
                <li key={item.id} className="rounded border p-4">
                  <div className="flex items-baseline justify-between gap-4">
                    <span
                      className={`font-medium ${!item.is_active ? "text-gray-400 line-through" : ""}`}
                    >
                      {item.name}
                    </span>
                    {item.price != null && (
                      <span className="text-sm text-gray-500">
                        ${item.price.toFixed(2)} {item.currency}
                      </span>
                    )}
                  </div>
                  {!item.is_active && (
                    <p className="text-xs text-gray-400">No longer on the menu</p>
                  )}
                  {item.description && (
                    <p className="text-sm text-gray-600">{item.description}</p>
                  )}
                  <div className="mt-2 flex flex-col gap-1">
                    <RatingBadge
                      rating={item.locationRating}
                      label={isChain ? "This location" : undefined}
                    />
                    {isChain && (
                      <RatingBadge
                        rating={item.brandRating}
                        label={`All ${restaurant.brand!.name} locations`}
                      />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </main>
  );
}
