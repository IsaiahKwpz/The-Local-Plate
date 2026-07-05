"use client";

import { useActionState } from "react";
import { setRequireOwnerApproval, type ClaimActionState } from "@/lib/claims/actions";

const initialState: ClaimActionState = {};

export function OwnerApprovalToggle({
  restaurantId,
  requireOwnerApproval,
}: {
  restaurantId: string;
  requireOwnerApproval: boolean;
}) {
  const [state, formAction, pending] = useActionState(setRequireOwnerApproval, initialState);

  return (
    <form action={formAction} className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
      <input type="hidden" name="restaurantId" value={restaurantId} />
      <input type="hidden" name="value" value={(!requireOwnerApproval).toString()} />
      <span>
        {requireOwnerApproval
          ? "Crowd edits to your menu require your approval."
          : "Crowd edits to your menu go live immediately."}
      </span>
      <button type="submit" disabled={pending} className="underline">
        {pending ? "Saving…" : requireOwnerApproval ? "Allow direct edits" : "Require approval"}
      </button>
      {state.error && <span className="text-red-600">{state.error}</span>}
    </form>
  );
}
