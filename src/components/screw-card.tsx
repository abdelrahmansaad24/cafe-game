"use client";

import { ScrewCard, ScrewCardType } from "@/lib/games/screw-types";

interface ScrewCardProps {
  card?: ScrewCard | null;
  faceDown?: boolean;
  isKnownToMe?: boolean;
  size?: "sm" | "md" | "lg";
  isSelected?: boolean;
  isSelectable?: boolean;
  onClick?: () => void;
  className?: string;
  badge?: string;
}

const ACTION_COLOR_MAP: Record<ScrewCardType, { bg: string; text: string; border: string }> = {
  NUMBER: { bg: "bg-zinc-100 dark:bg-zinc-800", text: "text-zinc-900 dark:text-zinc-100", border: "border-zinc-300 dark:border-zinc-700" },
  PEEK_SELF: { bg: "bg-sky-50 dark:bg-sky-950/60", text: "text-sky-700 dark:text-sky-300", border: "border-sky-400" },
  PEEK_OTHER: { bg: "bg-indigo-50 dark:bg-indigo-950/60", text: "text-indigo-700 dark:text-indigo-300", border: "border-indigo-400" },
  SWAP: { bg: "bg-amber-50 dark:bg-amber-950/60", text: "text-amber-800 dark:text-amber-300", border: "border-amber-400" },
  PING_PONG: { bg: "bg-rose-50 dark:bg-rose-950/60", text: "text-rose-700 dark:text-rose-300", border: "border-rose-400" },
  THE_THIEF: { bg: "bg-emerald-50 dark:bg-emerald-950/60", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-500" },
  SPY_ALL: { bg: "bg-purple-50 dark:bg-purple-950/60", text: "text-purple-700 dark:text-purple-300", border: "border-purple-400" },
};

export function ScrewCardView({
  card,
  faceDown = false,
  isKnownToMe = false,
  size = "md",
  isSelected = false,
  isSelectable = false,
  onClick,
  className = "",
  badge,
}: ScrewCardProps) {
  const sizeMap = {
    sm: "w-14 h-20 text-xs rounded-xl",
    md: "w-20 h-28 text-sm rounded-2xl",
    lg: "w-28 h-40 text-base rounded-3xl",
  };

  // FACE-DOWN CARD (Ornate Ruby Card Back with Screw Logo)
  if (faceDown || !card) {
    return (
      <div
        onClick={onClick}
        className={`relative shrink-0 select-none shadow-md border-2 border-amber-400/70 bg-gradient-to-br from-rose-950 via-red-950 to-stone-950 flex flex-col items-center justify-center transition ${
          sizeMap[size]
        } ${isSelectable ? "cursor-pointer hover:scale-105 hover:ring-2 hover:ring-amber-300 active:scale-95" : ""} ${
          isSelected ? "ring-4 ring-amber-400 -translate-y-2 scale-105 shadow-2xl" : ""
        } ${className}`}
      >
        {/* Ornate Gold Border Inset */}
        <div className="w-[85%] h-[88%] rounded-xl border border-amber-400/40 bg-black/40 flex flex-col items-center justify-center relative p-1">
          <span className="text-xl sm:text-2xl drop-shadow">🔩</span>
          <span className="font-extrabold tracking-widest text-[9px] text-amber-300/80 uppercase mt-0.5">
            SCREW
          </span>

          {/* If memorized by the player, subtle indicator */}
          {isKnownToMe && (
            <span
              className="absolute top-1 right-1 text-[10px] opacity-90 drop-shadow"
              title="You know this card (مكشوفة لك)"
            >
              👁️
            </span>
          )}
        </div>

        {badge && (
          <span className="absolute -top-1.5 -right-1.5 rounded-full bg-amber-500 text-zinc-950 font-mono font-black text-[10px] px-1.5 py-0.5 shadow">
            {badge}
          </span>
        )}
      </div>
    );
  }

  // FACE-UP CARD
  const style = ACTION_COLOR_MAP[card.type] || ACTION_COLOR_MAP.NUMBER;
  const isRedKing = card.value === -1;
  const isBlackKing = card.value === 20;

  return (
    <div
      onClick={onClick}
      className={`relative shrink-0 select-none shadow-md border-2 ${
        isRedKing
          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 ring-2 ring-emerald-400"
          : isBlackKing
          ? "border-red-600 bg-red-950 text-white ring-2 ring-red-500"
          : `${style.border} ${style.bg}`
      } p-2 flex flex-col justify-between overflow-hidden transition ${sizeMap[size]} ${
        isSelectable ? "cursor-pointer hover:scale-105 hover:ring-2 hover:ring-amber-300 active:scale-95" : ""
      } ${isSelected ? "ring-4 ring-amber-400 -translate-y-2 scale-105 shadow-2xl" : ""} ${className}`}
    >
      {/* Top Header: Value & Icon */}
      <div className="flex items-center justify-between font-black leading-none">
        <span
          className={`text-sm sm:text-base font-extrabold font-mono ${
            isRedKing ? "text-emerald-700 dark:text-emerald-300" : isBlackKing ? "text-red-400" : style.text
          }`}
        >
          {isRedKing ? "-1" : isBlackKing ? "+20" : card.value}
        </span>
        <span className="text-xs">
          {isRedKing ? "👑" : isBlackKing ? "💀" : card.type === "PING_PONG" ? "🏓" : card.isAction ? "⚡" : ""}
        </span>
      </div>

      {/* Center Label / Icon */}
      <div className="flex flex-col items-center justify-center my-auto text-center">
        {card.type === "PING_PONG" ? (
          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-3xl animate-bounce">🏓</span>
            <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 tracking-tight leading-none mt-0.5">
              PING PONG
            </span>
          </div>
        ) : card.type === "THE_THIEF" ? (
          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-3xl animate-pulse">🦹</span>
            <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 tracking-tight leading-none mt-0.5">
              THE THIEF
            </span>
          </div>
        ) : isRedKing ? (
          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-3xl">👑</span>
            <span className="text-[9px] font-black text-emerald-700 dark:text-emerald-300">RED KING</span>
          </div>
        ) : isBlackKing ? (
          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-3xl text-red-500">💀</span>
            <span className="text-[9px] font-black text-red-400">BLACK KING</span>
          </div>
        ) : (
          <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight drop-shadow-sm">
            {card.label}
          </span>
        )}
      </div>

      {/* Bottom Footer: Short Action Name */}
      <div className="text-[9px] sm:text-[10px] font-bold text-center truncate opacity-85">
        {card.actionNameAr}
      </div>

      {badge && (
        <span className="absolute -top-1.5 -right-1.5 rounded-full bg-amber-500 text-zinc-950 font-mono font-black text-[10px] px-1.5 py-0.5 shadow">
          {badge}
        </span>
      )}
    </div>
  );
}
