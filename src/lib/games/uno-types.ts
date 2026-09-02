export type UnoColor = "RED" | "BLUE" | "GREEN" | "YELLOW" | "WILD";

export type UnoValue =
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "SKIP"
  | "REVERSE"
  | "DRAW_TWO"
  | "WILD"
  | "WILD_DRAW_FOUR";

export interface UnoCard {
  id: string;
  color: UnoColor;
  value: UnoValue;
}

export const UNO_COLORS: Array<"RED" | "BLUE" | "GREEN" | "YELLOW"> = [
  "RED",
  "BLUE",
  "GREEN",
  "YELLOW",
];

export const UNO_COLOR_NAMES: Record<UnoColor, { en: string; ar: string; hex: string; bgClass: string }> = {
  RED: { en: "Red", ar: "أحمر", hex: "#E51B24", bgClass: "bg-red-600" },
  BLUE: { en: "Blue", ar: "أزرق", hex: "#0063B3", bgClass: "bg-blue-600" },
  GREEN: { en: "Green", ar: "أخضر", hex: "#009A44", bgClass: "bg-emerald-600" },
  YELLOW: { en: "Yellow", ar: "أصفر", hex: "#FFB800", bgClass: "bg-amber-400" },
  WILD: { en: "Wild", ar: "جوكر", hex: "#18181B", bgClass: "bg-zinc-900" },
};

export function isCardPlayable(
  card: UnoCard,
  activeColor: UnoColor | null,
  topCard: UnoCard | null,
): boolean {
  if (!topCard) return true;
  // Wild cards can always be played
  if (card.color === "WILD" || card.value === "WILD" || card.value === "WILD_DRAW_FOUR") {
    return true;
  }
  // Match current active color
  if (activeColor && card.color === activeColor) {
    return true;
  }
  // Match value or symbol of top card
  if (card.value === topCard.value) {
    return true;
  }
  return false;
}

export function getCardPointValue(card: UnoCard): number {
  if (card.value === "WILD" || card.value === "WILD_DRAW_FOUR") {
    return 50;
  }
  if (card.value === "SKIP" || card.value === "REVERSE" || card.value === "DRAW_TWO") {
    return 20;
  }
  return Number.parseInt(card.value, 10) || 0;
}

export function calculateUnoHandPoints(hand: UnoCard[]): number {
  return hand.reduce((sum, card) => sum + getCardPointValue(card), 0);
}
