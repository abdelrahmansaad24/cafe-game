import { env } from "@/lib/env";
import {
  BEKASA_CATEGORIES,
  CategoryDefinition,
  pickSecretWordAndCandidates,
  SecretWordPayload,
} from "./bekasa-words";

function extractJsonObject(rawText: string): string {
  const fencedMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const firstBrace = rawText.indexOf("{");
  const lastBrace = rawText.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return rawText.slice(firstBrace, lastBrace + 1);
  }

  return rawText.trim();
}

function hasConfiguredGeminiKey(): boolean {
  if (!env.GEMINI_API_KEY) return false;
  const key = env.GEMINI_API_KEY.trim();
  return key.length > 0 && !key.startsWith("replace-");
}

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

type GeminiBekasaResponse = {
  categoryNameAr: string;
  categoryNameEn: string;
  categoryIcon?: string;
  clusterTheme: string;
  secretWord: { ar: string; en: string };
  distractors: Array<{ ar: string; en: string }>;
};

/**
 * Generates dynamic, AI-powered secret words and candidate distractors for بكاسة (Bekasa)
 * with a resilient local fallback.
 */
export async function generateBekasaWordPayloadWithGemini(
  categoryId?: string,
): Promise<SecretWordPayload> {
  const matchedCategory = BEKASA_CATEGORIES.find((c) => c.id === categoryId);

  if (hasConfiguredGeminiKey()) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent`;

    const categoryHint = matchedCategory
      ? `Category requested: "${matchedCategory.nameAr}" (${matchedCategory.nameEn})`
      : "Category: Any creative, fun, highly recognizable theme for an Arabic cafe/party game (e.g. food, famous places, sports legends, movie tropes, daily habits, historic figures, tech tools).";

    const prompt = [
      'You are generating a secret word round for the party bluffing game "بكاسة" (Bekasa / Undercover).',
      "In this game, regular innocent players are given a secret word and must answer questions about it without revealing it directly.",
      "The undercover player (البكّاس) does NOT know the secret word and must pretend they do. At the end, the undercover tries to guess the secret word from a list of 8 closely related candidate choices.",
      `Context: ${categoryHint}`,
      "Task requirements:",
      "1. Pick a very specific, cohesive sub-theme/cluster (e.g. 'Egyptian street desserts', 'Legendary midfielders', 'Superheroes', 'Beach gear', 'Types of coffee').",
      "2. Pick exactly ONE secret word ({ ar: string, en: string }).",
      "3. Provide exactly 7 closely-related candidate distractors ({ ar: string, en: string }) that belong to the EXACT same narrow theme.",
      "Crucial: All 8 items must be in the same exact niche so that guessing which one was the secret word is challenging and fun!",
      'Return ONLY a JSON object with this exact shape:',
      '{',
      '  "categoryNameAr": string (e.g. "أكلات وحلويات"),',
      '  "categoryNameEn": string (e.g. "Foods & Desserts"),',
      '  "categoryIcon": string (emoji, e.g. "🍰"),',
      '  "clusterTheme": string (e.g. "حلويات شرقية"),',
      '  "secretWord": { "ar": string, "en": string },',
      '  "distractors": [',
      '    { "ar": string, "en": string } // exactly 7 distractors',
      '  ]',
      '}',
    ].join("\n");

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(endpoint, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": env.GEMINI_API_KEY!,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.75,
            maxOutputTokens: 800,
          },
        }),
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const rawText =
          data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("\n") ??
          "";

        if (rawText.trim()) {
          const parsed = JSON.parse(extractJsonObject(rawText)) as GeminiBekasaResponse;

          if (
            parsed.secretWord?.ar &&
            Array.isArray(parsed.distractors) &&
            parsed.distractors.length >= 5
          ) {
            const secret = {
              ar: parsed.secretWord.ar.trim(),
              en: parsed.secretWord.en?.trim() || parsed.secretWord.ar.trim(),
            };

            const distractors = parsed.distractors
              .filter((d) => d?.ar && d.ar.trim() !== secret.ar)
              .slice(0, 7)
              .map((d) => ({
                ar: d.ar.trim(),
                en: d.en?.trim() || d.ar.trim(),
              }));

            const allCandidates = shuffleArray([secret, ...distractors]);

            const dynamicCategory: CategoryDefinition = {
              id: matchedCategory ? matchedCategory.id : `ai-${Date.now()}`,
              nameAr: parsed.categoryNameAr || matchedCategory?.nameAr || "تحدي الذكاء الاصطناعي",
              nameEn: parsed.categoryNameEn || matchedCategory?.nameEn || "AI Challenge",
              icon: parsed.categoryIcon || matchedCategory?.icon || "🎭",
              clusters: [
                {
                  name: parsed.clusterTheme || "AI Cluster",
                  items: allCandidates,
                },
              ],
            };

            return {
              category: dynamicCategory,
              secretWord: secret,
              candidateWords: allCandidates,
            };
          }
        }
      }
    } catch {
      // Fall through to local fallback seamlessly
    }
  }

  // Resilient local fallback from curated database
  return pickSecretWordAndCandidates(categoryId);
}
