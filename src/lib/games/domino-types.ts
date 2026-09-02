export type DominoTile = [number, number];

export interface BoardTile {
  tile: DominoTile;
  side: "LEFT" | "RIGHT" | "START";
  openVal: number;
}

// Cafe rounding rule: <= 5 rounds down, >= 6 rounds up to nearest 10
export function roundCafeScore(rawScore: number): number {
  if (rawScore <= 5) return 0;
  const remainder = rawScore % 10;
  const base = Math.floor(rawScore / 10) * 10;
  return remainder >= 6 ? base + 10 : base;
}

export function isTilePlayable(
  tile: DominoTile,
  leftEnd: number | null,
  rightEnd: number | null,
): { canPlayLeft: boolean; canPlayRight: boolean; isPlayable: boolean } {
  if (leftEnd === null || rightEnd === null) {
    return { canPlayLeft: true, canPlayRight: true, isPlayable: true };
  }
  const [a, b] = tile;
  const canPlayLeft = a === leftEnd || b === leftEnd;
  const canPlayRight = a === rightEnd || b === rightEnd;
  return {
    canPlayLeft,
    canPlayRight,
    isPlayable: canPlayLeft || canPlayRight,
  };
}

export function calculateHandPips(hand: DominoTile[]): number {
  return hand.reduce((sum, [a, b]) => sum + a + b, 0);
}
