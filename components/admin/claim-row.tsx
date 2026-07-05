"use client";

import { useActionState } from "react";
import { approveRestaurantClaim, rejectRestaurantClaim, type AdminActionState } from "@/lib/admin/actions";

const initialState: AdminActionState = {};

export function ClaimRow({
  claim,
}: {
  claim: {
    id: string;
    message: string | null;
    createdAtLabel: string;
    restaurant: { name: string; address: string } | null;
    claimant: { display_name: string | null } | null;
  };
}) {
  const [approveState, approveAction, approvePending] = useActionState(approveRestaurantClaim, initialState);
  const [rejectState, rejectAction, rejectPending] = useActionState(rejectRestaurantClaim, initialState);

  const handled = approveState.success || rejectState.success;
  const error = approveState.error || rejectState.error;

  return (
    <li className="rounded border p-4">
      <p className="font-medium">{claim.restaurant?.name ?? "Unknown restaurant"}</p>
      <p className="text-sm text-gray-500">{claim.restaurant?.address}</p>
      <p className="text-sm text-gray-500">
        Claimed by {claim.claimant?.display_name ?? "unknown"} · {claim.createdAtLabel}
      </p>
      {claim.message && (
        <p className="mt-1 text-sm text-gray-600">&ldquo;{claim.message}&rdquo;</p>
      )}
      {handled ? (
        <p className="mt-2 text-sm text-green-600">Handled.</p>
      ) : (
        <div className="mt-2 flex gap-3">
          <form action={approveAction}>
            <input type="hidden" name="claimId" value={claim.id} />
            <button
              type="submit"
              disabled={approvePending || rejectPending}
              className="text-sm underline disabled:opacity-50"
            >
              {approvePending ? "Approving…" : "Approve"}
            </button>
          </form>
          <form action={rejectAction}>
            <input type="hidden" name="claimId" value={claim.id} />
            <button
              type="submit"
              disabled={approvePending || rejectPending}
              className="text-sm text-red-600 underline disabled:opacity-50"
            >
              {rejectPending ? "Rejecting…" : "Reject"}
            </button>
          </form>
        </div>
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </li>
  );
}
