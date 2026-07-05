import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col items-center px-6 py-24 text-center">
      <p className="font-display text-6xl font-bold text-rust">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold">This page isn&rsquo;t on the menu.</h1>
      <p className="mt-2 text-ink-soft">
        The restaurant or dish you&rsquo;re looking for might have been removed, renamed, or never existed.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/"
          className="rounded bg-olive px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          Back to home
        </Link>
        <Link
          href="/search"
          className="rounded border border-rule px-4 py-2 text-sm font-medium text-ink transition hover:border-olive"
        >
          Search instead
        </Link>
      </div>
    </main>
  );
}
