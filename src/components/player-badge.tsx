"use client";

import { getPlayerColor } from "@/lib/player-colors";

interface PlayerBadgeProps {
  name: string;
  playerId?: string | null;
  userId?: string | null;
  isSelf?: boolean;
  isHost?: boolean;
  score?: number | null;
  scoreSuffix?: string;
  statusBadge?: string | null;
  statusColor?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  lang?: "en" | "ar";
}

export function PlayerBadge({
  name,
  playerId,
  userId,
  isSelf = false,
  isHost = false,
  score,
  scoreSuffix,
  statusBadge,
  statusColor,
  className = "",
  size = "md",
  lang = "en",
}: PlayerBadgeProps) {
  const color = getPlayerColor(playerId || userId || name);

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1.5",
    md: "px-2.5 py-1 text-sm gap-2",
    lg: "px-3.5 py-1.5 text-base gap-2.5 font-semibold",
  };

  const youLabel = lang === "ar" ? "(أنت)" : "(You)";

  return (
    <span
      className={`inline-flex items-center rounded-xl border font-medium transition ${color.bg} ${color.border} ${color.text} ${sizeClasses[size]} ${className}`}
    >
      <span className={`h-2 w-2 rounded-full shrink-0 ${color.dot}`} />
      <span className="truncate max-w-[140px] sm:max-w-[200px]">{name}</span>

      {isSelf && (
        <span className="shrink-0 rounded-md bg-zinc-900/10 dark:bg-white/20 px-1.5 py-0.2 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
          {youLabel}
        </span>
      )}

      {isHost && (
        <span className="shrink-0 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-1 py-0.2 text-[10px] font-bold">
          {lang === "ar" ? "المضيف" : "Host"}
        </span>
      )}

      {score !== undefined && score !== null && (
        <span className="shrink-0 font-mono font-bold text-xs opacity-90">
          [{score} {scoreSuffix ?? "pts"}]
        </span>
      )}

      {statusBadge && (
        <span
          className={`shrink-0 text-[11px] font-semibold ${
            statusColor ?? "text-red-600 dark:text-red-400"
          }`}
        >
          {statusBadge}
        </span>
      )}
    </span>
  );
}
