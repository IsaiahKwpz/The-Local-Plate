"use client";

import { useActionState } from "react";
import { submitMenuItemEdit, type ContributionActionState } from "@/lib/contributions/actions";

const initialState: ContributionActionState = {};

export function EditItemForm({
  menuItemId,
  item,
}: {
  menuItemId: string;
  item: { name: string; price: number | null; category: string | null; description: string | null };
}) {
  const [state, formAction, pending] = useActionState(submitMenuItemEdit, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded border p-4">
      <input type="hidden" name="menuItemId" value={menuItemId} />
      <label className="flex flex-col gap-1 text-sm">
        Name
        <input name="name" defaultValue={item.name} required className="rounded border px-3 py-2" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Price
        <input
          name="price"
          type="number"
          step="0.01"
          min="0"
          defaultValue={item.price ?? ""}
          className="rounded border px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Category
        <input
          name="category"
          defaultValue={item.category ?? ""}
          className="rounded border px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Description
        <textarea
          name="description"
          defaultValue={item.description ?? ""}
          rows={3}
          className="rounded border px-3 py-2"
        />
      </label>
      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="text-sm text-green-600">
          {state.queued ? "Thanks — this needs a quick review before it goes live." : "Saved."}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
