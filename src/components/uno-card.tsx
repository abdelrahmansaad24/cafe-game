"use client";

import { UnoCard, UnoColor } from "@/lib/games/uno-types";

interface UnoCardProps {
  card?: UnoCard | null;
  faceDown?: boolean;
  size?: "sm" | "md" | "lg";
  isPlayable?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
  countBadge?: number;
}

const COLOR_GRADIENTS: Record<UnoColor, string> = {
  RED: "from-red-500 via-red-600 to-red-700 text-red-600",
  BLUE: "from-sky-500 via-blue-600 to-blue-700 text-blue-600",
  GREEN: "from-emerald-500 via-green-600 to-green-700 text-green-600",
  YELLOW: "from-amber-300 via-yellow-400 to-amber-500 text-amber-500",
  WILD: "from-zinc-900 via-zinc-950 to-black text-white",
};

export function UnoCardView({
  card,
  faceDown = false,
  size = "md",
  isPlayable = false,
  isSelected = false,
  onClick,
  className = "",
  countBadge,
}: UnoCardProps) {
  const sizeMap = {
    sm: "w-12 h-18 text-xs rounded-lg",
    md: "w-18 h-26 text-sm rounded-xl",
    lg: "w-24 h-36 text-base rounded-2xl",
  };

  const cornerSizeMap = {
    sm: "text-[9px] p-0.5",
    md: "text-[11px] p-1",
    lg: "text-sm p-1.5",
  };

  const centerTextSizeMap = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };

  if (faceDown || !card) {
    return (
      <div
        onClick={onClick}
        className={`relative shrink-0 select-none shadow-md border-2 border-white/80 bg-zinc-950 flex items-center justify-center cursor-pointer transition ${sizeMap[size]} ${className}`}
      >
        <div className="w-4/5 h-3/5 rounded-[50%] bg-gradient-to-r from-red-600 to-red-700 -rotate-25 flex items-center justify-center shadow-inner border border-amber-400">
          <span className="font-black italic text-amber-300 tracking-tighter text-xs sm:text-sm drop-shadow">
            UNO
          </span>
        </div>
        {countBadge !== undefined && (
          <span className="absolute -top-1.5 -right-1.5 rounded-full bg-red-600 text-white font-mono font-black text-[10px] w-4 h-4 flex items-center justify-center shadow">
            {countBadge}
          </span>
        )}
      </div>
    );
  }

  const isWild = card.color === "WILD" || card.value === "WILD" || card.value === "WILD_DRAW_FOUR";
  const grad = COLOR_GRADIENTS[card.color] || COLOR_GRADIENTS.WILD;

  // Visual label for action cards
  let displayValue: string = card.value;
  if (card.value === "SKIP") displayValue = "🚫";
  if (card.value === "REVERSE") displayValue = "⇄";
  if (card.value === "DRAW_TWO") displayValue = "+2";
  if (card.value === "WILD") displayValue = "★";
  if (card.value === "WILD_DRAW_FOUR") displayValue = "+4";

  return (
    <div
      onClick={onClick}
      className={`relative shrink-0 select-none shadow-md border-2 border-white bg-gradient-to-br ${grad} p-1 flex flex-col justify-between overflow-hidden transition cursor-pointer ${
        sizeMap[size]
      } ${
        isPlayable
          ? "ring-2 ring-amber-300 shadow-amber-400/40 hover:-translate-y-2 hover:scale-105 active:scale-95"
          : "opacity-80"
      } ${isSelected ? "ring-4 ring-white -translate-y-3 scale-110 shadow-2xl z-20" : ""} ${className}`}
    >
      {/* Top Left Corner Index */}
      <div className={`font-black italic leading-none text-white drop-shadow ${cornerSizeMap[size]}`}>
        {card.value === "WILD" ? "W" : card.value === "WILD_DRAW_FOUR" ? "+4" : displayValue}
      </div>

      {/* Center Oval with Symbol */}
      <div className="mx-auto w-4/5 h-3/5 rounded-[50%] bg-white/95 -rotate-25 flex items-center justify-center shadow-md relative overflow-hidden">
        {isWild ? (
          // 4-quadrant rainbow badge
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
            <div className="bg-red-600" />
            <div className="bg-blue-600" />
            <div className="bg-amber-400" />
            <div className="bg-emerald-600" />
            <div className="absolute inset-0 flex items-center justify-center font-black italic text-white drop-shadow text-base sm:text-xl">
              {card.value === "WILD_DRAW_FOUR" ? "+4" : "★"}
            </div>
          </div>
        ) : (
          <span
            className={`font-black italic drop-shadow-sm select-none ${centerTextSizeMap[size]} ${
              card.color === "YELLOW" ? "text-amber-500" : grad.split(" ").slice(-1)[0]
            }`}
          >
            {displayValue}
          </span>
        )}
      </div>

      {/* Bottom Right Corner Index (upside down) */}
      <div className={`font-black italic leading-none text-white drop-shadow self-end rotate-180 ${cornerSizeMap[size]}`}>
        {card.value === "WILD" ? "W" : card.value === "WILD_DRAW_FOUR" ? "+4" : displayValue}
      </div>
    </div>
  );
}
