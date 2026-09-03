import { env } from "@/lib/env";
import { ActiveSabahoQuestion, pickChallengeForRound, SabahoChallengeType } from "./sabaho-types";

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

async function callGeminiJson<T>(prompt: string, timeoutMs = 4500): Promise<T | null> {
  if (!hasConfiguredGeminiKey()) return null;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

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
          temperature: 0.7,
          maxOutputTokens: 1200,
        },
      }),
    });

    clearTimeout(timeoutId);
    if (!response.ok) return null;

    const data = await response.json();
    const rawText =
      data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("\n") ??
      "";
    if (!rawText.trim()) return null;

    const jsonStr = extractJsonObject(rawText);
    return JSON.parse(jsonStr) as T;
  } catch {
    return null;
  }
}

/**
 * Normalizes Arabic string for quick offline comparison
 */
export function normalizeArabic(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F]/g, "") // remove tashkeel
    .replace(/[إأآا]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[\s\-_]+/g, " ");
}

/**
 * Validates a user's guess against the footballer's name using Gemini + local fallback
 */
export async function validatePlayerGuessWithGemini({
  targetPlayerNameAr,
  targetPlayerNameEn,
  guess,
}: {
  targetPlayerNameAr: string;
  targetPlayerNameEn?: string;
  guess: string;
}): Promise<{ valid: boolean; explanation: string }> {
  const cleanGuess = guess.trim();
  if (!cleanGuess) return { valid: false, explanation: "لم يتم إدخال اسم للتخمين." };

  const normGuess = normalizeArabic(cleanGuess);
  const normAr = normalizeArabic(targetPlayerNameAr);
  const normEn = (targetPlayerNameEn || "").trim().toLowerCase();

  // 1. Direct local matching (full name, last name, or first name)
  if (normGuess === normAr || (normEn && cleanGuess.toLowerCase() === normEn)) {
    return { valid: true, explanation: "إجابة صحيحة ومطابقة تماماً!" };
  }

  // Check if guess matches individual name tokens (e.g. "صلاح" for "محمد صلاح", "زيزو" for "احمد سيد زيزو")
  const arTokens = normAr.split(" ").filter((t) => t.length > 2);
  if (arTokens.includes(normGuess)) {
    return { valid: true, explanation: `إجابة صحيحة! (${targetPlayerNameAr})` };
  }

  // 2. AI validation with Gemini (for nicknames, variations, and partial matches)
  if (hasConfiguredGeminiKey()) {
    const prompt = [
      "You are a strict referee in a football trivia challenge (صباحو تحدي).",
      `Target footballer name: "${targetPlayerNameAr}" (${targetPlayerNameEn || ""})`,
      `User's guess: "${cleanGuess}"`,
      "Task: Decide if the user's guess refers to the target footballer.",
      "Accept legitimate matches:",
      "- Full names, popular last names, or single names (e.g. 'صلاح' for 'محمد صلاح', 'هالاند' for 'إيرلينغ هالاند', 'مودريتش' for 'لوكا مودريتش').",
      "- Well-known iconic nicknames (e.g. 'زيزو' for 'أحمد سيد زيزو' or 'زين الدين زيدان' depending on target, 'الدون' or 'CR7' for 'كريستيانو رونالدو', 'البرغوث' for 'ميسي', 'الماجيكو' for 'محمد أبو تريكة', 'السد العالي' for 'عصام الحضري', 'الظاهرة' for 'رونالدو البرازيلي').",
      "- English and Arabic transliterations.",
      "Reject if it's a completely different player, vague term, or wrong person.",
      'Return ONLY a JSON object with this exact shape: {"valid": boolean, "explanation": string}',
    ].join("\n");

    const aiResult = await callGeminiJson<{ valid: boolean; explanation: string }>(prompt, 3000);
    if (aiResult && typeof aiResult.valid === "boolean") {
      return {
        valid: aiResult.valid,
        explanation: aiResult.explanation || (aiResult.valid ? "إجابة صحيحة!" : "إجابة غير صحيحة."),
      };
    }
  }

  return { valid: false, explanation: "إجابة غير متطابقة مع اللاعب المطلوب." };
}

/**
 * Dynamically generates a Sabaho Tahadi challenge using Gemini API, with offline fallback
 */
