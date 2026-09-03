"use client";

import { DominoTile } from "@/lib/games/domino-types";

interface DominoTileViewProps {
  tile: DominoTile;
  orientation?: "vertical" | "horizontal";
  size?: "xs" | "sm" | "md" | "lg" | "responsive";
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
    <div className="grid grid-cols-3 grid-rows-3 h-full w-full p-1 place-items-center pointer-events-none select-none">
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((cellIdx) => (
        <div key={cellIdx} className="h-full w-full flex items-center justify-center">
          {active.includes(cellIdx) ? (
            <span
              className={`rounded-full bg-zinc-950 shadow-inner ${dotSizeClass}`}
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
    xs: {
      vert: "w-7 h-14 rounded-md",
      horiz: "w-14 h-7 rounded-md",
      dot: "w-1.5 h-1.5",
      dividerVert: "h-[1.5px] w-full",
      dividerHoriz: "w-[1.5px] h-full",
    },
    sm: {
      vert: "w-9 h-18 rounded-lg",
      horiz: "w-18 h-9 rounded-lg",
      dot: "w-1.5 h-1.5",
      dividerVert: "h-[1.5px] w-full",
      dividerHoriz: "w-[1.5px] h-full",
    },
    responsive: {
      vert: "w-[clamp(2.3rem,6.8vw,3.4rem)] h-[clamp(4.6rem,13.6vw,6.8rem)] rounded-xl",
      horiz: "w-[clamp(4.6rem,13.6vw,6.8rem)] h-[clamp(2.3rem,6.8vw,3.4rem)] rounded-xl",
      dot: "w-[clamp(0.35rem,1.1vw,0.55rem)] h-[clamp(0.35rem,1.1vw,0.55rem)]",
      dividerVert: "h-[2px] w-full",
      dividerHoriz: "w-[2px] h-full",
    },
    md: {
      vert: "w-12 h-24 rounded-xl",
      horiz: "w-24 h-12 rounded-xl",
      dot: "w-2 h-2",
      dividerVert: "h-[2px] w-full",
      dividerHoriz: "w-[2px] h-full",
    },
    lg: {
      vert: "w-14 h-28 rounded-2xl",
      horiz: "w-28 h-14 rounded-2xl",
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
        className={`shrink-0 border-2 border-slate-300/80 bg-gradient-to-br from-white via-slate-100 to-slate-200 shadow-md ${
          isVert ? conf.vert : conf.horiz
        } flex items-center justify-center relative overflow-hidden ${className}`}
      >
        <div className="w-3/4 h-3/4 rounded-md border border-slate-300/60 bg-slate-50/50 flex items-center justify-center">
          <span className="text-slate-400 text-[10px] font-bold">🀄</span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`relative shrink-0 select-none transition-all duration-150 ${
        isVert ? conf.vert : conf.horiz
      } ${
        isVert ? "flex flex-col" : "flex flex-row"
      } border-2 border-slate-300 bg-gradient-to-b from-white via-[#faf8f4] to-[#ede7db] shadow-lg ${
        isPlayable
          ? "ring-2 ring-emerald-400 shadow-emerald-500/30 cursor-pointer hover:scale-105 active:scale-95"
          : ""
      } ${
        isSelected
          ? "ring-4 ring-amber-400 scale-105 -translate-y-2 shadow-2xl shadow-amber-500/40"
          : ""
      } ${className}`}
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
