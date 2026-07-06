"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { submitPhoto, type PhotoActionState } from "@/lib/photos/actions";

const initialState: PhotoActionState = {};

export function PhotoUploadForm({
  targetType,
  targetId,
  isSignedIn,
  currentPath,
}: {
  targetType: "menu_item" | "restaurant";
  targetId: string;
  isSignedIn: boolean;
  currentPath: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(submitPhoto, initialState);

  if (state.success) {
    return <p className="text-sm text-ink-soft">Thanks — your photo is pending review.</p>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded border border-rule px-3 py-1.5 text-sm text-ink transition hover:border-olive"
      >
        Add a photo
      </button>
    );
  }

  if (!isSignedIn) {
    return (
      <p className="text-sm text-ink-soft">
        <Link href={`/login?next=${encodeURIComponent(currentPath)}`} className="underline">
          Sign in
        </Link>{" "}
        to add a photo.
      </p>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded border border-rule bg-surface p-4 text-sm"
    >
      <input type="hidden" name="targetType" value={targetType} />
      <input type="hidden" name="targetId" value={targetId} />
      <input
        type="file"
        name="photo"
        accept="image/jpeg,image/png,image/webp"
        required
        className="text-ink"
      />
      <label className="flex items-center gap-2 text-ink-soft">
        <input type="checkbox" name="agreedToRights" required />
        I own this photo or have permission to share it.
      </label>
      {state.error && (
        <p role="alert" className="text-rust">
          {state.error}
        </p>
      )}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-olive px-4 py-2 font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Uploading…" : "Upload"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-ink-soft underline">
          Cancel
        </button>
      </div>
    </form>
  );
}
