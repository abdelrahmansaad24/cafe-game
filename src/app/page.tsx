import Link from "next/link";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col justify-center px-4 sm:px-6 py-12">
      {/* Hero Header */}
      <div className="max-w-2xl space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
          <span>☕ Mobile Party Games for Cafes & Hangouts</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
          Gather around the table. <br />
          <span className="bg-gradient-to-r from-emerald-600 via-indigo-600 to-amber-500 bg-clip-text text-transparent">
            Play with your phones.
          </span>
        </h1>
        <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
          No physical cards or board pieces required. Create a room, share the 6-digit code with friends, and enjoy real-life party games straight from your browser.
        </p>
      </div>

      {/* Game Cards Grid (6 Games) */}
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Game 1: Quarter Monkey */}
        <div className="group relative flex flex-col justify-between rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 p-5 shadow-sm backdrop-blur-md transition hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/10">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-3xl">🐒</span>
              <span className="rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 text-[11px] font-bold border border-indigo-500/20">
                Word Chain
              </span>
            </div>
            <h2 className="mt-3 text-lg font-extrabold text-zinc-900 dark:text-zinc-50">
              ربع قرد (Quarter Monkey)
            </h2>
            <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Take turns adding letters to build country names without completing a word or getting caught bluffing.
            </p>
          </div>

          <div className="mt-5">
            <Link
              href="/games/quarter-monkey?lang=ar"
              className="block w-full text-center rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition shadow-md shadow-indigo-600/20"
            >
              العب ربع قرد 🐒
            </Link>
          </div>
        </div>

        {/* Game 2: Blink (غمازة) */}
        <div className="group relative flex flex-col justify-between rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 p-5 shadow-sm backdrop-blur-md transition hover:border-rose-500 hover:shadow-xl hover:shadow-rose-500/10">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-3xl">😉</span>
              <span className="rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 px-2 py-0.5 text-[11px] font-bold border border-rose-500/20">
                Wink Murder
              </span>
            </div>
            <h2 className="mt-3 text-lg font-extrabold text-zinc-900 dark:text-zinc-50">
              غمازة (Blink)
            </h2>
            <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              The secret Blinker winks in real life. If you get winked, click the button! The last survivor guesses the culprit.
            </p>
          </div>

          <div className="mt-5">
            <Link
              href="/games/blink?lang=ar"
              className="block w-full text-center rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 px-3 py-2 text-xs font-bold text-white hover:from-rose-500 hover:to-pink-500 transition shadow-md shadow-rose-600/20"
            >
              العب غمازة 😉
            </Link>
          </div>
        </div>

        {/* Game 3: Bekasa (بكاسة) */}
        <div className="group relative flex flex-col justify-between rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 p-5 shadow-sm backdrop-blur-md transition hover:border-amber-500 hover:shadow-xl hover:shadow-amber-500/10">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-3xl">🎭</span>
              <span className="rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2 py-0.5 text-[11px] font-bold border border-amber-500/20">
                Undercover
              </span>
            </div>
            <h2 className="mt-3 text-lg font-extrabold text-zinc-900 dark:text-zinc-50">
              بكاسة (Bekasa)
            </h2>
            <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Everyone knows the secret word except the Impostor! Ask questions, vote to expose them, and guess the word.
            </p>
          </div>

          <div className="mt-5">
            <Link
              href="/games/bekasa?lang=ar"
              className="block w-full text-center rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-2 text-xs font-bold text-white hover:from-amber-400 hover:to-orange-400 transition shadow-md shadow-amber-500/20"
            >
              العب بكاسة 🎭
            </Link>
          </div>
        </div>

        {/* Game 4: Domino (دومينو) */}
        <div className="group relative flex flex-col justify-between rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 p-5 shadow-sm backdrop-blur-md transition hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/10">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-3xl">🀄</span>
              <span className="rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 text-[11px] font-bold border border-emerald-500/20">
                Domino Cafe
              </span>
            </div>
            <h2 className="mt-3 text-lg font-extrabold text-zinc-900 dark:text-zinc-50">
              دومينو (Domino)
            </h2>
            <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Classic Egyptian & Arab Cafe Domino. Solo & 2v2 Teams, custom 3-player 9 tiles, boneyard draw, and cafe score rounding.
            </p>
          </div>

          <div className="mt-5">
            <Link
              href="/games/domino?lang=ar"
              className="block w-full text-center rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-2 text-xs font-bold text-white hover:from-emerald-500 hover:to-teal-500 transition shadow-md shadow-emerald-600/20"
            >
              العب دومينو 🀄
            </Link>
          </div>
        </div>

        {/* Game 5: UNO (أونو) */}
        <div className="group relative flex flex-col justify-between rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 p-5 shadow-sm backdrop-blur-md transition hover:border-red-500 hover:shadow-xl hover:shadow-red-500/10">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-3xl">🎴</span>
              <span className="rounded-full bg-red-500/10 text-red-700 dark:text-red-300 px-2 py-0.5 text-[11px] font-bold border border-red-500/20">
                Card Shedding
              </span>
            </div>
            <h2 className="mt-3 text-lg font-extrabold text-zinc-900 dark:text-zinc-50">
              أونو (UNO)
            </h2>
            <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Full 108 cards! Skips, Reverses, +2s, Wild +4s, turn directions, UNO shout & catch penalties, and match championship.
            </p>
          </div>

          <div className="mt-5">
            <Link
              href="/games/uno?lang=ar"
              className="block w-full text-center rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 px-3 py-2 text-xs font-bold text-white hover:opacity-95 transition shadow-md shadow-red-600/20"
            >
              العب أونو 🎴
            </Link>
          </div>
        </div>

        {/* Game 6: Screw (سكرو) */}
        <div className="group relative flex flex-col justify-between rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 p-5 shadow-sm backdrop-blur-md transition hover:border-amber-500 hover:shadow-xl hover:shadow-amber-500/10">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-3xl">🔩</span>
              <span className="rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2 py-0.5 text-[11px] font-bold border border-amber-500/20">
                Memory & Bluff
              </span>
            </div>
            <h2 className="mt-3 text-lg font-extrabold text-zinc-900 dark:text-zinc-50">
              سكرو (Screw)
            </h2>
            <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Egyptian cafe memory card game! 4 or 6 cards grid, Peek cards, Blind Swap, Ping Pong 🏓, Red/Black Kings, and Screw call!
            </p>
          </div>

          <div className="mt-5">
            <Link
              href="/games/screw?lang=ar"
              className="block w-full text-center rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 px-3 py-2 text-xs font-bold text-white hover:opacity-95 transition shadow-md shadow-amber-600/20"
            >
              العب سكرو 🔩
            </Link>
          </div>
        </div>

        {/* Game 7: Pingo (بينجو) */}
        <div className="group relative flex flex-col justify-between rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 p-5 shadow-sm backdrop-blur-md transition hover:border-purple-500 hover:shadow-xl hover:shadow-purple-500/10">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-3xl animate-bounce">🎱</span>
              <span className="rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 px-2 py-0.5 text-[11px] font-bold border border-purple-500/20">
                5x5 Number Scratch
              </span>
            </div>
            <h2 className="mt-3 text-lg font-extrabold text-zinc-900 dark:text-zinc-50">
              بينجو (Pingo)
            </h2>
            <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              The classic school & cafe 5x5 number game! Call numbers, scratch lines, complete P - I - N - G - O and shout for victory!
            </p>
          </div>

          <div className="mt-5">
            <Link
              href="/games/pingo?lang=ar"
              className="block w-full text-center rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-500 px-3 py-2 text-xs font-bold text-white hover:opacity-95 transition shadow-md shadow-purple-600/20"
            >
              العب بينجو 🎱
            </Link>
          </div>
        </div>

        {/* Game 8: Autobus Complete (أتوبيس كومبليت) */}
        <div className="group relative flex flex-col justify-between rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 p-5 shadow-sm backdrop-blur-md transition hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/10">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-3xl animate-bounce">🚌</span>
              <span className="rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 text-[11px] font-bold border border-emerald-500/20">
                Category Race
              </span>
            </div>
            <h2 className="mt-3 text-lg font-extrabold text-zinc-900 dark:text-zinc-50">
              أتوبيس كومبليت (Autobus Complete)
            </h2>
            <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Arabic category word race! (ولد - بنت - حيوان - نبات - جماد - بلاد - أكلة). Hit the buzzer and score points!
            </p>
          </div>

          <div className="mt-5">
            <Link
              href="/games/autobus?lang=ar"
              className="block w-full text-center rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-500 px-3 py-2 text-xs font-bold text-white hover:opacity-95 transition shadow-md shadow-emerald-600/20"
            >
              العب أتوبيس كومبليت 🚌
            </Link>
          </div>
        </div>

        {/* Game 9: Estimation (استميشن) */}
        <div className="group relative flex flex-col justify-between rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 p-5 shadow-sm backdrop-blur-md transition hover:border-amber-500 hover:shadow-xl hover:shadow-amber-500/10">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-3xl animate-bounce">♠️</span>
              <span className="rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2 py-0.5 text-[11px] font-bold border border-amber-500/20">
                Card Strategy
              </span>
            </div>
            <h2 className="mt-3 text-lg font-extrabold text-zinc-900 dark:text-zinc-50">
              استميشن (Estimation)
            </h2>
            <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              The king of cafe card games! 4 players, 13 cards, bidding calls, Trumps (♠ ♥ ♦ ♣ صن), trick taking & Egyptian cafe score sheet!
            </p>
          </div>

          <div className="mt-5">
            <Link
              href="/games/estimation?lang=ar"
              className="block w-full text-center rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 px-3 py-2 text-xs font-bold text-white hover:opacity-95 transition shadow-md shadow-amber-600/20"
            >
              العب استميشن ♠️
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
