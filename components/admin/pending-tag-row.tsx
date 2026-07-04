"use client";

import { useActionState } from "react";
import { approvePendingTag, rejectPendingTag, type AdminActionState } from "@/lib/admin/actions";

const initialState: AdminActionState = {};

export function PendingTagRow({
  tag,
}: {
  tag: {
    id: string;
    name: string;
    type: string;
    createdAtLabel: string;
    proposer: { display_name: string | null } | null;
  };
}) {
  const [approveState, approveAction, approvePending] = useActionState(approvePendingTag, initialState);
  const [rejectState, rejectAction, rejectPending] = useActionState(rejectPendingTag, initialState);

  const handled = approveState.success || rejectState.success;
  const error = approveState.error || rejectState.error;

  return (
    <li className="rounded border p-4">
      <p className="font-medium">
        {tag.name} <span className="font-normal text-gray-500">({tag.type})</span>
      </p>
      <p className="text-sm text-gray-500">
        Proposed by {tag.proposer?.display_name ?? "unknown"} · {tag.createdAtLabel}
      </p>
      {handled ? (
        <p className="mt-2 text-sm text-green-600">Handled.</p>
      ) : (
        <div className="mt-2 flex gap-3">
          <form action={approveAction}>
            <input type="hidden" name="tagId" value={tag.id} />
            <button
              type="submit"
              disabled={approvePending || rejectPending}
              className="text-sm underline disabled:opacity-50"
            >
              {approvePending ? "Approving…" : "Approve"}
            </button>
          </form>
          <form action={rejectAction}>
            <input type="hidden" name="tagId" value={tag.id} />
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
