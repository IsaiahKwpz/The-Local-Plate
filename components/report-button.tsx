"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { fileReport, type ReportActionState } from "@/lib/reports/actions";
import type { Database } from "@/lib/supabase/types";

const initialState: ReportActionState = {};

const REASONS = [
  "Inaccurate information",
  "Inappropriate content",
  "Spam",
  "Duplicate listing",
  "Other",
];

export function ReportButton({
  targetType,
  targetId,
  isSignedIn,
  currentPath,
}: {
  targetType: Database["public"]["Enums"]["report_target_type"];
  targetId: string;
  isSignedIn: boolean;
  currentPath: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(fileReport, initialState);

  if (state.success) {
    return <p className="text-xs text-gray-500">Thanks — we&apos;ll review this.</p>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-gray-500 underline"
      >
        Report
      </button>
    );
  }

  if (!isSignedIn) {
    return (
      <p className="text-xs text-gray-500">
        <Link href={`/login?next=${encodeURIComponent(currentPath)}`} className="underline">
          Sign in
        </Link>{" "}
        to report this.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2 text-xs">
      <input type="hidden" name="targetType" value={targetType} />
      <input type="hidden" name="targetId" value={targetId} />
      <select name="reason" required defaultValue="" className="rounded border px-1 py-0.5">
        <option value="" disabled>
          Reason…
        </option>
        {REASONS.map((reason) => (
          <option key={reason} value={reason}>
            {reason}
          </option>
        ))}
      </select>
      <button type="submit" disabled={pending} className="underline">
        {pending ? "Sending…" : "Submit"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-gray-400">
        Cancel
      </button>
      {state.error && <span className="text-red-600">{state.error}</span>}
    </form>
  );
}