export async function generateSabahoChallenge(
  mode: "MIXED" | "AUCTION" | "CAREER_PATH" | "SPEED" | "PASSWORD",
  roundNumber: number,
  usedIds: string[] = [],
): Promise<ActiveSabahoQuestion> {
  // Determine challenge type
  let targetType: SabahoChallengeType;
  if (mode === "AUCTION") targetType = "AUCTION";
  else if (mode === "CAREER_PATH") targetType = "CAREER_PATH";
  else if (mode === "SPEED") targetType = "SPEED";
  else if (mode === "PASSWORD") targetType = "PASSWORD";
  else {
    const cycle: SabahoChallengeType[] = ["CAREER_PATH", "AUCTION", "PASSWORD", "SPEED"];
    targetType = cycle[(roundNumber - 1) % cycle.length];
  }

  // Attempt Gemini dynamic generation
  if (hasConfiguredGeminiKey()) {
    try {
      if (targetType === "CAREER_PATH") {
        const prompt = [
          "Generate a fun football career path challenge for Sabaho Tahadi (مسيرة اللاعب).",
          "Pick a well-known active or legendary football player (can be Egyptian, Arab, European, South American, African, etc.).",
          "Include all their senior clubs in chronological order with the years and country flag emojis.",
          'Return ONLY a JSON object with this exact shape:',
          '{',
          '  "playerNameAr": string (Arabic name, e.g. "محمد صلاح"),',
          '  "playerNameEn": string (English name, e.g. "Mohamed Salah"),',
          '  "nationality": string (e.g. "مصر"),',
          '  "nationalityFlag": string (e.g. "🇪🇬"),',
          '  "position": string (e.g. "جناح أيمن"),',
          '  "clubs": [',
          '    {"clubName": string, "year": string (e.g. "2010 - 2012"), "countryFlag": string (e.g. "🇪🇬")}',
          '  ]',
          '}',
        ].join("\n");

        const res = await callGeminiJson<{
          playerNameAr: string;
          playerNameEn: string;
          nationality: string;
          nationalityFlag: string;
          position: string;
          clubs: Array<{ clubName: string; year: string; countryFlag: string }>;
        }>(prompt, 4000);

        if (res?.playerNameAr && Array.isArray(res.clubs) && res.clubs.length >= 3) {
          return {
            type: "CAREER_PATH",
            roundNumber,
            career: {
              id: `gemini-car-${Date.now()}`,
              playerNameAr: res.playerNameAr,
              playerNameEn: res.playerNameEn || res.playerNameAr,
              nationality: res.nationality || "دولي",
              nationalityFlag: res.nationalityFlag || "⚽",
              position: res.position || "لاعب",
              clubs: res.clubs,
            },
          };
        }
      } else if (targetType === "AUCTION") {
        const prompt = [
          "Generate a creative football auction challenge topic for Sabaho Tahadi (المزاد).",
          "Examples: 'لاعبين سجلوا في نهائي دوري الأبطال', 'أندية إنجليزية فازت بألقاب أوروبية', 'لاعبين ارتدوا قميصي تشيلسي وأرسنال'.",
          "Provide 15-25 valid suggested answers in Arabic.",
          'Return ONLY a JSON object with this exact shape:',
          '{',
          '  "topicAr": string,',
          '  "topicEn": string,',
          '  "suggestedAnswers": string[]',
          '}',
        ].join("\n");

        const res = await callGeminiJson<{
          topicAr: string;
          topicEn: string;
          suggestedAnswers: string[];
        }>(prompt, 4000);

        if (res?.topicAr && Array.isArray(res.suggestedAnswers) && res.suggestedAnswers.length >= 8) {
          return {
            type: "AUCTION",
            roundNumber,
            auction: {
              id: `gemini-auc-${Date.now()}`,
              topicAr: res.topicAr,
              topicEn: res.topicEn || res.topicAr,
              suggestedAnswers: res.suggestedAnswers,
            },
          };
        }
      } else if (targetType === "PASSWORD") {
        const prompt = [
          "Generate 10 diverse football keywords for Sabaho Tahadi Password Game (كلمة السر).",
          "Include a mix of famous players, coaches, clubs, and football terms (e.g. ضربة جزاء, تسلل, الفار, الكلاسيكو).",
          'Return ONLY a JSON object with this exact shape:',
          '{',
          '  "words": [',
          '    {"wordAr": string, "wordEn": string, "category": "لاعب" | "مدرب" | "نادي" | "مصطلح" | "بطولة"}',
          '  ]',
          '}',
        ].join("\n");

        const res = await callGeminiJson<{
          words: Array<{
            wordAr: string;
            wordEn: string;
            category: "لاعب" | "مدرب" | "نادي" | "مصطلح" | "بطولة";
          }>;
        }>(prompt, 4000);

        if (Array.isArray(res?.words) && res.words.length >= 6) {
          return {
            type: "PASSWORD",
            roundNumber,
            passwordList: res.words.map((w, idx) => ({
              id: `gemini-pwd-${idx}-${Date.now()}`,
              wordAr: w.wordAr,
              wordEn: w.wordEn || w.wordAr,
              category: w.category || "لاعب",
            })),
            currentPasswordIndex: 0,
          };
        }
      } else if (targetType === "SPEED") {
        const prompt = [
          "Generate an exciting fast football challenge prompt for Sabaho Tahadi Speed Round (تحدي السرعة).",
          "Example: 'اذكر ٣ لاعبين هولنديين لعبوا في الدوري الإنجليزي' or 'اذكر ٣ أندية ألمانية غير بايرن ودورتموند'.",
          'Return ONLY a JSON object with this exact shape:',
          '{',
          '  "promptAr": string,',
          '  "promptEn": string,',
          '  "seconds": 5',
          '}',
        ].join("\n");

        const res = await callGeminiJson<{
          promptAr: string;
          promptEn: string;
          seconds: number;
        }>(prompt, 4000);

        if (res?.promptAr) {
          return {
            type: "SPEED",
            roundNumber,
            speed: {
              id: `gemini-spd-${Date.now()}`,
              promptAr: res.promptAr,
              promptEn: res.promptEn || res.promptAr,
              seconds: 5,
            },
          };
        }
      }
    } catch {
      // Fallback seamlessly to local data
    }
  }

  // Reliable offline fallback from curated database
  return pickChallengeForRound(mode, roundNumber, usedIds);
}
