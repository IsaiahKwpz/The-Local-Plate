import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMenuItemDetail, getRatingsForItem, getUserRating } from "@/lib/ratings/queries";
import { getAppliedTagsForItem, getAvailableTagsForItem } from "@/lib/contributions/queries";
import { getApprovedPhotosForTarget, getOwnPendingPhotosForTarget } from "@/lib/photos/queries";
import { RatingBadge } from "@/components/rating-badge";
import { RatingBreakdown } from "@/components/rating-breakdown";
import { RatingForm } from "@/components/rating-form";
import { ReportButton } from "@/components/report-button";
import { TagSection } from "@/components/tag-section";
import { EditItemForm } from "@/components/edit-item-form";
import { PhotoUploadForm } from "@/components/photo-upload-form";
import { PhotoGallery } from "@/components/photo-gallery";

const SUB_SCORE_LABELS = [
  { field: "taste_score", label: "Taste" },
  { field: "value_score", label: "Value" },
  { field: "uniqueness_score", label: "Uniqueness" },
  { field: "healthiness_score", label: "Healthiness" },
] as const;

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
    appliedTags,
    availableTags,
  ] = await Promise.all([
    supabase.auth.getUser(),
    getRatingsForItem(supabase, itemId),
    getAppliedTagsForItem(supabase, itemId),
    getAvailableTagsForItem(supabase, itemId),
  ]);

  const userRating = user ? await getUserRating(supabase, itemId, user.id) : null;
  const isChain = restaurant.type === "chain" && restaurant.brand !== null;

  const [approvedPhotos, ownPendingPhotos] = await Promise.all([
    getApprovedPhotosForTarget(supabase, "menu_item", itemId),
    user ? getOwnPendingPhotosForTarget(supabase, "menu_item", itemId, user.id) : Promise.resolve([]),
  ]);
  const photos = [...approvedPhotos, ...ownPendingPhotos];

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <Link href={`/restaurants/${restaurant.id}`} className="text-sm text-ink-soft underline">
        ← {restaurant.name}
      </Link>

      <h1 className="mt-2 font-display text-2xl font-bold text-ink">{item.name}</h1>
      {!item.is_active && <p className="text-xs text-ink-soft">No longer on the menu</p>}

      <div className="mt-4 grid grid-cols-1 gap-6 rounded border border-rule bg-surface p-6 lg:grid-cols-[auto_1fr]">
        <div>
          <PhotoGallery photos={photos} isSignedIn={!!user} currentPath={`/menu-items/${item.id}`} size="lg" />
          {photos.length === 0 && <p className="text-sm text-ink-soft">No photos yet.</p>}
        </div>

        {item.description ? (
          <p className="text-ink-soft">{item.description}</p>
        ) : (
          <p className="text-sm text-ink-soft italic">No description yet.</p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 rounded border border-rule bg-surface p-4">
        {item.price != null && (
          <span className="text-lg font-semibold text-ink">
            ${item.price.toFixed(2)} {item.currency}
          </span>
        )}
        {item.category && (
          <span className="rounded-full border border-rule px-3 py-1 text-xs text-ink-soft">
            {item.category}
          </span>
        )}
        <div className="flex flex-col gap-2">
          <div>
            <RatingBadge rating={locationRating} label={isChain ? "This location" : undefined} />
            <RatingBreakdown rating={locationRating} />
          </div>
          {isChain && (
            <div>
              <RatingBadge rating={brandRating} label={`All ${restaurant.brand!.name} locations`} />
              <RatingBreakdown rating={brandRating} />
            </div>
          )}
        </div>
        {ratings.length > 0 && (
          <a href="#ratings" className="text-sm text-ink-soft underline">
            See reviews
          </a>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <ReportButton
          targetType="menu_item"
          targetId={item.id}
          isSignedIn={!!user}
          currentPath={`/menu-items/${item.id}`}
        />
        <PhotoUploadForm
          targetType="menu_item"
          targetId={item.id}
          isSignedIn={!!user}
          currentPath={`/menu-items/${item.id}`}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-2 xl:grid-cols-3">
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-ink">Tags</h2>
          {user ? (
            <TagSection menuItemId={item.id} appliedTags={appliedTags} availableTags={availableTags} />
          ) : (
            <div className="flex flex-wrap gap-2">
              {appliedTags.length === 0 ? (
                <span className="text-sm text-ink-soft">No tags yet.</span>
              ) : (
                appliedTags.map((tag) => (
                  <span key={tag.id} className="rounded bg-ground px-2 py-0.5 text-xs text-ink">
                    {tag.name}
                  </span>
                ))
              )}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-ink">Rate this dish</h2>
          {user ? (
            <RatingForm menuItemId={item.id} restaurantId={restaurant.id} existingRating={userRating} />
          ) : (
            <p className="text-sm text-ink-soft">
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

        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-ink">Suggest an edit</h2>
          {user ? (
            <EditItemForm menuItemId={item.id} item={item} />
          ) : (
            <p className="text-sm text-ink-soft">
              <Link href={`/login?next=/menu-items/${item.id}`} className="underline">
                Sign in
              </Link>{" "}
              to suggest an edit.
            </p>
          )}
        </section>
      </div>

      <section id="ratings" className="mt-10 scroll-mt-6">
        <h2 className="mb-3 font-display text-lg font-bold text-ink">Ratings ({ratings.length})</h2>
        {ratings.length === 0 ? (
          <p className="text-sm text-ink-soft">No ratings yet — be the first.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {ratings.map((r) => {
              const subScores = SUB_SCORE_LABELS.filter(({ field }) => r[field] != null);
              return (
                <li key={r.id} className="rounded border border-rule bg-surface p-4">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="font-medium text-ink">{r.user?.display_name ?? "Anonymous"}</span>
                    <span className="text-sm text-ink-soft" aria-label={`${r.score} out of 5`}>
                      {"★".repeat(r.score)}
                      {"☆".repeat(5 - r.score)}
                    </span>
                  </div>
                  {subScores.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-ink-soft">
                      {subScores.map(({ field, label }) => (
                        <span key={field}>
                          {label} <strong className="text-ink">{r[field]}</strong>
                        </span>
                      ))}
                    </div>
                  )}
                  {r.comment && <p className="mt-1 text-sm text-ink-soft">{r.comment}</p>}
                  <div className="mt-2">
                    <ReportButton
                      targetType="rating"
                      targetId={r.id}
                      isSignedIn={!!user}
                      currentPath={`/menu-items/${item.id}`}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
