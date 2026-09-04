"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || "Failed to send reset link. Please try again.");
        setIsSubmitting(false);
        return;
      }

      setSubmittedEmail(email);
    } catch {
      setErrorMessage("A network error occurred. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center px-4 sm:px-6 py-12">
      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 p-7 shadow-sm backdrop-blur-md">
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-2xl">
            🔐
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
            Forgot password?
          </h1>
          <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">
            No worries! Enter your email and we&apos;ll send you a password reset link.
          </p>
        </div>

        {submittedEmail ? (
          <div className="space-y-5">
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/80 dark:bg-emerald-950/40 p-4 text-center">
              <span className="text-3xl block mb-2">✉️</span>
              <h2 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                Check your email inbox
              </h2>
              <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
                We sent a password reset link to{" "}
                <span className="font-semibold">{submittedEmail}</span>. The link is valid for 1 hour.
              </p>
            </div>

            <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
              Didn&apos;t receive it? Check your spam folder or{" "}
              <button
                type="button"
                onClick={() => setSubmittedEmail(null)}
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                try again
              </button>
            </p>

            <Link
              href="/login"
              className="block w-full rounded-xl bg-zinc-900 dark:bg-zinc-100 px-4 py-2.5 text-center text-xs font-bold text-white dark:text-zinc-900 hover:opacity-90 transition shadow-sm"
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              <span className="mb-1.5 block">Email address</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. ahmed@example.com"
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-500"
              />
            </label>

            {errorMessage ? (
              <p className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-2.5 text-xs text-red-700 dark:text-red-300 font-medium">
                {errorMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-500 transition disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer shadow-md shadow-indigo-600/20"
            >
              {isSubmitting ? "Sending reset link..." : "Send Reset Link"}
            </button>

            <p className="pt-2 text-center text-xs text-zinc-600 dark:text-zinc-400">
              Remember your password?{" "}
              <Link href="/login" className="font-bold text-indigo-600 dark:text-indigo-400 underline">
                Sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
