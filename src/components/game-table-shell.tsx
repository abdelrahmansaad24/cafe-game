"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, ReactNode } from "react";

type GameTheme = "domino" | "screw" | "uno";

interface GameTableShellProps {
  children: ReactNode;
  /** Content for the bottom dock area (player's cards/hand) */
  dock: ReactNode;
  /** Content for the top bar area (opponents, score, etc.) */
  topBar: ReactNode;
  /** Content for the slide-out drawer (scoreboard, actions log, etc.) */
  drawerContent: ReactNode;
  /** Visual theme */
  theme: GameTheme;
  /** Whether it's the current player's turn */
  isMyTurn: boolean;
  /** Language */
  lang: "en" | "ar";
  /** Link back to lobby */
  lobbyHref: string;
  /** Room code */
  roomCode: string;
  /** Callback to leave the room */
  onLeave: () => void;
  /** Whether round/match is over (show overlay style) */
  isRoundOver?: boolean;
  /** Overlay content for round-over/match-finished state */
  roundOverContent?: ReactNode;
  /** Additional content to show above the dock (turn info, selected tile, etc.) */
  dockHeader?: ReactNode;
  /** Error message */
  error?: string | null;
  /** Extra floating modals (wild card picker, peek modal, etc.) */
  modals?: ReactNode;
  /** Busy/loading state */
  busy?: boolean;
}

const THEME_STYLES: Record<GameTheme, {
  bg: string;
  border: string;
  topBarBg: string;
  dockBg: string;
  accent: string;
  accentText: string;
  icon: string;
}> = {
  domino: {
    bg: "bg-gradient-to-b from-[#153a7f] via-[#1a449c] to-[#0d2252]",
    border: "border-yellow-400/70",
    topBarBg: "bg-[#0c1f47]/90",
    dockBg: "bg-[#091a3e]/90",
    accent: "bg-yellow-400",
    accentText: "text-yellow-300",
    icon: "🀄",
  },
  screw: {
    bg: "bg-gradient-to-br from-amber-950 via-stone-950 to-neutral-950",
    border: "border-amber-700/50",
    topBarBg: "bg-amber-950/90",
    dockBg: "bg-stone-950/90",
    accent: "bg-amber-500",
    accentText: "text-amber-300",
    icon: "🔩",
  },
  uno: {
    bg: "bg-gradient-to-br from-red-950 via-zinc-950 to-neutral-950",
    border: "border-red-900/50",
    topBarBg: "bg-red-950/90",
    dockBg: "bg-zinc-950/90",
    accent: "bg-red-500",
    accentText: "text-red-300",
    icon: "🎴",
  },
};

