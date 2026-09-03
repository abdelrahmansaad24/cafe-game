"use client";

import React, { useMemo } from "react";
import { BoardTile, DominoTile } from "@/lib/games/domino-types";

interface DominoSnakeBoardProps {
  boardTiles: BoardTile[];
  selectedTile: DominoTile | null;
  canPlayLeft: boolean;
  canPlayRight: boolean;
  leftEnd: number | null;
  rightEnd: number | null;
  isMyTurn: boolean;
  busy: boolean;
  onPlaySide: (side: "LEFT" | "RIGHT") => void;
  lang: "en" | "ar";
}

interface CalculatedTile {
  tile: DominoTile;
  side: "LEFT" | "RIGHT" | "START";
  x: number;
  y: number;
  width: number;
  height: number;
  isVertical: boolean;
  val1: number;
  val2: number;
}

// Dot positions in normalized coordinates [-1, 1] relative to half-tile center
function getPipCoordinates(value: number, isVertical: boolean): Array<[number, number]> {
  const d = 0.55;
  switch (value) {
    case 0:
      return [];
    case 1:
      return [[0, 0]];
    case 2:
      return [[-d, -d], [d, d]];
    case 3:
      return [[-d, -d], [0, 0], [d, d]];
    case 4:
      return [[-d, -d], [d, -d], [-d, d], [d, d]];
    case 5:
      return [[-d, -d], [d, -d], [0, 0], [-d, d], [d, d]];
    case 6:
      if (isVertical) {
        return [
          [-d, -d], [d, -d],
          [-d, 0],  [d, 0],
          [-d, d],  [d, d],
        ];
      } else {
        return [
          [-d, -d], [-d, d],
          [0, -d],  [0, d],
          [d, -d],  [d, d],
        ];
      }
    default:
      return [];
  }
}

