"use client";

import React from "react";
import { EstimationCard } from "@/lib/games/estimation-types";

type PlayingCardProps = {
  card: EstimationCard;
  isPlayable?: boolean;
  disabled?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
};

export function PlayingCard({
  card,
  isPlayable = false,
  disabled = false,
  isSelected = false,
  onClick,
  className = "",
  size = "md",
}: PlayingCardProps) {
  const isRed = card.color === "red";

  const sizeClasses = {
    sm: "w-10 h-14 text-xs rounded-lg p-1",
    md: "w-16 h-24 sm:w-20 sm:h-28 text-sm sm:text-base rounded-xl p-1.5",
    lg: "w-20 h-30 sm:w-24 sm:h-36 text-base sm:text-lg rounded-2xl p-2",
  }[size];

  return (
    <button
      type="button"
      disabled={disabled || !isPlayable}
      onClick={onClick}
      className={`relative select-none flex flex-col justify-between border shadow-md transition-all duration-150 ${sizeClasses} ${
        isSelected
          ? "-translate-y-3 ring-4 ring-amber-400 border-amber-500 shadow-xl"
          : isPlayable
          ? "cursor-pointer hover:-translate-y-2 hover:shadow-lg border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-100 text-zinc-900"
          : "opacity-60 cursor-not-allowed border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-200 text-zinc-800"
      } ${className}`}
    >
      {/* Top Left Index */}
      <div
        className={`flex flex-col items-center leading-none font-black ${
          isRed ? "text-red-600" : "text-zinc-900"
        }`}
      >
        <span className="text-[11px] sm:text-xs font-mono">{card.valueLabel}</span>
        <span className="text-xs sm:text-sm">{card.suitSymbol}</span>
      </div>

      {/* Center Big Emblem */}
      <div
        className={`my-auto flex items-center justify-center font-black ${
          isRed ? "text-red-600" : "text-zinc-900"
        }`}
      >
        <span className="text-lg sm:text-2xl font-mono">{card.suitSymbol}</span>
      </div>

      {/* Bottom Right Index (Inverted) */}
      <div
        className={`flex flex-col items-center leading-none font-black rotate-180 ${
          isRed ? "text-red-600" : "text-zinc-900"
        }`}
      >
        <span className="text-[11px] sm:text-xs font-mono">{card.valueLabel}</span>
        <span className="text-xs sm:text-sm">{card.suitSymbol}</span>
      </div>
    </button>
  );
}
