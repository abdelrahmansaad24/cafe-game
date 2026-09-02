"use client";

import { useEffect, useState } from "react";
import { useTheme } from "./theme-provider";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        className={`inline-flex items-center justify-center rounded-xl p-2 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 ${className}`}
        aria-label="Toggle theme"
      >
        <span className="h-5 w-5 opacity-0">🌙</span>
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-sm transition hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 cursor-pointer ${className}`}
    >
      {isDark ? (
        <>
          <span className="text-amber-400 text-base">☀️</span>
          <span className="hidden sm:inline text-xs font-semibold">Light</span>
        </>
      ) : (
        <>
          <span className="text-indigo-500 text-base">🌙</span>
          <span className="hidden sm:inline text-xs font-semibold">Dark</span>
        </>
      )}
    </button>
  );
}
