import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBrandDishLocations } from "@/lib/restaurants/queries";
import { RatingBadge } from "@/components/rating-badge";

export default async function BrandDishPage({
  params,
}: {
  params: Promise<{ brandId: string; itemName: string }>;
}) {
  const { brandId, itemName: encodedItemName } = await params;
  const itemName = decodeURIComponent(encodedItemName);
  const supabase = await createClient();

  const result = await getBrandDishLocations(supabase, brandId, itemName).catch(() => null);
  if (!result || result.locations.length === 0) notFound();
  const { brand, brandRating, locations } = result;

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/search" className="text-sm underline">
        ← Back to search
      </Link>

      <h1 className="mt-2 font-display text-2xl font-bold">{itemName}</h1>
      <p className="text-ink-soft">{brand.name}</p>

      <div className="mt-4">
        <RatingBadge rating={brandRating} label={`All ${brand.name} locations`} />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 font-display text-lg font-bold">
          Available at {locations.length} {locations.length === 1 ? "location" : "locations"}
        </h2>
        <ul className="flex flex-col gap-3">
          {locations.map((location) => (
            <li key={location.menuItemId} className="rounded border border-rule bg-surface p-4">
              <div className="flex items-baseline justify-between gap-4">
                <Link
                  href={`/restaurants/${location.restaurantId}`}
                  className="font-display font-bold underline"
                >
                  {location.restaurantName}
                </Link>
                {location.price != null && (
                  <span className="text-sm text-ink-soft">
                    ${location.price.toFixed(2)} {location.currency}
                  </span>
                )}
              </div>
              <p className="text-sm text-ink-soft">{location.restaurantAddress}</p>
              <div className="mt-2">
                <RatingBadge rating={location.locationRating} label="This location" />
              </div>
              <Link
                href={`/menu-items/${location.menuItemId}`}
                className="mt-2 inline-block text-sm underline"
              >
                Rate this / view details →
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
