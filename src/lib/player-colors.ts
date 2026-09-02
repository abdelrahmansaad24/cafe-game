// Deterministic vibrant color palettes for player names and badges

export interface PlayerColorTheme {
  bg: string;
  text: string;
  border: string;
  dot: string;
  glow: string;
  rawHex: string;
}

export const PLAYER_COLOR_PALETTES: PlayerColorTheme[] = [
  {
    bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-500/30 dark:border-emerald-500/40",
    dot: "bg-emerald-500",
    glow: "shadow-emerald-500/20",
    rawHex: "#10b981",
  },
  {
    bg: "bg-violet-500/10 dark:bg-violet-500/20",
    text: "text-violet-700 dark:text-violet-300",
    border: "border-violet-500/30 dark:border-violet-500/40",
    dot: "bg-violet-500",
    glow: "shadow-violet-500/20",
    rawHex: "#8b5cf6",
  },
  {
    bg: "bg-amber-500/10 dark:bg-amber-500/20",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-500/30 dark:border-amber-500/40",
    dot: "bg-amber-500",
    glow: "shadow-amber-500/20",
    rawHex: "#f59e0b",
  },
  {
    bg: "bg-rose-500/10 dark:bg-rose-500/20",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-500/30 dark:border-rose-500/40",
    dot: "bg-rose-500",
    glow: "shadow-rose-500/20",
    rawHex: "#f43f5e",
  },
  {
    bg: "bg-cyan-500/10 dark:bg-cyan-500/20",
    text: "text-cyan-700 dark:text-cyan-300",
    border: "border-cyan-500/30 dark:border-cyan-500/40",
    dot: "bg-cyan-500",
    glow: "shadow-cyan-500/20",
    rawHex: "#06b6d4",
  },
  {
    bg: "bg-indigo-500/10 dark:bg-indigo-500/20",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-500/30 dark:border-indigo-500/40",
    dot: "bg-indigo-500",
    glow: "shadow-indigo-500/20",
    rawHex: "#6366f1",
  },
  {
    bg: "bg-fuchsia-500/10 dark:bg-fuchsia-500/20",
    text: "text-fuchsia-700 dark:text-fuchsia-300",
    border: "border-fuchsia-500/30 dark:border-fuchsia-500/40",
    dot: "bg-fuchsia-500",
    glow: "shadow-fuchsia-500/20",
    rawHex: "#d946ef",
  },
  {
    bg: "bg-sky-500/10 dark:bg-sky-500/20",
    text: "text-sky-700 dark:text-sky-300",
    border: "border-sky-500/30 dark:border-sky-500/40",
    dot: "bg-sky-500",
    glow: "shadow-sky-500/20",
    rawHex: "#0ea5e9",
  },
  {
    bg: "bg-teal-500/10 dark:bg-teal-500/20",
    text: "text-teal-700 dark:text-teal-300",
    border: "border-teal-500/30 dark:border-teal-500/40",
    dot: "bg-teal-500",
    glow: "shadow-teal-500/20",
    rawHex: "#14b8a6",
  },
  {
    bg: "bg-orange-500/10 dark:bg-orange-500/20",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-500/30 dark:border-orange-500/40",
    dot: "bg-orange-500",
    glow: "shadow-orange-500/20",
    rawHex: "#f97316",
  },
  {
    bg: "bg-pink-500/10 dark:bg-pink-500/20",
    text: "text-pink-700 dark:text-pink-300",
    border: "border-pink-500/30 dark:border-pink-500/40",
    dot: "bg-pink-500",
    glow: "shadow-pink-500/20",
    rawHex: "#ec4899",
  },
  {
    bg: "bg-lime-500/10 dark:bg-lime-500/20",
    text: "text-lime-700 dark:text-lime-300",
    border: "border-lime-500/30 dark:border-lime-500/40",
    dot: "bg-lime-500",
    glow: "shadow-lime-500/20",
    rawHex: "#84cc16",
  },
];

export function getPlayerColor(identifier: string | null | undefined): PlayerColorTheme {
  if (!identifier) {
    return PLAYER_COLOR_PALETTES[0];
  }
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = (hash << 5) - hash + identifier.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % PLAYER_COLOR_PALETTES.length;
  return PLAYER_COLOR_PALETTES[index];
}
