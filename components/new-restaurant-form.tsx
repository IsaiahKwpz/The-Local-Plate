"use client";

import { useActionState } from "react";
import { submitNewRestaurant, type SubmissionActionState } from "@/lib/submissions/actions";

const initialState: SubmissionActionState = {};

export function NewRestaurantForm() {
  const [state, formAction, pending] = useActionState(submitNewRestaurant, initialState);

  if (state.success) {
    return (
      <p className="rounded border border-rule bg-surface p-4 text-sm text-ink">
        Thanks! Your restaurant has been submitted and is waiting on admin review before it appears
        on the site.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded border border-rule bg-surface p-4">
      <label className="flex flex-col gap-1 text-sm">
        Restaurant name
        <input
          type="text"
          name="name"
          required
          className="rounded border border-rule bg-surface px-3 py-2 text-ink"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Address
        <input
          type="text"
          name="address"
          placeholder="e.g. 123 Bank St, Ottawa, ON"
          required
          className="rounded border border-rule bg-surface px-3 py-2 text-ink"
        />
      </label>
      {state.error && (
        <p role="alert" className="text-sm text-rust">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-olive px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Submitting…" : "Submit restaurant"}
      </button>
    </form>
  );
}
