export const ARABIC_LETTERS = [
  "أ", "ب", "ت", "ث", "ج", "ح", "خ", "د", "ذ", "ر", "ز", "س", "ش", "ص",
  "ض", "ط", "ظ", "ع", "غ", "ف", "ق", "ك", "ل", "م", "ن", "هـ", "و", "ي"
] as const;

export type ArabicLetter = typeof ARABIC_LETTERS[number];

export const AUTOBUS_CATEGORIES = [
  { id: "boy", labelAr: "ولد", labelEn: "Boy", icon: "👦" },
  { id: "girl", labelAr: "بنت", labelEn: "Girl", icon: "👧" },
  { id: "animal", labelAr: "حيوان", labelEn: "Animal", icon: "🦁" },
  { id: "plant", labelAr: "نبات", labelEn: "Plant", icon: "🌿" },
  { id: "item", labelAr: "جماد", labelEn: "Inanimate", icon: "📦" },
  { id: "country", labelAr: "بلاد", labelEn: "Country/City", icon: "🌍" },
  { id: "food", labelAr: "أكلة", labelEn: "Food/Meal", icon: "🍲" },
] as const;

export type AutobusCategoryId = typeof AUTOBUS_CATEGORIES[number]["id"];
export type AutobusAnswers = Record<string, string>;

export function normalizeArabicWord(word: string): string {
  if (!word) return "";
  return word
    .trim()
    .replace(/[\u064B-\u065F\u0670]/g, "") // remove tashkeel
    .replace(/[أإآ]/g, "ا") // normalize alef
    .replace(/ة/g, "ه") // normalize teh marbuta
    .replace(/ى/g, "ي") // normalize alef maksura
    .toLowerCase();
}

export function doesWordStartWithLetter(word: string, targetLetter: string): boolean {
  if (!word || !targetLetter) return false;
  const cleanWord = word.trim().replace(/^ال/, ""); // optionally ignore "ال" definition
  const rawClean = word.trim();
  const normTarget = normalizeArabicWord(targetLetter);
  const normWord = normalizeArabicWord(cleanWord);
  const normRaw = normalizeArabicWord(rawClean);

  return normWord.startsWith(normTarget) || normRaw.startsWith(normTarget);
}

export function pickNextLetter(usedLetters: string[]): string {
  const unused = ARABIC_LETTERS.filter((l) => !usedLetters.includes(l));
  const pool = unused.length > 0 ? unused : [...ARABIC_LETTERS];
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}

export type EvaluatedCategoryAnswer = {
  raw: string;
  points: number; // 0, 5, or 10
  isUnique: boolean;
  isValid: boolean;
  duplicateWithCount: number;
};

export function evaluateRoundAnswers(
  currentLetter: string,
  playersAnswers: Array<{ playerId: string; answers: AutobusAnswers }>,
): Record<string, { categoryScores: Record<string, EvaluatedCategoryAnswer>; totalRoundPoints: number }> {
  const results: Record<
    string,
    { categoryScores: Record<string, EvaluatedCategoryAnswer>; totalRoundPoints: number }
  > = {};

  // Initialize results
  playersAnswers.forEach((p) => {
    results[p.playerId] = { categoryScores: {}, totalRoundPoints: 0 };
  });

  for (const cat of AUTOBUS_CATEGORIES) {
    const wordOccurrences = new Map<string, string[]>(); // normalizedWord -> playerIds[]

    playersAnswers.forEach((p) => {
      const raw = (p.answers[cat.id] || "").trim();
      const isValid = raw.length > 0 && doesWordStartWithLetter(raw, currentLetter);
      const norm = normalizeArabicWord(raw);

      if (isValid && norm) {
        const existing = wordOccurrences.get(norm) || [];
        existing.push(p.playerId);
        wordOccurrences.set(norm, existing);
      }
    });

    playersAnswers.forEach((p) => {
      const raw = (p.answers[cat.id] || "").trim();
      const isValid = raw.length > 0 && doesWordStartWithLetter(raw, currentLetter);
      const norm = normalizeArabicWord(raw);

      let points = 0;
      let isUnique = false;
      let duplicateWithCount = 0;

      if (isValid && norm) {
        const matchingPlayers = wordOccurrences.get(norm) || [];
        duplicateWithCount = matchingPlayers.length - 1;

        if (duplicateWithCount === 0) {
          points = 10;
          isUnique = true;
        } else {
          points = 5;
          isUnique = false;
        }
      }

      results[p.playerId].categoryScores[cat.id] = {
        raw,
        points,
        isUnique,
        isValid,
        duplicateWithCount,
      };
      results[p.playerId].totalRoundPoints += points;
    });
  }

  return results;
}
