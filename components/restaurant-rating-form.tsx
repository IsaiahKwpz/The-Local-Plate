"use client";

import { useActionState, useState } from "react";
import { submitRestaurantRating, type RestaurantRatingActionState } from "@/lib/restaurant-ratings/actions";

const initialState: RestaurantRatingActionState = {};

export function RestaurantRatingForm({
  restaurantId,
  existingRating,
}: {
  restaurantId: string;
  existingRating: { score: number; comment: string | null } | null;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(submitRestaurantRating, initialState);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded bg-olive px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
      >
        {existingRating ? "Update your rating" : "Rate this restaurant"}
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded border border-rule bg-surface p-4">
      <input type="hidden" name="restaurantId" value={restaurantId} />
      <label className="flex flex-col gap-1 text-sm">
        Overall rating
        <select
          name="score"
          defaultValue={existingRating?.score ?? ""}
          required
          className="rounded border border-rule bg-surface px-3 py-2 text-ink"
        >
          <option value="" disabled>
            Choose 1–5
          </option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Comment (optional)
        <textarea
          name="comment"
          defaultValue={existingRating?.comment ?? ""}
          rows={3}
          className="rounded border border-rule bg-surface px-3 py-2 text-ink"
        />
      </label>
      {state.error && (
        <p role="alert" className="text-sm text-rust">
          {state.error}
        </p>
      )}
      {state.success && <p className="text-sm text-olive">Thanks for rating!</p>}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-olive px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving…" : existingRating ? "Update rating" : "Submit rating"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-ink-soft underline">
          Cancel
        </button>
      </div>
    </form>
  );
}
