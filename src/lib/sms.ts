import { env } from "@/lib/env";

/**
 * Normalizes phone numbers to international digits only (e.g. 201154154046).
 */
export function normalizePhoneNumber(rawPhone: string): string {
  let cleaned = rawPhone.replace(/\D/g, "");

  if (cleaned.startsWith("00")) {
    cleaned = cleaned.substring(2);
  }

  // Egyptian mobile numbers (010, 011, 012, 015)
  if (cleaned.length === 11 && cleaned.startsWith("01")) {
    cleaned = "2" + cleaned;
  } else if (
    cleaned.length === 10 &&
    (cleaned.startsWith("10") ||
      cleaned.startsWith("11") ||
      cleaned.startsWith("12") ||
      cleaned.startsWith("15"))
  ) {
    cleaned = "20" + cleaned;
  }

  return cleaned;
}

/**
 * Format to E.164 with plus sign (+201154154046).
 */
export function formatE164Phone(rawPhone: string): string {
  const digits = normalizePhoneNumber(rawPhone);
  return `+${digits}`;
}

export interface SmsSendResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * Send an SMS numeric verification code using RapidAPI sms-verify3
 */
export async function sendSmsVerifyCode({
  phone,
  code,
  purpose,
}: {
  phone: string;
  code: string;
  purpose: "SIGNUP" | "RESET_PASSWORD";
}): Promise<SmsSendResult> {
  const digits = normalizePhoneNumber(phone);
  const target = formatE164Phone(phone);

  // Print prominently to server terminal for development/testing
  console.log("====================================================");
  console.log(`📲 [SMS OTP] Phone: ${target} (${digits}) | Code: ${code} | Purpose: ${purpose}`);
  console.log("====================================================");

  const key = env.RAPIDAPI_KEY || "b11dad0d71msh1756e7c1538015dp161a84jsndec32d3224f9";
  const url = "https://sms-verify3.p.rapidapi.com/send-numeric-verify";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "x-rapidapi-key": key,
        "x-rapidapi-host": "sms-verify3.p.rapidapi.com",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target,
        estimate: false,
      }),
    });

    const result = await response.text();
    console.log(`[sms-verify3 response for ${target}]:`, result);

    let parsed: unknown = null;
    try {
      parsed = JSON.parse(result);
    } catch {
      parsed = result;
    }

    return {
      success: true,
      data: parsed,
    };
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : String(err);
    console.warn(`[sms-verify3 error for ${target}]:`, errMessage);
    return { success: false, error: errMessage };
  }
}
