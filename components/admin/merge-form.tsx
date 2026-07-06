"use client";

import { useActionState } from "react";
import { mergeRestaurants, type AdminActionState } from "@/lib/admin/actions";

const initialState: AdminActionState = {};

export function MergeForm({
  restaurants,
}: {
  restaurants: { id: string; name: string; address: string }[];
}) {
  const [state, formAction, pending] = useActionState(mergeRestaurants, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded border p-4">
      <label className="flex flex-col gap-1 text-sm">
        Keep this restaurant
        <select name="primaryId" required defaultValue="" className="rounded border border-rule bg-surface px-3 py-2 text-ink">
          <option value="" disabled>
            Choose…
          </option>
          {restaurants.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} — {r.address}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Merge away (deleted after merging)
        <select name="duplicateId" required defaultValue="" className="rounded border border-rule bg-surface px-3 py-2 text-ink">
          <option value="" disabled>
            Choose…
          </option>
          {restaurants.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} — {r.address}
            </option>
          ))}
        </select>
      </label>
      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      {state.success && <p className="text-sm text-green-600">Merged.</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Merging…" : "Merge"}
      </button>
    </form>
  );
}
