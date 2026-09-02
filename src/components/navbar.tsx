import Link from "next/link";
import { auth } from "@/lib/auth";
import { ThemeToggle } from "./theme-toggle";
import { SignOutButton } from "./sign-out-button";

export async function Navbar() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-lg text-zinc-900 dark:text-zinc-50 tracking-tight hover:opacity-80 transition"
          >
            <span className="text-xl">☕</span>
            <span>Cafe Games</span>
          </Link>

          <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            <Link
              href="/games/quarter-monkey?lang=ar"
              className="hover:text-zinc-900 dark:hover:text-zinc-100 transition"
            >
              🐒 ربع قرد
            </Link>
            <Link
              href="/games/blink?lang=ar"
              className="hover:text-zinc-900 dark:hover:text-zinc-100 transition"
            >
              😉 غمازة (Blink)
            </Link>
            <Link
              href="/games/bekasa?lang=ar"
              className="hover:text-zinc-900 dark:hover:text-zinc-100 transition"
            >
              🎭 بكاسة (Bekasa)
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          <ThemeToggle />

          {session?.user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/dashboard"
                className="hidden sm:inline-flex rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                {session.user.name || session.user.email?.split("@")[0] || "Profile"}
              </Link>
              <SignOutButton className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-900 dark:bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white transition" />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
