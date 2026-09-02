import Link from "next/link";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col justify-center px-4 sm:px-6 py-12">
      {/* Hero Header */}
      <div className="max-w-2xl space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3.5 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-300">
          <span>☕ Mobile Party Games for Cafes & Hangouts</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
          Gather around the table. <br />
          <span className="bg-gradient-to-r from-indigo-600 via-rose-500 to-amber-500 bg-clip-text text-transparent">
            Play with your phones.
          </span>
        </h1>
        <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
          No physical cards or board pieces required. Create a room, share the 6-digit code with friends, and enjoy real-life party games straight from your browser.
        </p>
      </div>

      {/* Game Cards Grid */}
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {/* Game 1: Quarter Monkey */}
        <div className="group relative flex flex-col justify-between rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 p-6 shadow-sm backdrop-blur-md transition hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/10">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-4xl">🐒</span>
              <span className="rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 text-xs font-bold border border-indigo-500/20">
                Word Chain
              </span>
            </div>
            <h2 className="mt-4 text-xl font-extrabold text-zinc-900 dark:text-zinc-50">
              ربع قرد (Quarter Monkey)
            </h2>
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Take turns adding letters to build country names without completing a word or getting caught bluffing.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/games/quarter-monkey?lang=ar"
              className="w-full text-center rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition shadow-md shadow-indigo-600/20"
            >
              العب ربع قرد 🐒
            </Link>
          </div>
        </div>

        {/* Game 2: Blink (غمازة) */}
        <div className="group relative flex flex-col justify-between rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 p-6 shadow-sm backdrop-blur-md transition hover:border-rose-500 hover:shadow-xl hover:shadow-rose-500/10">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-4xl">😉</span>
              <span className="rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 px-2.5 py-0.5 text-xs font-bold border border-rose-500/20">
                Wink Murder
              </span>
            </div>
            <h2 className="mt-4 text-xl font-extrabold text-zinc-900 dark:text-zinc-50">
              غمازة (Blink)
            </h2>
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              The secret Blinker winks in real life. If you get winked, click the button! The last survivor guesses the culprit.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/games/blink?lang=ar"
              className="w-full text-center rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 px-3 py-2 text-xs font-bold text-white hover:from-rose-500 hover:to-pink-500 transition shadow-md shadow-rose-600/20"
            >
              العب غمازة 😉
            </Link>
          </div>
        </div>

        {/* Game 3: Bekasa (بكاسة) */}
        <div className="group relative flex flex-col justify-between rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 p-6 shadow-sm backdrop-blur-md transition hover:border-amber-500 hover:shadow-xl hover:shadow-amber-500/10">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-4xl">🎭</span>
              <span className="rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2.5 py-0.5 text-xs font-bold border border-amber-500/20">
                Undercover
              </span>
            </div>
            <h2 className="mt-4 text-xl font-extrabold text-zinc-900 dark:text-zinc-50">
              بكاسة (Bekasa)
            </h2>
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Everyone knows the secret word except the Impostor! Ask questions, vote to expose them, and guess the word for bonus points.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/games/bekasa?lang=ar"
              className="w-full text-center rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-2 text-xs font-bold text-white hover:from-amber-400 hover:to-orange-400 transition shadow-md shadow-amber-500/20"
            >
              العب بكاسة 🎭
            </Link>
          </div>
        </div>
      </div>

      {/* Auth Status & Quick Actions */}
      {!session?.user && (
        <div className="mt-10 flex items-center justify-between rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-4">
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            Create an account or sign in to save game scores and host rooms.
          </p>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-xl bg-zinc-900 dark:bg-zinc-100 px-3.5 py-1.5 text-xs font-semibold text-white dark:text-zinc-900 hover:opacity-90 transition"
            >
              Sign up
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
