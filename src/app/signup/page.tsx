"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { featureFlags } from "@/lib/feature-flags";

type SignupResponse = {
  error?: string;
  issues?: Record<string, string[]>;
};

export default function SignupPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const oauthEnabled = featureFlags.googleOAuthEnabled;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name || undefined, email, password }),
    });

    if (!response.ok) {
      let data: SignupResponse = {};
      try {
        data = (await response.json()) as SignupResponse;
      } catch {
        data = {
          error: response.statusText || "Could not create your account.",
        };
      }

      setError(data.error ?? "Could not create your account.");
      setIsSubmitting(false);
      return;
    }

    const signInResult = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setIsSubmitting(false);
    if (signInResult?.error) {
      setError("Account created, but automatic sign-in failed. Please log in.");
      router.push("/login");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function onGoogleSignIn() {
    setError(null);
    await signIn("google", { callbackUrl: "/dashboard" });
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center px-4 sm:px-6 py-12">
      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 p-7 shadow-sm backdrop-blur-md">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">Create account</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Start playing on Cafe Games in seconds.
        </p>

        {oauthEnabled ? (
          <>
            <button
              type="button"
              onClick={onGoogleSignIn}
              className="mt-6 w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              Continue with Google
            </button>

            <div className="my-5 flex items-center gap-3 text-xs text-zinc-400">
              <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
              or
              <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
            </div>
          </>
        ) : null}

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
            <span className="mb-1.5 block">Name / Nickname</span>
            <input
              type="text"
              name="name"
              minLength={2}
              maxLength={80}
              autoComplete="name"
              placeholder="e.g. Ahmed"
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-500"
            />
          </label>

          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
            <span className="mb-1.5 block">Email</span>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-500"
            />
          </label>

          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
            <span className="mb-1.5 block">Password</span>
            <input
              type="password"
              name="password"
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-500"
            />
          </label>

          {error ? (
            <p className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-2.5 text-xs text-red-700 dark:text-red-300 font-medium">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-500 transition disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer shadow-md shadow-indigo-600/20"
          >
            {isSubmitting ? "Creating..." : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-zinc-600 dark:text-zinc-400">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-indigo-600 dark:text-indigo-400 underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