export function GameTableShell({
  children,
  dock,
  topBar,
  drawerContent,
  theme,
  isMyTurn,
  lang,
  lobbyHref,
  roomCode,
  onLeave,
  isRoundOver,
  roundOverContent,
  dockHeader,
  error,
  modals,
  busy,
}: GameTableShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const styles = THEME_STYLES[theme];

  // Add/remove fullscreen class on html element
  useEffect(() => {
    document.documentElement.classList.add("game-fullscreen-mode");
    return () => {
      document.documentElement.classList.remove("game-fullscreen-mode");
    };
  }, []);

  // Track fullscreen state
  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
        // Try to lock landscape on mobile
        const screenAny = window.screen as unknown as {
          orientation?: { lock?: (o: string) => Promise<void> };
        };
        if (screenAny.orientation?.lock) {
          await screenAny.orientation.lock("landscape").catch(() => {});
        }
      }
    } catch {
      // Browser may not support fullscreen
    }
  }, []);

  // Close drawer on escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && drawerOpen) {
        setDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [drawerOpen]);

  const t = {
    menu: lang === "ar" ? "القائمة" : "Menu",
    back: lang === "ar" ? "العودة للقائمة" : "Back to Lobby",
    leave: lang === "ar" ? "مغادرة الطاولة" : "Leave Table",
    fullscreen: lang === "ar" ? "ملء الشاشة" : "Fullscreen",
    exitFs: lang === "ar" ? "إلغاء ملء الشاشة" : "Exit Fullscreen",
    close: lang === "ar" ? "إغلاق" : "Close",
    yourTurn: lang === "ar" ? "دورك!" : "Your Turn!",
  };

  return (
    <>
      {/* FULLSCREEN GAME TABLE */}
      <div
        className={`game-table-root felt-texture ${styles.bg}`}
        dir={lang === "ar" ? "rtl" : "ltr"}
      >
        {/* TOP BAR */}
        <div className={`game-table-topbar ${styles.topBarBg} border-b ${styles.border}`}>
          {/* Left: Menu button */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="rounded-xl bg-white/10 hover:bg-white/20 p-2 text-white text-xs font-bold transition flex items-center gap-1.5 border border-white/15 cursor-pointer active:scale-95"
            title={t.menu}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {/* Center: Custom top bar content (score, opponents, etc.) */}
          <div className="flex-1 flex items-center justify-center gap-2 min-w-0 px-2">
            {topBar}
          </div>

          {/* Right: Fullscreen toggle + room code */}
          <div className="flex items-center gap-1.5">
            <span className="rounded-lg bg-black/40 border border-white/15 px-2 py-0.5 text-[10px] text-white/60 font-mono font-bold hidden sm:inline">
              #{roomCode}
            </span>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="rounded-xl bg-white/10 hover:bg-white/20 p-2 text-white text-xs font-bold transition border border-white/15 cursor-pointer active:scale-95"
              title={isFullscreen ? t.exitFs : t.fullscreen}
            >
              {isFullscreen ? "🗗" : "⛶"}
            </button>
          </div>
        </div>

        {/* CENTER ARENA */}
        <div className="game-table-arena relative z-0">
          {children}

          {/* Round Over Overlay */}
          {isRoundOver && roundOverContent && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
              <div className="w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
                {roundOverContent}
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM DOCK */}
        <div className={`game-table-dock ${styles.dockBg} border-t ${styles.border} ${isMyTurn ? "dock-my-turn" : ""}`}>
          {/* Turn indicator + dock header */}
          {dockHeader && (
            <div className="mb-1">
              {dockHeader}
            </div>
          )}

          {/* Player's hand */}
          <div className="card-dock-hand">
            {dock}
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-20 max-w-sm w-[90vw] rounded-2xl border border-red-500/50 bg-red-950/90 backdrop-blur-md p-3 text-xs text-red-200 font-bold text-center shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
            {error}
          </div>
        )}
      </div>

      {/* SLIDE-OUT DRAWER */}
      <div
        className={`game-drawer-backdrop ${drawerOpen ? "open" : ""}`}
        onClick={() => setDrawerOpen(false)}
      />
      <div
        className={`game-drawer-panel ${drawerOpen ? "open" : ""}`}
        dir={lang === "ar" ? "rtl" : "ltr"}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-lg">{styles.icon}</span>
            <span className="text-sm font-bold text-white">{t.menu}</span>
            <span className="text-[10px] font-mono text-white/40">#{roomCode}</span>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="rounded-xl bg-white/10 hover:bg-white/20 p-1.5 text-white/70 transition cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Drawer Quick Actions */}
        <div className="p-3 space-y-2 border-b border-white/10">
          <Link
            href={lobbyHref}
            className="flex items-center gap-2 w-full rounded-xl bg-white/10 hover:bg-white/20 px-4 py-2.5 text-xs font-bold text-white transition"
            onClick={() => setDrawerOpen(false)}
          >
            <span>←</span>
            <span>{t.back}</span>
          </Link>
          <button
            type="button"
            onClick={() => { onLeave(); setDrawerOpen(false); }}
            disabled={busy}
            className="flex items-center gap-2 w-full rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 px-4 py-2.5 text-xs font-bold text-red-300 transition cursor-pointer disabled:opacity-50"
          >
            <span>🚪</span>
            <span>{t.leave}</span>
          </button>
          <button
            type="button"
            onClick={() => { toggleFullscreen(); setDrawerOpen(false); }}
            className="flex items-center gap-2 w-full rounded-xl bg-white/10 hover:bg-white/20 px-4 py-2.5 text-xs font-bold text-white transition cursor-pointer"
          >
            <span>{isFullscreen ? "🗗" : "⛶"}</span>
            <span>{isFullscreen ? t.exitFs : t.fullscreen}</span>
          </button>
        </div>

        {/* Game-specific drawer content (scoreboard, log, language, etc.) */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {drawerContent}
        </div>
      </div>

      {/* Floating modals (wild picker, peek, etc.) */}
      {modals}
    </>
  );
}