export function DominoSnakeBoard({
  boardTiles,
  selectedTile,
  canPlayLeft,
  canPlayRight,
  leftEnd,
  rightEnd,
  isMyTurn,
  busy,
  onPlaySide,
  lang,
}: DominoSnakeBoardProps) {
  const layout = useMemo(() => {
    if (!boardTiles || boardTiles.length === 0) {
      return {
        tiles: [] as CalculatedTile[],
        bounds: { minX: -150, maxX: 150, minY: -100, maxY: 100 },
        leftTarget: null as { x: number; y: number } | null,
        rightTarget: null as { x: number; y: number } | null,
      };
    }

    const startIdx = boardTiles.findIndex((t) => t.side === "START");
    const validStartIdx = startIdx >= 0 ? startIdx : 0;

    const TILE_W = 32; // Short side
    const TILE_L = 64; // Long side
    const GAP = 3; // Space between dominoes

    const positions: CalculatedTile[] = new Array(boardTiles.length);

    // Place start tile centered vertically on Y = 0
    const startTile = boardTiles[validStartIdx].tile;
    const startIsDouble = startTile[0] === startTile[1];
    const startW = startIsDouble ? TILE_W : TILE_L;
    const startH = startIsDouble ? TILE_L : TILE_W;

    positions[validStartIdx] = {
      tile: startTile,
      side: "START",
      x: 0,
      y: -startH / 2,
      width: startW,
      height: startH,
      isVertical: startIsDouble,
      val1: startTile[0],
      val2: startTile[1],
    };

    // Trace RIGHT side (indices validStartIdx + 1 to boardTiles.length - 1)
    const MAX_RIGHT = 4;
    const MAX_DOWN = 2;

    let dirRight: "RIGHT" | "DOWN" | "LEFT" = "RIGHT";
    let countInDir = 0;
    let lastRightDir = "RIGHT";

    let rightRowCenterY = 0;
    let rightColCenterX = 0;
    let currRightX = positions[validStartIdx].x + positions[validStartIdx].width + GAP;
    let currRightY = 0;

    for (let i = validStartIdx + 1; i < boardTiles.length; i++) {
      const t = boardTiles[i].tile;
      const isDouble = t[0] === t[1];
      lastRightDir = dirRight;

      if (dirRight === "RIGHT") {
        countInDir++;
        const isVert = isDouble; // doubles perpendicular
        const w = isVert ? TILE_W : TILE_L;
        const h = isVert ? TILE_L : TILE_W;

        positions[i] = {
          tile: t,
          side: "RIGHT",
          x: currRightX,
          y: rightRowCenterY - h / 2,
          width: w,
          height: h,
          isVertical: isVert,
          val1: t[0],
          val2: t[1],
        };

        currRightX += w + GAP;

        if (countInDir >= MAX_RIGHT) {
          dirRight = "DOWN";
          countInDir = 0;
          // Connecting end of horizontal tile moving right is its right half: [pos.x + pos.width - TILE_W, pos.x + pos.width]
          rightColCenterX = positions[i].x + positions[i].width - TILE_W / 2;
          currRightY = positions[i].y + positions[i].height + GAP;
        }
      } else if (dirRight === "DOWN") {
        countInDir++;
        const isVert = !isDouble; // regular tile is vertical, double is horizontal
        const w = isVert ? TILE_W : TILE_L;
        const h = isVert ? TILE_L : TILE_W;

        positions[i] = {
          tile: t,
          side: "RIGHT",
          x: rightColCenterX - w / 2,
          y: currRightY,
          width: w,
          height: h,
          isVertical: isVert,
          val1: t[0],
          val2: t[1],
        };

        currRightY += h + GAP;

        if (countInDir >= MAX_DOWN) {
          dirRight = "LEFT";
          countInDir = 0;
          // Connecting end of vertical tile moving down is its bottom half: [pos.y + pos.height - TILE_W, pos.y + pos.height]
          rightRowCenterY = positions[i].y + positions[i].height - TILE_W / 2;
          currRightX = positions[i].x - GAP;
        }
      } else if (dirRight === "LEFT") {
        countInDir++;
        const isVert = isDouble;
        const w = isVert ? TILE_W : TILE_L;
        const h = isVert ? TILE_L : TILE_W;

        positions[i] = {
          tile: t,
          side: "RIGHT",
          x: currRightX - w,
          y: rightRowCenterY - h / 2,
          width: w,
          height: h,
          isVertical: isVert,
          val1: t[1],
          val2: t[0],
        };

        currRightX -= (w + GAP);
      }
    }

    // Right end target button position
    const lastRightTile = positions[positions.length - 1];
    let rightTargetPos = { x: 0, y: 0 };
    if (lastRightDir === "RIGHT") {
      rightTargetPos = {
        x: lastRightTile.x + lastRightTile.width + GAP + 4,
        y: lastRightTile.y + (lastRightTile.height - 32) / 2,
      };
    } else if (lastRightDir === "DOWN") {
      rightTargetPos = {
        x: lastRightTile.x + (lastRightTile.width - 54) / 2,
        y: lastRightTile.y + lastRightTile.height + GAP + 4,
      };
    } else {
      rightTargetPos = {
        x: lastRightTile.x - 54 - GAP - 4,
        y: lastRightTile.y + (lastRightTile.height - 32) / 2,
      };
    }

    // Trace LEFT side (indices validStartIdx - 1 down to 0)
    const MAX_LEFT = 4;
    const MAX_UP = 2;

    let dirLeft: "LEFT" | "UP" | "RIGHT" = "LEFT";
    let countLeftInDir = 0;
    let lastLeftDir = "LEFT";

    let leftRowCenterY = 0;
    let leftColCenterX = 0;
    let currLeftX = positions[validStartIdx].x - GAP;
    let currLeftY = 0;

    for (let i = validStartIdx - 1; i >= 0; i--) {
      const t = boardTiles[i].tile;
      const isDouble = t[0] === t[1];
      lastLeftDir = dirLeft;

      if (dirLeft === "LEFT") {
        countLeftInDir++;
        const isVert = isDouble;
        const w = isVert ? TILE_W : TILE_L;
        const h = isVert ? TILE_L : TILE_W;

        positions[i] = {
          tile: t,
          side: "LEFT",
          x: currLeftX - w,
          y: leftRowCenterY - h / 2,
          width: w,
          height: h,
          isVertical: isVert,
          val1: t[0],
          val2: t[1],
        };

        currLeftX -= (w + GAP);

        if (countLeftInDir >= MAX_LEFT) {
          dirLeft = "UP";
          countLeftInDir = 0;
          // Connecting end of horizontal tile moving left is its left half: [pos.x, pos.x + TILE_W]
          leftColCenterX = positions[i].x + TILE_W / 2;
          currLeftY = positions[i].y - GAP;
        }
      } else if (dirLeft === "UP") {
        countLeftInDir++;
        const isVert = !isDouble;
        const w = isVert ? TILE_W : TILE_L;
        const h = isVert ? TILE_L : TILE_W;

        positions[i] = {
          tile: t,
          side: "LEFT",
          x: leftColCenterX - w / 2,
          y: currLeftY - h,
          width: w,
          height: h,
          isVertical: isVert,
          val1: t[0],
          val2: t[1],
        };

        currLeftY -= (h + GAP);

        if (countLeftInDir >= MAX_UP) {
          dirLeft = "RIGHT";
          countLeftInDir = 0;
          // Connecting end of vertical tile moving up is its top half: [pos.y, pos.y + TILE_W]
          leftRowCenterY = positions[i].y + TILE_W / 2;
          currLeftX = positions[i].x + positions[i].width + GAP;
        }
      } else if (dirLeft === "RIGHT") {
        countLeftInDir++;
        const isVert = isDouble;
        const w = isVert ? TILE_W : TILE_L;
        const h = isVert ? TILE_L : TILE_W;

        positions[i] = {
          tile: t,
          side: "LEFT",
          x: currLeftX,
          y: leftRowCenterY - h / 2,
          width: w,
          height: h,
          isVertical: isVert,
          val1: t[1],
          val2: t[0],
        };

        currLeftX += (w + GAP);
      }
    }

    // Left end target button position
    const lastLeftTile = positions[0];
    let leftTargetPos = { x: 0, y: 0 };
    if (lastLeftDir === "LEFT") {
      leftTargetPos = {
        x: lastLeftTile.x - 54 - GAP - 4,
        y: lastLeftTile.y + (lastLeftTile.height - 32) / 2,
      };
    } else if (lastLeftDir === "UP") {
      leftTargetPos = {
        x: lastLeftTile.x + (lastLeftTile.width - 54) / 2,
        y: lastLeftTile.y - 32 - GAP - 6,
      };
    } else {
      leftTargetPos = {
        x: lastLeftTile.x + lastLeftTile.width + GAP + 4,
        y: lastLeftTile.y + (lastLeftTile.height - 32) / 2,
      };
    }

    // Compute bounding box
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;

    for (const p of positions) {
      if (p.x < minX) minX = p.x;
      if (p.x + p.width > maxX) maxX = p.x + p.width;
      if (p.y < minY) minY = p.y;
      if (p.y + p.height > maxY) maxY = p.y + p.height;
    }

    // Include targets in bounds if active
    if (selectedTile && canPlayLeft) {
      minX = Math.min(minX, leftTargetPos.x - 10);
      maxX = Math.max(maxX, leftTargetPos.x + 60);
      minY = Math.min(minY, leftTargetPos.y - 10);
      maxY = Math.max(maxY, leftTargetPos.y + 40);
    }
    if (selectedTile && canPlayRight) {
      minX = Math.min(minX, rightTargetPos.x - 10);
      maxX = Math.max(maxX, rightTargetPos.x + 60);
      minY = Math.min(minY, rightTargetPos.y - 10);
      maxY = Math.max(maxY, rightTargetPos.y + 40);
    }

    // Add padding
    const PAD = 24;
    return {
      tiles: positions,
      bounds: {
        minX: minX - PAD,
        maxX: maxX + PAD,
        minY: minY - PAD,
        maxY: maxY + PAD,
      },
      leftTarget: leftTargetPos,
      rightTarget: rightTargetPos,
    };
  }, [boardTiles, selectedTile, canPlayLeft, canPlayRight]);

  const viewBoxWidth = Math.max(160, layout.bounds.maxX - layout.bounds.minX);
  const viewBoxHeight = Math.max(120, layout.bounds.maxY - layout.bounds.minY);

  if (boardTiles.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-4">
        {isMyTurn && selectedTile ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => onPlaySide("LEFT")}
            className="flex items-center gap-3 px-8 py-5 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-400/30 text-amber-100 hover:bg-amber-400/40 hover:scale-105 active:scale-95 transition font-black text-base shadow-2xl animate-pulse cursor-pointer backdrop-blur-md"
          >
            <span className="text-2xl">👇</span>
            <span>{lang === "ar" ? "ابدأ اللعب هنا" : "Play Start Tile"}</span>
            <span className="font-mono bg-black/40 px-3 py-1 rounded-xl text-amber-300 font-extrabold text-sm">
              [{selectedTile[0]}|{selectedTile[1]}]
            </span>
          </button>
        ) : (
          <div className="text-center space-y-2 opacity-80">
            <span className="text-4xl block">🀄</span>
            <p className="text-xs sm:text-sm font-semibold text-blue-200">
              {lang === "ar" ? "الطاولة فارغة، في انتظار أول حركة..." : "The table is empty. Waiting for first play..."}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-full relative flex items-center justify-center">
      <svg
        viewBox={`${layout.bounds.minX} ${layout.bounds.minY} ${viewBoxWidth} ${viewBoxHeight}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full max-h-full max-w-full drop-shadow-2xl overflow-visible select-none"
      >
        <defs>
          {/* Tile drop shadow filter */}
          <filter id="dominoShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.4" />
          </filter>

          {/* Ivory ceramic gradient */}
          <linearGradient id="dominoIvory" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#faf7f0" />
            <stop offset="100%" stopColor="#ede6d6" />
          </linearGradient>

          {/* Target button gradient */}
          <linearGradient id="targetGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>

        {/* Render Domino Chain */}
        {layout.tiles.map((t, idx) => {
          const isVert = t.isVertical;
          const halfSize = isVert ? t.height / 2 : t.width / 2;

          // Center coordinates for the two halves
          const c1x = isVert ? t.x + t.width / 2 : t.x + halfSize / 2;
          const c1y = isVert ? t.y + halfSize / 2 : t.y + t.height / 2;
          const c2x = isVert ? t.x + t.width / 2 : t.x + halfSize + halfSize / 2;
          const c2y = isVert ? t.y + halfSize + halfSize / 2 : t.y + t.height / 2;

          const pips1 = getPipCoordinates(t.val1, isVert);
          const pips2 = getPipCoordinates(t.val2, isVert);
          const pipRadius = Math.min(t.width, t.height) * 0.085;
          const pipSpread = Math.min(t.width, t.height) * 0.28;

          return (
            <g key={idx} filter="url(#dominoShadow)">
              {/* Tile Body */}
              <rect
                x={t.x}
                y={t.y}
                width={t.width}
                height={t.height}
                rx={4.5}
                ry={4.5}
                fill="url(#dominoIvory)"
                stroke="#cbd5e1"
                strokeWidth={1.2}
              />

              {/* Center Divider */}
              {isVert ? (
                <line
                  x1={t.x + 3}
                  y1={t.y + halfSize}
                  x2={t.x + t.width - 3}
                  y2={t.y + halfSize}
                  stroke="#94a3b8"
                  strokeWidth={1.4}
                />
              ) : (
                <line
                  x1={t.x + halfSize}
                  y1={t.y + 3}
                  x2={t.x + halfSize}
                  y2={t.y + t.height - 3}
                  stroke="#94a3b8"
                  strokeWidth={1.4}
                />
              )}

              {/* Center Pivot Pin */}
              <circle
                cx={t.x + t.width / 2}
                cy={t.y + t.height / 2}
                r={1.8}
                fill="#b45309"
              />

              {/* Pips Side 1 */}
              {pips1.map(([px, py], pIdx) => (
                <circle
                  key={`p1-${pIdx}`}
                  cx={c1x + px * pipSpread}
                  cy={c1y + py * pipSpread}
                  r={pipRadius}
                  fill="#18181b"
                />
              ))}

              {/* Pips Side 2 */}
              {pips2.map(([px, py], pIdx) => (
                <circle
                  key={`p2-${pIdx}`}
                  cx={c2x + px * pipSpread}
                  cy={c2y + py * pipSpread}
                  r={pipRadius}
                  fill="#18181b"
                />
              ))}
            </g>
          );
        })}

        {/* Interactive LEFT Play Target Button on Table */}
        {isMyTurn && selectedTile && canPlayLeft && layout.leftTarget && (
          <g
            onClick={() => !busy && onPlaySide("LEFT")}
            className="cursor-pointer transition hover:opacity-90 active:scale-95"
          >
            <rect
              x={layout.leftTarget.x}
              y={layout.leftTarget.y}
              width={54}
              height={32}
              rx={8}
              ry={8}
              fill="url(#targetGlow)"
              stroke="#fef08a"
              strokeWidth={2}
              strokeDasharray="4 2"
              filter="url(#dominoShadow)"
            >
              <animate attributeName="opacity" values="0.85;1;0.85" dur="1.2s" repeatCount="indefinite" />
            </rect>
            <text
              x={layout.leftTarget.x + 27}
              y={layout.leftTarget.y + 16}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#ffffff"
              fontSize={11}
              fontWeight="900"
              fontFamily="system-ui, sans-serif"
            >
              {lang === "ar" ? `👈 [${leftEnd}]` : `👈 [${leftEnd}]`}
            </text>
          </g>
        )}

        {/* Interactive RIGHT Play Target Button on Table */}
        {isMyTurn && selectedTile && canPlayRight && layout.rightTarget && (
          <g
            onClick={() => !busy && onPlaySide("RIGHT")}
            className="cursor-pointer transition hover:opacity-90 active:scale-95"
          >
            <rect
              x={layout.rightTarget.x}
              y={layout.rightTarget.y}
              width={54}
              height={32}
              rx={8}
              ry={8}
              fill="url(#targetGlow)"
              stroke="#fef08a"
              strokeWidth={2}
              strokeDasharray="4 2"
              filter="url(#dominoShadow)"
            >
              <animate attributeName="opacity" values="0.85;1;0.85" dur="1.2s" repeatCount="indefinite" />
            </rect>
            <text
              x={layout.rightTarget.x + 27}
              y={layout.rightTarget.y + 16}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#ffffff"
              fontSize={11}
              fontWeight="900"
              fontFamily="system-ui, sans-serif"
            >
              {lang === "ar" ? `[${rightEnd}] 👉` : `[${rightEnd}] 👉`}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
