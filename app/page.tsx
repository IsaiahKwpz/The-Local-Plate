import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <h1 className="text-3xl font-semibold">Rate the dish, not just the restaurant.</h1>
      <p className="max-w-md text-gray-600">
        MenuRate lets you rate specific menu items, not just the restaurant as a whole. Search for
        a dish is coming soon — for now, browse restaurants directly.
      </p>
      <Link
        href="/restaurants"
        className="rounded bg-black px-5 py-2.5 text-white hover:bg-zinc-800"
      >
        Browse restaurants
      </Link>
    </main>
  );
}
