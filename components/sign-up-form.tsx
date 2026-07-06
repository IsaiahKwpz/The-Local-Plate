"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp, type AuthActionState } from "@/lib/auth/actions";

const initialState: AuthActionState = {};

export function SignUpForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(signUp, initialState);
  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login";

  return (
    <>
      <form action={formAction} className="flex flex-col gap-4">
        {next && <input type="hidden" name="next" value={next} />}
        <label className="flex flex-col gap-1 text-sm">
          Display name
          <input
            name="displayName"
            required
            minLength={2}
            maxLength={40}
            className="rounded border border-rule bg-surface px-3 py-2 text-ink"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input name="email" type="email" required className="rounded border border-rule bg-surface px-3 py-2 text-ink" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Password
          <input
            name="password"
            type="password"
            required
            minLength={6}
            className="rounded border border-rule bg-surface px-3 py-2 text-ink"
          />
        </label>
        {state.error && (
          <p role="alert" className="text-sm text-red-600">
            {state.error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {pending ? "Creating account…" : "Sign up"}
        </button>
      </form>
      <p className="mt-6 text-sm">
        Already have an account?{" "}
        <Link href={loginHref} className="underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
