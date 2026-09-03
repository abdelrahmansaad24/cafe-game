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

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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

        {/* Screw Card */}
        <div className="flex flex-col justify-between rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 p-5 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔩</span>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">سكرو (Screw)</h2>
            </div>
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
              Memory & bluffing card game. 4 or 6 cards grid, Peek, Swap, Ping Pong 🏓, and call Screw!
            </p>
          </div>
          <Link
            href="/games/screw?lang=ar"
            className="mt-5 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 px-3 py-2 text-center text-xs font-bold text-white hover:opacity-95 transition shadow-md shadow-amber-600/20"
          >
            Play سكرو (Screw) →
          </Link>
        </div>

        {/* Pingo Card */}
        <div className="flex flex-col justify-between rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 p-5 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎱</span>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">بينجو (Pingo)</h2>
            </div>
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
              5x5 Number scratching game! Call numbers, scratch rows, cols & diags, complete P-I-N-G-O!
            </p>
          </div>
          <Link
            href="/games/pingo?lang=ar"
            className="mt-5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-500 px-3 py-2 text-center text-xs font-bold text-white hover:opacity-95 transition shadow-md shadow-purple-600/20"
          >
            Play بينجو (Pingo) →
          </Link>
        </div>

        {/* Autobus Complete Card */}
        <div className="flex flex-col justify-between rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 p-5 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🚌</span>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">أتوبيس كومبليت (Autobus)</h2>
            </div>
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
              Arabic category word race! Boy, girl, animal, plant, item, country, food. Hit the buzzer and win!
            </p>
          </div>
          <Link
            href="/games/autobus?lang=ar"
            className="mt-5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-500 px-3 py-2 text-center text-xs font-bold text-white hover:opacity-95 transition shadow-md shadow-emerald-600/20"
          >
            Play أتوبيس كومبليت →
          </Link>
        </div>

        {/* Estimation Card */}
        <div className="flex flex-col justify-between rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 p-5 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">♠️</span>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">استميشن (Estimation)</h2>
            </div>
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
              The king of cafe card games! 4 players, 13 tricks, bidding, Trumps, and Egyptian cafe score sheet.
            </p>
          </div>
          <Link
            href="/games/estimation?lang=ar"
            className="mt-5 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 px-3 py-2 text-center text-xs font-bold text-white hover:opacity-95 transition shadow-md shadow-amber-600/20"
          >
            Play استميشن (Estimation) →
          </Link>
        </div>

        {/* Sabaho Tahadi Card */}
        <div className="flex flex-col justify-between rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 p-5 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚽</span>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">صباحو تحدي (Sabaho Tahadi)</h2>
            </div>
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
              The legendary football challenge! Auction bidding (المزاد), Career Path (مسيرة اللاعب), and 2-team cafe showdowns.
            </p>
          </div>
          <Link
            href="/games/sabaho?lang=ar"
            className="mt-5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-500 px-3 py-2 text-center text-xs font-bold text-white hover:opacity-95 transition shadow-md shadow-emerald-600/20"
          >
            Play صباحو تحدي →
          </Link>
        </div>

        {/* Bank El Hazz Card */}
        <div className="flex flex-col justify-between rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 p-5 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎲</span>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">بنك الحظ (Bank El Hazz)</h2>
            </div>
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
              The classic Arab World Monopoly! Arab capitals, Egyptian iconic cities, building houses and hotels, and screen rotation.
            </p>
          </div>
          <Link
            href="/games/bank?lang=ar"
            className="mt-5 rounded-xl bg-gradient-to-r from-amber-600 via-yellow-600 to-emerald-600 px-3 py-2 text-center text-xs font-bold text-white hover:opacity-95 transition shadow-md shadow-amber-600/20"
          >
            Play بنك الحظ (Bank El Hazz) →
          </Link>
        </div>
      </div>
    </main>
  );
}
