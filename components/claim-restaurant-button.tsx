"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { submitRestaurantClaim, type ClaimActionState } from "@/lib/claims/actions";
import type { Database } from "@/lib/supabase/types";

const initialState: ClaimActionState = {};

export function ClaimRestaurantButton({
  restaurantId,
  isSignedIn,
  currentPath,
  initialStatus,
}: {
  restaurantId: string;
  isSignedIn: boolean;
  currentPath: string;
  initialStatus: Database["public"]["Enums"]["edit_status"] | null;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(submitRestaurantClaim, initialState);

  if (state.success || initialStatus === "pending") {
    return <p className="text-xs text-gray-500">Claim submitted — pending review.</p>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-gray-500 underline"
      >
        Claim this restaurant
      </button>
    );
  }

  if (!isSignedIn) {
    return (
      <p className="text-xs text-gray-500">
        <Link href={`/login?next=${encodeURIComponent(currentPath)}`} className="underline">
          Sign in
        </Link>{" "}
        to claim this restaurant.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2 text-xs">
      <input type="hidden" name="restaurantId" value={restaurantId} />
      <textarea
        name="message"
        placeholder="How can we verify you're the owner? (e.g. business email, phone number)"
        rows={2}
        className="w-full rounded border border-rule bg-surface px-2 py-1 text-ink"
      />
      <div className="flex items-center gap-2">
        <button type="submit" disabled={pending} className="underline">
          {pending ? "Submitting…" : "Submit claim"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-gray-400">
          Cancel
        </button>
      </div>
      {state.error && <span className="text-red-600">{state.error}</span>}
    </form>
  );
}
