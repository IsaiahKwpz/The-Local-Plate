"use client";

import { useActionState } from "react";
import { approvePendingRestaurant, rejectPendingRestaurant, type AdminActionState } from "@/lib/admin/actions";

const initialState: AdminActionState = {};

export function PendingRestaurantRow({
  restaurant,
}: {
  restaurant: {
    id: string;
    name: string;
    address: string;
    createdAtLabel: string;
    submitter: { display_name: string | null } | null;
  };
}) {
  const [approveState, approveAction, approvePending] = useActionState(approvePendingRestaurant, initialState);
  const [rejectState, rejectAction, rejectPending] = useActionState(rejectPendingRestaurant, initialState);

  const handled = approveState.success || rejectState.success;
  const error = approveState.error || rejectState.error;

  return (
    <li className="rounded border p-4">
      <p className="font-medium">{restaurant.name}</p>
      <p className="text-sm text-gray-500">{restaurant.address}</p>
      <p className="text-sm text-gray-500">
        Submitted by {restaurant.submitter?.display_name ?? "unknown"} · {restaurant.createdAtLabel}
      </p>
      {handled ? (
        <p className="mt-2 text-sm text-green-600">Handled.</p>
      ) : (
        <div className="mt-2 flex gap-3">
          <form action={approveAction}>
            <input type="hidden" name="pendingId" value={restaurant.id} />
            <button
              type="submit"
              disabled={approvePending || rejectPending}
              className="text-sm underline disabled:opacity-50"
            >
              {approvePending ? "Approving…" : "Approve"}
            </button>
          </form>
          <form action={rejectAction}>
            <input type="hidden" name="pendingId" value={restaurant.id} />
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
