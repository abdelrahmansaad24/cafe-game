export const PINGO_LETTERS = ["P", "I", "N", "G", "O"] as const;
export type PingoLetter = typeof PINGO_LETTERS[number];

export const PINGO_LINES: number[][] = [
  // 5 Rows
  [0, 1, 2, 3, 4],
  [5, 6, 7, 8, 9],
  [10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19],
  [20, 21, 22, 23, 24],
  // 5 Columns
  [0, 5, 10, 15, 20],
  [1, 6, 11, 16, 21],
  [2, 7, 12, 17, 22],
  [3, 8, 13, 18, 23],
  [4, 9, 14, 19, 24],
  // 2 Diagonals
  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20],
];

export function generateRandomPingoCard(): number[] {
  const numbers = Array.from({ length: 25 }, (_, i) => i + 1);
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }
  return numbers;
}

export function validatePingoCard(grid: number[]): boolean {
  if (!Array.isArray(grid) || grid.length !== 25) return false;
  const unique = new Set(grid);
  if (unique.size !== 25) return false;
  for (let i = 1; i <= 25; i++) {
    if (!unique.has(i)) return false;
  }
  return true;
}

export function calculateCompletedLines(
  gridNumbers: number[],
  calledNumbers: number[],
): {
  completedLinesCount: number;
  completedLineIndices: number[][];
  scratchedCellIndices: Set<number>;
  letters: string;
  isPingoReady: boolean;
} {
  const calledSet = new Set(calledNumbers);
  const scratchedCellIndices = new Set<number>();

  gridNumbers.forEach((num, index) => {
    if (calledSet.has(num)) {
      scratchedCellIndices.add(index);
    }
  });

  const completedLineIndices: number[][] = [];

  for (const line of PINGO_LINES) {
    const isLineComplete = line.every((cellIndex) =>
      scratchedCellIndices.has(cellIndex),
    );
    if (isLineComplete) {
      completedLineIndices.push(line);
    }
  }

  const count = completedLineIndices.length;
  let letters = "";
  if (count >= 1) letters += "P";
  if (count >= 2) letters += "I";
  if (count >= 3) letters += "N";
  if (count >= 4) letters += "G";
  if (count >= 5) letters += "O";

  return {
    completedLinesCount: count,
    completedLineIndices,
    scratchedCellIndices,
    letters,
    isPingoReady: count >= 5,
  };
}
