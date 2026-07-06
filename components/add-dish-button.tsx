"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { submitNewMenuItem, type SubmissionActionState } from "@/lib/submissions/actions";

const initialState: SubmissionActionState = {};

export function AddDishButton({
  restaurantId,
  isSignedIn,
  currentPath,
}: {
  restaurantId: string;
  isSignedIn: boolean;
  currentPath: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(submitNewMenuItem, initialState);

  if (state.success) {
    return <p className="text-sm text-ink-soft">Thanks! Your dish is waiting on admin review.</p>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded border border-rule px-3 py-1.5 text-sm text-ink transition hover:border-olive"
      >
        Add a dish
      </button>
    );
  }

  if (!isSignedIn) {
    return (
      <p className="text-sm text-ink-soft">
        <Link href={`/login?next=${encodeURIComponent(currentPath)}`} className="underline">
          Sign in
        </Link>{" "}
        to add a dish.
      </p>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded border border-rule bg-surface p-4 text-sm"
    >
      <input type="hidden" name="restaurantId" value={restaurantId} />
      <label className="flex flex-col gap-1">
        Dish name
        <input type="text" name="name" required className="rounded border border-rule bg-surface px-3 py-2 text-ink" />
      </label>
      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1">
          Price (optional)
          <input
            type="number"
            step="0.01"
            name="price"
            className="rounded border border-rule bg-surface px-3 py-2 text-ink"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1">
          Category (optional)
          <input
            type="text"
            name="category"
            placeholder="e.g. Mains"
            className="rounded border border-rule bg-surface px-3 py-2 text-ink"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1">
        Description (optional)
        <textarea name="description" rows={2} className="rounded border border-rule bg-surface px-3 py-2 text-ink" />
      </label>
      {state.error && (
        <p role="alert" className="text-rust">
          {state.error}
        </p>
      )}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-olive px-4 py-2 font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Submitting…" : "Submit dish"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-ink-soft underline">
          Cancel
        </button>
      </div>
    </form>
  );
}
