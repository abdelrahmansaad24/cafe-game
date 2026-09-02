export type ScrewCardType =
  | "NUMBER"
  | "PEEK_SELF" // 7 & 8 (بص في ورقتك)
  | "PEEK_OTHER" // 9 & 10 (بص في ورقة غيرك)
  | "SWAP" // خد وهات (تبديل عشوائي)
  | "PING_PONG" // بينج بونج (شوف كرتك وكرت غيرك وقرر تبدل ولا لأ)
  | "THE_THIEF" // الحرامي (اكشف كرت خصم واسرقه واعطيه كرتك)
  | "SPY_ALL"; // كعب داير (شوف كرت من كل لاعب)

export interface ScrewCard {
  id: string;
  value: number; // Score value (Red King = 0, Black King = 13, Ping Pong = 10, etc.)
  type: ScrewCardType;
  label: string; // e.g. "0", "7", "K♥", "Ping Pong 🏓"
  suit?: "HEARTS" | "DIAMONDS" | "SPADES" | "CLUBS" | "SPECIAL";
  actionNameEn: string;
  actionNameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  isAction: boolean;
}

export interface ScrewCardSlot {
  id: string; // unique slot identifier
  card: ScrewCard;
  slotIndex: number; // 0..3 or 0..5
  revealedToUserIds: string[]; // List of users who have peeked this card
}

export const SCREW_ACTION_DETAILS: Record<
  ScrewCardType,
  { en: string; ar: string; icon: string; descEn: string; descAr: string }
> = {
  NUMBER: {
    en: "Number Card",
    ar: "كرت أرقام",
    icon: "🔢",
    descEn: "Value card to keep in grid",
    descAr: "كرت أرقام للمجموع",
  },
  PEEK_SELF: {
    en: "Peek Self (بص في ورقتك)",
    ar: "بص في ورقتك",
    icon: "👁️",
    descEn: "Look privately at one of your own cards",
    descAr: "شاهد أحد كروتك المغطاة في السر",
  },
  PEEK_OTHER: {
    en: "Peek Opponent (بص في ورقة غيرك)",
    ar: "بص في ورقة غيرك",
    icon: "🕵️",
    descEn: "Look privately at any opponent's card",
    descAr: "شاهد أحد كروت أي خصم في السر",
  },
  SWAP: {
    en: "Blind Swap (خد وهات)",
    ar: "خد وهات (تبديل)",
    icon: "🔁",
    descEn: "Blindly swap one of your cards with an opponent's card",
    descAr: "بدل أحد كروتك مع كرت خصم على عماك دون كشف",
  },
  PING_PONG: {
    en: "Ping Pong (بينج بونج)",
    ar: "بينج بونج 🏓",
    icon: "🏓",
    descEn: "Look at your card & opponent's card, then choose whether to swap them!",
    descAr: "اكشف كرتك وكرت خصمك في السر وقرر هل تبدلهم أو تتركهم!",
  },
  THE_THIEF: {
    en: "The Thief (الحرامي)",
    ar: "الحرامي 🦹",
    icon: "🦹",
    descEn: "Peek at an opponent's card, steal it into your grid, and give them your unwanted card!",
    descAr: "اكشف كرت من عند أي خصم واسرقه لشبكتك واعطيه كرتك غير المرغوب فيه!",
  },
  SPY_ALL: {
    en: "Spy All (كعب داير)",
    ar: "كعب داير",
    icon: "🎡",
    descEn: "Look at one card from each opponent at the table",
    descAr: "شاهد كرت واحد من كل لاعب على الطاولة",
  },
};

export function isBasraMatch(a: ScrewCard, b: ScrewCard): boolean {
  if (!a || !b) return false;
  // Special Egyptian Screw rule: 0 can Basra with 20 / 25 (Black King) and vice versa!
  if (a.value === 0 && (b.value === 20 || b.value === 25)) return true;
  if ((a.value === 20 || a.value === 25) && b.value === 0) return true;

  // Exact value match (e.g. 1 with 1, 6 with 6)
  if (a.value === b.value) return true;

  // Action card type match (e.g. Ping Pong with Ping Pong, Thief with Thief)
  if (a.type !== "NUMBER" && a.type === b.type) return true;

  return false;
}

export function calculateGridPoints(grid: Array<{ card: ScrewCard }>): number {
  return grid.reduce((sum, item) => sum + item.card.value, 0);
}
