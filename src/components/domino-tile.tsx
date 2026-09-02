"use client";

import { DominoTile } from "@/lib/games/domino-types";

interface DominoTileViewProps {
  tile: DominoTile;
  orientation?: "vertical" | "horizontal";
  size?: "sm" | "md" | "lg";
  isPlayable?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
  faceDown?: boolean;
}

function renderPips(value: number, dotSizeClass: string) {
  // Dot coordinate arrangements in a 3x3 grid
  // Grid cells: 0 1 2
  //             3 4 5
  //             6 7 8
  const activeCells: Record<number, number[]> = {
    0: [],
    1: [4],
    2: [2, 6],
    3: [2, 4, 6],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };

  const active = activeCells[value] || [];

  return (
    <div className="grid grid-cols-3 grid-rows-3 h-full w-full p-1 place-items-center">
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((cellIdx) => (
        <div key={cellIdx} className="h-full w-full flex items-center justify-center">
          {active.includes(cellIdx) ? (
            <span
              className={`rounded-full bg-zinc-950 dark:bg-amber-300 shadow-sm ${dotSizeClass}`}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function DominoTileView({
  tile,
  orientation = "vertical",
  size = "md",
  isPlayable = false,
  isSelected = false,
  onClick,
  className = "",
  faceDown = false,
}: DominoTileViewProps) {
  const [val1, val2] = tile;

  const sizeConfigs = {
    sm: {
      vert: "w-9 h-18 rounded-md",
      horiz: "w-18 h-9 rounded-md",
      dot: "w-1.5 h-1.5",
      dividerVert: "h-[1.5px] w-full",
      dividerHoriz: "w-[1.5px] h-full",
    },
    md: {
      vert: "w-12 h-24 rounded-lg",
      horiz: "w-24 h-12 rounded-lg",
      dot: "w-2 h-2",
      dividerVert: "h-[2px] w-full",
      dividerHoriz: "w-[2px] h-full",
    },
    lg: {
      vert: "w-14 h-28 rounded-xl",
      horiz: "w-28 h-14 rounded-xl",
      dot: "w-2.5 h-2.5",
      dividerVert: "h-[2px] w-full",
      dividerHoriz: "w-[2px] h-full",
    },
  };

  const conf = sizeConfigs[size];
  const isVert = orientation === "vertical";

  if (faceDown) {
    return (
      <div
        className={`shrink-0 border border-zinc-300 dark:border-zinc-700 bg-gradient-to-br from-amber-700/80 to-amber-900/90 shadow-md ${
          isVert ? conf.vert : conf.horiz
        } flex items-center justify-center ${className}`}
      >
        <span className="text-amber-200/50 text-xs font-bold font-mono">🀄</span>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`relative shrink-0 select-none transition ${
        isVert ? conf.vert : conf.horiz
      } ${
        isVert ? "flex flex-col" : "flex flex-row"
      } border-2 border-zinc-300/90 dark:border-zinc-700 bg-gradient-to-b from-stone-50 via-zinc-100 to-stone-200 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950 shadow-md ${
        isPlayable
          ? "ring-2 ring-emerald-500 shadow-emerald-500/20 cursor-pointer hover:scale-105 active:scale-95"
          : ""
      } ${isSelected ? "ring-2 ring-indigo-500 scale-105 shadow-indigo-500/30" : ""} ${className}`}
    >
      {/* Side 1 */}
      <div className="flex-1 flex items-center justify-center relative">
        {renderPips(val1, conf.dot)}
      </div>

      {/* Center Divider & Pivot Pin */}
      <div
        className={`bg-zinc-400 dark:bg-zinc-600 flex items-center justify-center shrink-0 ${
          isVert ? conf.dividerVert : conf.dividerHoriz
        }`}
      >
        <span className="h-1 w-1 rounded-full bg-amber-500/80 dark:bg-amber-400 shadow-inner" />
      </div>

      {/* Side 2 */}
      <div className="flex-1 flex items-center justify-center relative">
        {renderPips(val2, conf.dot)}
      </div>
    </div>
  );
}
