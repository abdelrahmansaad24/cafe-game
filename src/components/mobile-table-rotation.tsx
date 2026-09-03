"use client";

import { useEffect, useState, useCallback } from "react";

interface MobileTableRotationProps {
  lang?: "ar" | "en";
  isRotated: boolean;
  onToggleRotate: () => void;
  gameName?: string;
}

export function MobileTableRotation({
  lang = "ar",
  isRotated,
  onToggleRotate,
  gameName,
}: MobileTableRotationProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Check viewport orientation
  useEffect(() => {
    const checkOrientation = () => {
      if (typeof window === "undefined") return;
      const mobile = window.innerWidth <= 820 || window.innerHeight <= 600;
      const portrait = window.innerHeight > window.innerWidth;
      setIsMobile(mobile);
      setIsPortrait(portrait);
    };

    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);

    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  // Fullscreen Landscape request
  const requestLandscapeFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      }
      // Try locking screen orientation to landscape if supported
      const screenAny = window.screen as unknown as {
        orientation?: { lock?: (orientation: string) => Promise<void> };
      };
      if (screenAny.orientation?.lock) {
        await screenAny.orientation.lock("landscape").catch(() => {});
      }
    } catch {
      // Fallback: toggle internal virtual rotation if native lock is blocked by browser
      onToggleRotate();
    }
  }, [onToggleRotate]);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {}
  }, []);

  if (!isMobile) return null;

  const t = {
    rotateSuggestion:
      lang === "ar"
        ? "🔄 اقلب الشاشة بالعرض لتظهر الطاولة بالكامل بدون تمرير!"
        : "🔄 Rotate your screen to landscape for the full table with no overflow bar!",
    rotateBtn: lang === "ar" ? "تدوير الشاشة" : "Rotate View",
    fullscreenBtn: lang === "ar" ? "ملء الشاشة" : "Fullscreen",
    restoreBtn: lang === "ar" ? "الوضع العادي" : "Standard View",
    close: lang === "ar" ? "إغلاق" : "Dismiss",
  };

  return (
    <div className="w-full select-none">
      {/* Mobile Orientation Alert Banner (when in portrait and not rotated) */}
      {isPortrait && !isRotated && !bannerDismissed && (
        <div className="mb-3 flex items-center justify-between gap-2 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 p-2.5 sm:p-3 text-xs font-bold text-amber-900 dark:text-amber-100 shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg animate-bounce">📱↻</span>
            <span className="leading-tight">{t.rotateSuggestion}</span>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={requestLandscapeFullscreen}
              className="rounded-xl bg-amber-500 hover:bg-amber-600 px-2.5 py-1 text-[11px] font-black text-white shadow transition cursor-pointer active:scale-95"
            >
              {t.rotateBtn}
            </button>
            <button
              type="button"
              onClick={() => setBannerDismissed(true)}
              className="rounded-xl border border-amber-500/30 bg-black/10 px-2 py-1 text-[10px] text-zinc-500 dark:text-zinc-300 hover:bg-black/20 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Floating Quick Toggle for Rotation & Landscape View */}
      <div className="flex items-center justify-end gap-2 pb-2">
        <button
          type="button"
          onClick={onToggleRotate}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black shadow-md transition cursor-pointer active:scale-95 ${
            isRotated
              ? "bg-amber-500 text-white ring-2 ring-amber-300"
              : "border border-zinc-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
          }`}
          title={isRotated ? t.restoreBtn : t.rotateBtn}
        >
          <span className="text-sm">🔄</span>
          <span>{isRotated ? t.restoreBtn : t.rotateBtn}</span>
        </button>

        <button
          type="button"
          onClick={isFullscreen ? exitFullscreen : requestLandscapeFullscreen}
          className="flex items-center gap-1.5 rounded-full border border-zinc-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 px-3 py-1 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 shadow-md transition cursor-pointer active:scale-95"
          title={t.fullscreenBtn}
        >
          <span className="text-sm">{isFullscreen ? "🗗" : "⛶"}</span>
          <span>{isFullscreen ? t.restoreBtn : t.fullscreenBtn}</span>
        </button>
      </div>
    </div>
  );
}
