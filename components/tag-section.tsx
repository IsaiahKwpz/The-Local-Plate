"use client";

import { useActionState, useState } from "react";
import { applyTag, proposeTag, type ContributionActionState } from "@/lib/contributions/actions";

const initialState: ContributionActionState = {};

type Tag = { id: string; name: string; type: "dish_type" | "cuisine" | "attribute" };

export function TagSection({
  menuItemId,
  appliedTags,
  availableTags,
}: {
  menuItemId: string;
  appliedTags: Tag[];
  availableTags: Tag[];
}) {
  const [applyState, applyAction, applyPending] = useActionState(applyTag, initialState);
  const [proposeState, proposeAction, proposePending] = useActionState(proposeTag, initialState);
  const [proposing, setProposing] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {appliedTags.length === 0 ? (
          <span className="text-sm text-gray-500">No tags yet.</span>
        ) : (
          appliedTags.map((tag) => (
            <span key={tag.id} className="rounded bg-ground px-2 py-0.5 text-xs text-ink">
              {tag.name}
            </span>
          ))
        )}
      </div>

      {availableTags.length > 0 && (
        <form action={applyAction} className="flex items-center gap-2 text-sm">
          <input type="hidden" name="menuItemId" value={menuItemId} />
          <select
            name="tagId"
            required
            defaultValue=""
            className="rounded border border-rule bg-surface px-2 py-1 text-ink"
          >
            <option value="" disabled>
              Add a tag…
            </option>
            {availableTags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
          <button type="submit" disabled={applyPending} className="underline disabled:opacity-50">
            {applyPending ? "Adding…" : "Add"}
          </button>
          {applyState.error && <span className="text-red-600">{applyState.error}</span>}
        </form>
      )}

      {proposeState.success ? (
        <p className="text-xs text-gray-500">Thanks — this needs admin approval before it&apos;s usable.</p>
      ) : proposing ? (
        <form action={proposeAction} className="flex flex-wrap items-center gap-2 text-sm">
          <input
            name="name"
            placeholder="New tag name"
            required
            className="rounded border border-rule bg-surface px-2 py-1 text-ink"
          />
          <select
            name="type"
            required
            defaultValue="dish_type"
            className="rounded border border-rule bg-surface px-2 py-1 text-ink"
          >
            <option value="dish_type">Dish type</option>
            <option value="cuisine">Cuisine</option>
            <option value="attribute">Attribute</option>
          </select>
          <button type="submit" disabled={proposePending} className="underline disabled:opacity-50">
            {proposePending ? "Proposing…" : "Propose"}
          </button>
          <button type="button" onClick={() => setProposing(false)} className="text-gray-400">
            Cancel
          </button>
          {proposeState.error && <span className="text-red-600">{proposeState.error}</span>}
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setProposing(true)}
          className="self-start text-xs text-gray-500 underline"
        >
          Propose a new tag
        </button>
      )}
    </div>
  );
}
