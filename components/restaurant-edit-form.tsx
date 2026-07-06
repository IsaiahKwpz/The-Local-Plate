"use client";

import { useActionState } from "react";
import { submitRestaurantEdit, type ContributionActionState } from "@/lib/contributions/actions";

const initialState: ContributionActionState = {};

export function RestaurantEditForm({
  restaurantId,
  restaurant,
}: {
  restaurantId: string;
  restaurant: { name: string; address: string };
}) {
  const [state, formAction, pending] = useActionState(submitRestaurantEdit, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded border border-rule bg-surface p-4">
      <input type="hidden" name="restaurantId" value={restaurantId} />
      <label className="flex flex-col gap-1 text-sm">
        Name
        <input
          name="name"
          defaultValue={restaurant.name}
          required
          className="rounded border border-rule bg-surface px-3 py-2 text-ink"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Address
        <input
          name="address"
          defaultValue={restaurant.address}
          required
          className="rounded border border-rule bg-surface px-3 py-2 text-ink"
        />
      </label>
      {state.error && (
        <p role="alert" className="text-sm text-rust">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="text-sm text-olive">
          {state.queued ? "Thanks — this needs a quick review before it goes live." : "Saved."}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-olive px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
