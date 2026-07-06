import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NewRestaurantForm } from "@/components/new-restaurant-form";

export default async function NewRestaurantPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-2xl font-bold text-ink">Add a restaurant</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Don&apos;t see a place you know on The Local Plate? Add it here. Submissions are reviewed
        by an admin before they go live.
      </p>

      <div className="mt-6">
        {user ? (
          <NewRestaurantForm />
        ) : (
          <p className="text-sm text-ink-soft">
            <Link href="/login?next=/restaurants/new" className="underline">
              Sign in
            </Link>{" "}
            or{" "}
            <Link href="/sign-up?next=/restaurants/new" className="underline">
              sign up
            </Link>{" "}
            to add a restaurant.
          </p>
        )}
      </div>
    </main>
  );
}
