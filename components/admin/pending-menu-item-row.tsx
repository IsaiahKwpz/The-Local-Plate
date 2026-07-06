"use client";

import { useActionState } from "react";
import { approvePendingMenuItem, rejectPendingMenuItem, type AdminActionState } from "@/lib/admin/actions";

const initialState: AdminActionState = {};

export function PendingMenuItemRow({
  item,
}: {
  item: {
    id: string;
    name: string;
    price: number | null;
    category: string | null;
    description: string | null;
    createdAtLabel: string;
    restaurant: { name: string } | null;
    submitter: { display_name: string | null } | null;
  };
}) {
  const [approveState, approveAction, approvePending] = useActionState(approvePendingMenuItem, initialState);
  const [rejectState, rejectAction, rejectPending] = useActionState(rejectPendingMenuItem, initialState);

  const handled = approveState.success || rejectState.success;
  const error = approveState.error || rejectState.error;

  return (
    <li className="rounded border p-4">
      <p className="font-medium">
        {item.name} — {item.restaurant?.name ?? "Unknown restaurant"}
      </p>
      <p className="text-sm text-gray-500">
        {item.category ? `${item.category} · ` : ""}
        {item.price != null ? `$${item.price.toFixed(2)}` : "No price given"}
      </p>
      {item.description && <p className="text-sm text-gray-600">{item.description}</p>}
      <p className="text-sm text-gray-500">
        Submitted by {item.submitter?.display_name ?? "unknown"} · {item.createdAtLabel}
      </p>
      {handled ? (
        <p className="mt-2 text-sm text-green-600">Handled.</p>
      ) : (
        <div className="mt-2 flex gap-3">
          <form action={approveAction}>
            <input type="hidden" name="pendingId" value={item.id} />
            <button
              type="submit"
              disabled={approvePending || rejectPending}
              className="text-sm underline disabled:opacity-50"
            >
              {approvePending ? "Approving…" : "Approve"}
            </button>
          </form>
          <form action={rejectAction}>
            <input type="hidden" name="pendingId" value={item.id} />
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
