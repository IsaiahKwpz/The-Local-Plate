"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col items-center px-6 py-24 text-center">
      <p className="font-display text-6xl font-bold text-rust">Oops</p>
      <h1 className="mt-4 font-display text-2xl font-bold">Something went wrong.</h1>
      <p className="mt-2 text-ink-soft">That&rsquo;s on us, not you. Try again, or head back home.</p>
      <div className="mt-6 flex gap-3">
        <button
          onClick={reset}
          className="rounded bg-olive px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded border border-rule px-4 py-2 text-sm font-medium text-ink transition hover:border-olive"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
