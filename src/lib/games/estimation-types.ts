export type Suit = "SPADES" | "HEARTS" | "DIAMONDS" | "CLUBS";
export type TrumpSuit = Suit | "NO_TRUMP";

export type EstimationCard = {
  id: string;
  suit: Suit;
  rank: number; // 2..14 (11=J, 12=Q, 13=K, 14=A)
  valueLabel: string; // "2".."10", "J", "Q", "K", "A"
  suitSymbol: string; // "♠", "♥", "♦", "♣"
  color: "red" | "black";
  nameAr: string;
};

export const SUIT_SYMBOLS: Record<Suit, string> = {
  SPADES: "♠",
  HEARTS: "♥",
  DIAMONDS: "♦",
  CLUBS: "♣",
};

export const SUIT_NAMES_AR: Record<TrumpSuit, string> = {
  SPADES: "بيك ♠",
  HEARTS: "كبة ♥",
  DIAMONDS: "كاروه ♦",
  CLUBS: "سنتر ♣",
  NO_TRUMP: "صن (بدون حُكم)",
};

export function generate52Deck(): EstimationCard[] {
  const suits: Suit[] = ["SPADES", "HEARTS", "DIAMONDS", "CLUBS"];
  const deck: EstimationCard[] = [];
  let id = 1;

  for (const suit of suits) {
    const symbol = SUIT_SYMBOLS[suit];
    const color = suit === "HEARTS" || suit === "DIAMONDS" ? "red" : "black";

    for (let rank = 2; rank <= 14; rank++) {
      let label = String(rank);
      let nameAr = `${rank} ${SUIT_NAMES_AR[suit]}`;

      if (rank === 11) {
        label = "J";
        nameAr = `ولد ${SUIT_NAMES_AR[suit]}`;
      } else if (rank === 12) {
        label = "Q";
        nameAr = `بنت ${SUIT_NAMES_AR[suit]}`;
      } else if (rank === 13) {
        label = "K";
        nameAr = `شايب ${SUIT_NAMES_AR[suit]}`;
      } else if (rank === 14) {
        label = "A";
        nameAr = `إس ${SUIT_NAMES_AR[suit]}`;
      }

      deck.push({
        id: `c-${id++}`,
        suit,
        rank,
        valueLabel: label,
        suitSymbol: symbol,
        color,
        nameAr,
      });
    }
  }

  return deck;
}

export function shuffleDeck<T>(cards: T[]): T[] {
  const result = [...cards];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function deal52Cards(deck: EstimationCard[]): [EstimationCard[], EstimationCard[], EstimationCard[], EstimationCard[]] {
  const shuffled = shuffleDeck(deck);
  // Sort each player's hand by suit and rank for nice display
  const hands: [EstimationCard[], EstimationCard[], EstimationCard[], EstimationCard[]] = [
    [], [], [], []
  ];

  for (let i = 0; i < 52; i++) {
    hands[i % 4].push(shuffled[i]);
  }

  const suitOrder: Record<Suit, number> = {
    SPADES: 0,
    HEARTS: 1,
    CLUBS: 2,
    DIAMONDS: 3,
  };

  hands.forEach((hand) => {
    hand.sort((a, b) => {
      if (suitOrder[a.suit] !== suitOrder[b.suit]) {
        return suitOrder[a.suit] - suitOrder[b.suit];
      }
      return b.rank - a.rank;
    });
  });

  return hands;
}

export function canPlayCard(
  card: EstimationCard,
  hand: EstimationCard[],
  leadSuit: string | null,
): boolean {
  if (!leadSuit) return true; // Leader can play any card

  const hasLeadSuit = hand.some((c) => c.suit === leadSuit);
  if (hasLeadSuit) {
    return card.suit === leadSuit; // Must follow suit!
  }

  // Doesn't have lead suit -> can play any card (Trump or discard)
  return true;
}

export function determineTrickWinner(
  trick: Array<{ playerId: string; card: EstimationCard }>,
  leadSuit: string,
  trumpSuit: TrumpSuit | null,
): { winningPlayerId: string; winningCard: EstimationCard } {
  let winningEntry = trick[0];

  for (let i = 1; i < trick.length; i++) {
    const current = trick[i];
    const winCard = winningEntry.card;
    const curCard = current.card;

    if (trumpSuit && trumpSuit !== "NO_TRUMP") {
      // If current is trump and winner is not trump
      if (curCard.suit === trumpSuit && winCard.suit !== trumpSuit) {
        winningEntry = current;
        continue;
      }
      // If both are trump
      if (curCard.suit === trumpSuit && winCard.suit === trumpSuit) {
        if (curCard.rank > winCard.rank) {
          winningEntry = current;
        }
        continue;
      }
    }

    // Neither is trump or trump didn't override: compare lead suit
    if (winCard.suit !== trumpSuit && curCard.suit === leadSuit) {
      if (winCard.suit !== leadSuit || curCard.rank > winCard.rank) {
        winningEntry = current;
      }
    }
  }

  return {
    winningPlayerId: winningEntry.playerId,
    winningCard: winningEntry.card,
  };
}

export function calculateRoundScores(
  players: Array<{ id: string; bid: number; tricksWon: number }>,
): Record<string, { roundPoints: number; isMade: boolean }> {
  const scores: Record<string, { roundPoints: number; isMade: boolean }> = {};

  for (const p of players) {
    const isMade = p.bid === p.tricksWon;
    let roundPoints = 0;

    if (isMade) {
      if (p.bid === 0) {
        roundPoints = 30; // Successful Dash!
      } else {
        roundPoints = 10 + p.bid * 10; // e.g. 3 made = 40 pts
      }
    } else {
      const diff = Math.abs(p.tricksWon - p.bid);
      if (p.bid === 0) {
        roundPoints = -30; // Failed Dash
      } else {
        roundPoints = -(diff * 10); // Penalty per difference
      }
    }

    scores[p.id] = { roundPoints, isMade };
  }

  return scores;
}
