import { env } from "@/lib/env";
import { validateCountryLocally } from "@/lib/countries";

export type CountryValidationResult = {
  valid: boolean;
  normalizedName?: string;
  explanation: string;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

function extractJsonObject(rawText: string) {
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

export async function validateCountryNameWithGemini(
  countryName: string,
): Promise<CountryValidationResult> {
  const trimmed = countryName.trim();
  if (!trimmed) {
    return { valid: false, explanation: "Country name is empty." };
  }

  // 1. Fast, instant check against local offline country dictionary
  const localResult = validateCountryLocally(trimmed);
  if (localResult.valid) {
    return localResult;
  }

  // 2. If local lookup didn't match and no valid Gemini key is present, return local result
  if (!hasConfiguredGeminiKey()) {
    return localResult;
  }

  const prompt = [
    "You are validating a game word.",
    "Return JSON only with this exact shape:",
    '{"valid": boolean, "normalizedName": string, "explanation": string}',
    "Rules:",
    `- Candidate word: "${trimmed}"`,
    "- valid=true only if the candidate is an existing sovereign country name in Arabic or English.",
    "- Reject cities, regions, adjectives, historic-only entities, and misspellings.",
    "- explanation should be one short sentence.",
  ].join("\n");

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

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
          temperature: 0,
          topP: 0.1,
          maxOutputTokens: 200,
        },
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return localResult;
    }

    const responseBody = (await response.json()) as GeminiResponse;
    const rawText =
      responseBody.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("\n") ??
      "";
    if (!rawText.trim()) {
      return localResult;
    }

    const parsed = JSON.parse(extractJsonObject(rawText)) as Partial<CountryValidationResult>;
    if (typeof parsed.valid !== "boolean" || typeof parsed.explanation !== "string") {
      return localResult;
    }

    return {
      valid: parsed.valid,
      normalizedName: typeof parsed.normalizedName === "string" ? parsed.normalizedName : undefined,
      explanation: parsed.explanation,
    };
  } catch {
    // If Gemini timed out or failed, silently fallback to local validator
    return localResult;
  }
}
