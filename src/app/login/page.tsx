"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onCredentialsSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const phoneOrEmail = String(formData.get("phoneOrEmail") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    const result = await signIn("credentials", {
      phoneOrEmail,
      password,
      redirect: false,
    });

    setIsSubmitting(false);
    if (result?.error) {
      setError("Invalid WhatsApp phone number or password.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center px-4 sm:px-6 py-12">
      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 p-7 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xl border border-indigo-200/50 dark:border-indigo-800/50">
            ☕
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">Sign in</h1>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">تسجيل الدخول - ألعاب القهوة</p>
          </div>
        </div>

        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">Welcome back to Cafe Games.</p>

        <form onSubmit={onCredentialsSignIn} className="mt-6 space-y-4">
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
            <span className="mb-1.5 block">Phone Number / رقم الهاتف</span>
            <input
              type="text"
              name="phoneOrEmail"
              required
              autoComplete="username"
              placeholder="e.g. 01012345678 or +201..."
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-500 transition"
            />
          </label>

          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
            <div className="mb-1.5 flex items-center justify-between">
              <span>Password (كلمة المرور)</span>
              <Link
                href="/forgot-password"
                className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline capitalize text-[11px]"
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              name="password"
              required
              minLength={8}
              autoComplete="current-password"
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-500 transition"
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
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-zinc-600 dark:text-zinc-400">
          No account yet?{" "}
          <Link href="/signup" className="font-bold text-indigo-600 dark:text-indigo-400 underline">
            Create one with WhatsApp
          </Link>
        </p>
      </div>
    </main>
  );
}
