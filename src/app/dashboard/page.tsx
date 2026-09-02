import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col px-4 sm:px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Welcome back, <span className="font-semibold text-zinc-900 dark:text-zinc-100">{session.user.name || session.user.email}</span>
          </p>
        </div>
        <SignOutButton className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-xs font-bold text-white dark:text-zinc-900 hover:opacity-90 transition" />
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {/* Quarter Monkey Card */}
        <div className="flex flex-col justify-between rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 p-5 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🐒</span>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">ربع قرد (Quarter Monkey)</h2>
            </div>
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
              Country name word chain challenge. Bluff, suspect, and avoid getting penalty quarters!
            </p>
          </div>
          <Link
            href="/games/quarter-monkey?lang=ar"
            className="mt-5 rounded-xl bg-indigo-600 px-3 py-2 text-center text-xs font-bold text-white hover:bg-indigo-500 transition shadow-md shadow-indigo-600/20"
          >
            Play Quarter Monkey →
          </Link>
        </div>

        {/* Blink Card */}
        <div className="flex flex-col justify-between rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 p-5 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">😉</span>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">غمازة (Blink)</h2>
            </div>
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
              Physical cafe blinking game. The Blinker signs in real life while innocents hit &apos;I got winked&apos;!
            </p>
          </div>
          <Link
            href="/games/blink?lang=ar"
            className="mt-5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 px-3 py-2 text-center text-xs font-bold text-white hover:from-rose-500 hover:to-pink-500 transition shadow-md shadow-rose-600/20"
          >
            Play غمازة (Blink) →
          </Link>
        </div>

        {/* Bekasa Card */}
        <div className="flex flex-col justify-between rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 p-5 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎭</span>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">بكاسة (Bekasa)</h2>
            </div>
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
              Social undercover bluffing game with question rounds and candidate word guessing!
            </p>
          </div>
          <Link
            href="/games/bekasa?lang=ar"
            className="mt-5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-2 text-center text-xs font-bold text-white hover:from-amber-400 hover:to-orange-400 transition shadow-md shadow-amber-500/20"
          >
            Play بكاسة (Bekasa) →
          </Link>
        </div>

        {/* Domino Card */}
        <div className="flex flex-col justify-between rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 p-5 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🀄</span>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">دومينو (Domino)</h2>
            </div>
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
              Classic cafe domino. Solo & 2v2 teams, 3-player 9 tiles rule, draw boneyard, and cafe score rounding!
            </p>
          </div>
          <Link
            href="/games/domino?lang=ar"
            className="mt-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-2 text-center text-xs font-bold text-white hover:from-emerald-500 hover:to-teal-500 transition shadow-md shadow-emerald-600/20"
          >
            Play دومينو (Domino) →
          </Link>
        </div>

        {/* UNO Card */}
        <div className="flex flex-col justify-between rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 p-5 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎴</span>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">أونو (UNO)</h2>
            </div>
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
              Full 108 cards! Skips, reverses, +2s, Wild +4s, turn directions, UNO shout and catch penalties.
            </p>
          </div>
          <Link
            href="/games/uno?lang=ar"
            className="mt-5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 px-3 py-2 text-center text-xs font-bold text-white hover:opacity-95 transition shadow-md shadow-red-600/20"
          >
            Play أونو (UNO) →
          </Link>
        </div>
      </div>
    </main>
  );
}
