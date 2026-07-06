import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRestaurantWithMenu, type MenuItemWithRating } from "@/lib/restaurants/queries";
import { getOwnClaimStatus } from "@/lib/claims/queries";
import { getApprovedPhotosForTarget, getOwnPendingPhotosForTarget } from "@/lib/photos/queries";
import { RatingBadge } from "@/components/rating-badge";
import { RatingBreakdown } from "@/components/rating-breakdown";
import { ReportButton } from "@/components/report-button";
import { ClaimRestaurantButton } from "@/components/claim-restaurant-button";
import { OwnerApprovalToggle } from "@/components/owner-approval-toggle";
import { PhotoUploadForm } from "@/components/photo-upload-form";
import { PhotoGallery } from "@/components/photo-gallery";
import { AddDishButton } from "@/components/add-dish-button";
import { MenuCategoryFilter } from "@/components/menu-category-filter";

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOwner = !!user && restaurant.owner_user_id === user.id;
  const claimStatus =
    !restaurant.owner_user_id && user
      ? await getOwnClaimStatus(supabase, restaurant.id, user.id)
      : null;

  const [approvedPhotos, ownPendingPhotos] = await Promise.all([
    getApprovedPhotosForTarget(supabase, "restaurant", restaurant.id),
    user
      ? getOwnPendingPhotosForTarget(supabase, "restaurant", restaurant.id, user.id)
      : Promise.resolve([]),
  ]);
  const photos = [...approvedPhotos, ...ownPendingPhotos];

  const categories = new Map<string, MenuItemWithRating[]>();
  for (const item of items) {
    const key = item.category ?? "Other";
    if (!categories.has(key)) categories.set(key, []);
    categories.get(key)!.push(item);
  }

  const isChain = restaurant.type === "chain" && restaurant.brand !== null;
  const currentPath = `/restaurants/${restaurant.id}`;

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_300px]">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{restaurant.name}</h1>
          <p className="text-sm text-ink-soft">{restaurant.address}</p>
          {restaurant.status !== "active" && (
            <span className="mt-2 inline-block rounded bg-rust/20 px-2 py-0.5 text-xs text-ink">
              {restaurant.status.replace("_", " ")}
            </span>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <ReportButton
              targetType="restaurant"
              targetId={restaurant.id}
              isSignedIn={!!user}
              currentPath={currentPath}
            />
            {restaurant.owner_user_id ? (
              <span className="text-xs text-ink-soft">✓ Verified owner</span>
            ) : (
              <ClaimRestaurantButton
                restaurantId={restaurant.id}
                isSignedIn={!!user}
                currentPath={currentPath}
                initialStatus={claimStatus}
              />
            )}
            <PhotoUploadForm
              targetType="restaurant"
              targetId={restaurant.id}
              isSignedIn={!!user}
              currentPath={currentPath}
            />
            <AddDishButton restaurantId={restaurant.id} isSignedIn={!!user} currentPath={currentPath} />
          </div>
          {isOwner && (
            <OwnerApprovalToggle
              restaurantId={restaurant.id}
              requireOwnerApproval={restaurant.require_owner_approval}
            />
          )}

          {items.length === 0 ? (
            <p className="mt-8 text-ink-soft">No menu items yet.</p>
          ) : (
            <MenuCategoryFilter
              sections={Array.from(categories.entries()).map(([category, categoryItems]) => ({
                category,
                content: (
                  <section className="mt-6">
                    <h2 className="mb-3 font-display text-lg font-bold text-ink">{category}</h2>
                    <ul className="flex flex-col gap-4">
                      {categoryItems.map((item) => (
                        <li key={item.id} className="rounded border border-rule bg-surface p-4">
                          <div className="flex items-baseline justify-between gap-4">
                            <Link
                              href={`/menu-items/${item.id}`}
                              className={`font-medium underline ${!item.is_active ? "text-ink-soft" : "text-ink"}`}
                            >
                              {item.name}
                            </Link>
                            {item.price != null && (
                              <span className="text-sm text-ink-soft">
                                ${item.price.toFixed(2)} {item.currency}
                              </span>
                            )}
                          </div>
                          {!item.is_active && <p className="text-xs text-ink-soft">No longer on the menu</p>}
                          {item.description && <p className="text-sm text-ink-soft">{item.description}</p>}
                          <div className="mt-2 flex flex-col gap-1">
                            <RatingBadge
                              rating={item.locationRating}
                              label={isChain ? "This location" : undefined}
                            />
                            <RatingBreakdown rating={item.locationRating} />
                            {isChain && (
                              <>
                                <RatingBadge
                                  rating={item.brandRating}
                                  label={`All ${restaurant.brand!.name} locations`}
                                />
                                <RatingBreakdown rating={item.brandRating} />
                              </>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                ),
              }))}
            />
          )}
        </div>

        <aside>
          <PhotoGallery photos={photos} isSignedIn={!!user} currentPath={currentPath} />
        </aside>
      </div>
    </main>
  );
}
