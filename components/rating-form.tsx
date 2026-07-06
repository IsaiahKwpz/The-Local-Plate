"use client";

import { useActionState, useState } from "react";
import { submitRating, type RatingActionState } from "@/lib/ratings/actions";

const initialState: RatingActionState = {};

const SUB_CATEGORIES = [
  { field: "taste_score", label: "Plate Taste" },
  { field: "value_score", label: "Plate Value" },
  { field: "presentation_score", label: "Plate Presentation" },
  { field: "nutrition_score", label: "Plate Nutrition" },
] as const;

type ExistingRating = {
  score: number;
  comment: string | null;
  taste_score: number | null;
  value_score: number | null;
  presentation_score: number | null;
  nutrition_score: number | null;
} | null;

function ScoreSelect({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: number | null | undefined;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      <select
        name={name}
        defaultValue={defaultValue ?? ""}
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
  );
}

export function RatingForm({
  menuItemId,
  restaurantId,
  existingRating,
}: {
  menuItemId: string;
  restaurantId: string;
  existingRating: ExistingRating;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(submitRating, initialState);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded bg-olive px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
      >
        {existingRating ? "Update your rating" : "Rate this dish"}
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded border border-rule bg-surface p-4">
      <input type="hidden" name="menuItemId" value={menuItemId} />
      <input type="hidden" name="restaurantId" value={restaurantId} />

      <ScoreSelect name="score" label="Overall rating" defaultValue={existingRating?.score} />

      <div className="grid grid-cols-1 gap-3 border-t border-dashed border-rule pt-3 sm:grid-cols-2">
        {SUB_CATEGORIES.map(({ field, label }) => (
          <ScoreSelect
            key={field}
            name={field}
            label={label}
            defaultValue={existingRating?.[field]}
          />
        ))}
      </div>

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
