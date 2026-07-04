"use client";

import { useActionState } from "react";
import { submitRating, type RatingActionState } from "@/lib/ratings/actions";

const initialState: RatingActionState = {};

export function RatingForm({
  menuItemId,
  restaurantId,
  existingRating,
}: {
  menuItemId: string;
  restaurantId: string;
  existingRating: { score: number; comment: string | null } | null;
}) {
  const [state, formAction, pending] = useActionState(submitRating, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded border p-4">
      <input type="hidden" name="menuItemId" value={menuItemId} />
      <input type="hidden" name="restaurantId" value={restaurantId} />
      <label className="flex flex-col gap-1 text-sm">
        Your rating
        <select
          name="score"
          defaultValue={existingRating?.score ?? ""}
          required
          className="rounded border px-3 py-2"
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
          className="rounded border px-3 py-2"
        />
      </label>
      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      {state.success && <p className="text-sm text-green-600">Thanks for rating!</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Saving…" : existingRating ? "Update rating" : "Submit rating"}
      </button>
    </form>
  );
}
