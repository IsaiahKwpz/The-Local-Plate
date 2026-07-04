"use client";

import { useActionState } from "react";
import { approvePendingEdit, rejectPendingEdit, type AdminActionState } from "@/lib/admin/actions";

const initialState: AdminActionState = {};

export function PendingEditRow({
  edit,
}: {
  edit: {
    id: string;
    field: string;
    old_value: string | null;
    new_value: string;
    createdAtLabel: string;
    menu_item: { name: string } | null;
    user: { display_name: string | null } | null;
  };
}) {
  const [approveState, approveAction, approvePending] = useActionState(approvePendingEdit, initialState);
  const [rejectState, rejectAction, rejectPending] = useActionState(rejectPendingEdit, initialState);

  const handled = approveState.success || rejectState.success;
  const error = approveState.error || rejectState.error;

  return (
    <li className="rounded border p-4">
      <p className="font-medium">
        {edit.menu_item?.name ?? "Unknown item"} — {edit.field}
      </p>
      <p className="text-sm text-gray-500">
        &ldquo;{edit.old_value ?? "(empty)"}&rdquo; → &ldquo;{edit.new_value}&rdquo;
      </p>
      <p className="text-sm text-gray-500">
        Suggested by {edit.user?.display_name ?? "unknown"} · {edit.createdAtLabel}
      </p>
      {handled ? (
        <p className="mt-2 text-sm text-green-600">Handled.</p>
      ) : (
        <div className="mt-2 flex gap-3">
          <form action={approveAction}>
            <input type="hidden" name="editId" value={edit.id} />
            <button
              type="submit"
              disabled={approvePending || rejectPending}
              className="text-sm underline disabled:opacity-50"
            >
              {approvePending ? "Approving…" : "Approve"}
            </button>
          </form>
          <form action={rejectAction}>
            <input type="hidden" name="editId" value={edit.id} />
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
