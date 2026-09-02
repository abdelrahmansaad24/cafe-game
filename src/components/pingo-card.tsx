"use client";

import React from "react";
import { PINGO_LETTERS } from "@/lib/games/pingo-types";

type PingoCardProps = {
  gridNumbers: number[];
  scratchedCellIndices: number[];
  completedLineIndices: number[][];
  lettersUnlocked: string; // e.g. "P", "PI", "PIN", "PING", "PINGO"
  isInteractive?: boolean;
  onCellClick?: (num: number, index: number) => void;
  lastCalledNumber?: number | null;
  size?: "sm" | "md" | "lg";
  playerName?: string;
  isCurrentTurn?: boolean;
};

export function PingoCardView({
  gridNumbers,
  scratchedCellIndices,
  completedLineIndices,
  lettersUnlocked,
  isInteractive = false,
  onCellClick,
  lastCalledNumber,
  size = "md",
  playerName,
  isCurrentTurn = false,
}: PingoCardProps) {
  const scratchedSet = new Set(scratchedCellIndices);

  // Check if a cell is part of any completed line
  const completedCells = new Set<number>();
  completedLineIndices.forEach((line) => {
    line.forEach((cellIdx) => completedCells.add(cellIdx));
  });

  const cellDimensions = {
    sm: "h-8 w-8 text-xs font-bold",
    md: "h-11 w-11 sm:h-12 sm:w-12 text-sm sm:text-base font-extrabold",
    lg: "h-14 w-14 sm:h-16 sm:w-16 text-base sm:text-lg font-black",
  }[size];

  const letterDimensions = {
    sm: "h-7 w-7 text-xs font-black",
    md: "h-9 w-9 text-sm sm:text-base font-black",
    lg: "h-11 w-11 text-base sm:text-lg font-black",
  }[size];

  return (
    <div
      className={`relative flex flex-col items-center rounded-3xl border-2 transition p-4 sm:p-5 shadow-2xl ${
        isCurrentTurn
          ? "border-amber-400 bg-gradient-to-b from-amber-500/10 via-zinc-900 to-zinc-950 ring-4 ring-amber-400/30"
          : "border-zinc-300 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95"
      }`}
    >
      {/* Player Header if provided */}
      {playerName && (
        <div className="flex items-center justify-between w-full mb-3 px-1">
          <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[140px]">
            {playerName}
          </span>
          {isCurrentTurn && (
            <span className="rounded-full bg-amber-500 text-zinc-950 px-2 py-0.5 text-[10px] font-black animate-pulse">
              دور اللعب
            </span>
          )}
        </div>
      )}

      {/* P - I - N - G - O Header Tracker */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
        {PINGO_LETTERS.map((letter, idx) => {
          const isUnlocked = lettersUnlocked.length > idx;
          return (
            <div
              key={letter}
              className={`flex items-center justify-center rounded-2xl border-2 transition-all transform duration-300 ${letterDimensions} ${
                isUnlocked
                  ? "border-amber-400 bg-gradient-to-br from-amber-400 via-orange-500 to-rose-600 text-white shadow-lg shadow-amber-500/40 scale-110 animate-pulse"
                  : "border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800/80 text-zinc-400 dark:text-zinc-500"
              }`}
            >
              <span className="relative">
                {letter}
                {isUnlocked && (
                  <span className="absolute -top-1 -right-1 text-[8px] animate-bounce">
                    ✨
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      {/* 5x5 Number Grid */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-zinc-100/70 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800/80 shadow-inner">
        {gridNumbers.map((num, idx) => {
          const isScratched = scratchedSet.has(idx);
          const isPartOfCompleteLine = completedCells.has(idx);
          const isLastCalled = lastCalledNumber === num;

          return (
            <button
              key={`${num}-${idx}`}
              type="button"
              disabled={!isInteractive || isScratched}
              onClick={() => onCellClick?.(num, idx)}
              className={`relative flex items-center justify-center rounded-xl border transition-all duration-200 select-none ${cellDimensions} ${
                isInteractive && !isScratched
                  ? "cursor-pointer hover:scale-105 hover:border-amber-400 hover:bg-amber-400/20 active:scale-95"
                  : "cursor-default"
              } ${
                isPartOfCompleteLine
                  ? "border-amber-400/80 bg-gradient-to-br from-amber-500/25 to-rose-500/25 text-amber-500 dark:text-amber-300"
                  : isScratched
                  ? "border-red-400/40 bg-red-500/10 dark:bg-red-950/30 text-red-600 dark:text-red-400"
                  : isLastCalled
                  ? "border-amber-500 bg-amber-400/30 ring-2 ring-amber-400 text-zinc-900 dark:text-zinc-100 animate-bounce"
                  : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              }`}
            >
              {/* Number display */}
              <span className={isScratched ? "line-through opacity-70" : ""}>
                {num}
              </span>

              {/* Hand-drawn red X / Scratch Stamp overlay */}
              {isScratched && (
                <span className="absolute inset-0 flex items-center justify-center text-red-600 dark:text-red-500 font-black text-xl sm:text-2xl pointer-events-none drop-shadow-sm rotate-6">
                  ✕
                </span>
              )}

              {/* Golden star badge for completed lines */}
              {isPartOfCompleteLine && (
                <span className="absolute top-0.5 right-0.5 text-[8px] text-amber-400">
                  ★
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
