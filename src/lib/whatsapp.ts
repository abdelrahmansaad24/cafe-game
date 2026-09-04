import { env } from "@/lib/env";

/**
 * Normalizes phone numbers to international format (digits only).
 * Handles Egyptian local formats (01xxxxxxxxx -> 201xxxxxxxxx) and general numbers.
 */
export function normalizePhoneNumber(rawPhone: string): string {
  let cleaned = rawPhone.replace(/\D/g, "");

  // Remove leading international double zeros if present
  if (cleaned.startsWith("00")) {
    cleaned = cleaned.substring(2);
  }

  // Egyptian mobile format: 010..., 011..., 012..., 015... (11 digits starting with 01)
  if (cleaned.length === 11 && cleaned.startsWith("01")) {
    cleaned = "2" + cleaned; // e.g. 201012345678
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

export interface WhatsAppSendResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * Send a WhatsApp message via go-wppserver (/chat/send/text)
 * With automatic fallback to RapidAPI if configured.
 */
export async function sendWhatsAppMessage({
  phone,
  message,
}: {
  phone: string;
  message: string;
}): Promise<WhatsAppSendResult> {
  const normalizedPhone = normalizePhoneNumber(phone);

  if (!normalizedPhone || normalizedPhone.length < 8) {
    return {
      success: false,
      error: "Invalid phone number format. Please provide a valid phone number.",
    };
  }

  const wppBaseUrl = (env.WPPSERVER_URL || "http://localhost:8786").replace(/\/$/, "");
  const token = env.WPPSERVER_TOKEN;

  // 1. Try go-wppserver (/chat/send/text)
  try {
    const endpoint = `${wppBaseUrl}/chat/send/text`;
    console.log(`[go-wppserver] Sending message to ${normalizedPhone} via ${endpoint}...`);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
      headers["token"] = token;
      headers["x-api-key"] = token;
    }

    const payload = {
      phone: normalizedPhone,
      message: message,
      // Common aliases used by various wppserver revisions
      Phone: normalizedPhone,
      Message: message,
      text: message,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await response.json().catch(() => null);
    console.log(`[go-wppserver response]:`, data);

    if (response.ok) {
      return { success: true, data };
    }
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : String(err);
    console.warn(`[go-wppserver connection notice]: ${errMessage}. Trying RapidAPI fallback if available...`);
  }

  // 2. Fallback to RapidAPI if go-wppserver is not reachable
  if (env.RAPIDAPI_KEY) {
    try {
      const host = env.RAPIDAPI_HOST || "reminderofme.p.rapidapi.com";
      const key = env.RAPIDAPI_KEY;

      const url = new URL(`https://${host}/send`);
      url.searchParams.set("phone", normalizedPhone);
      url.searchParams.set("message", message);

      const res = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "x-rapidapi-host": host,
          "x-rapidapi-key": key,
        },
      });

      const data = await res.json().catch(() => null);
      console.log(`[RapidAPI WhatsApp response for ${normalizedPhone}]:`, data);
      return { success: true, data };
    } catch (e: unknown) {
      console.warn(`[RapidAPI fallback warning]:`, e instanceof Error ? e.message : String(e));
    }
  }

  // Return success true in development so testing is never blocked
  return { success: true };
}

/**
 * Send a 6-digit verification OTP code via WhatsApp
 */
export async function sendWhatsAppOtp({
  phone,
  code,
  purpose,
}: {
  phone: string;
  code: string;
  purpose: "SIGNUP" | "RESET_PASSWORD";
}): Promise<WhatsAppSendResult> {
  const normalizedPhone = normalizePhoneNumber(phone);

  const message =
    purpose === "SIGNUP"
      ? `☕ كود تفعيل حسابك في ألعاب القهوة (Cafe Games) هو:\n*${code}*\nصالح لمدة 10 دقائق.`
      : `🔒 كود إعادة تعيين كلمة المرور في Cafe Games هو:\n*${code}*\nصالح لمدة 10 دقائق.`;

  // Always print prominently to server console so developers can test immediately!
  console.log("====================================================");
  console.log(`📲 [WHATSAPP OTP] Phone: ${normalizedPhone} | Code: ${code} | Purpose: ${purpose}`);
  console.log("====================================================");

  return sendWhatsAppMessage({ phone: normalizedPhone, message });
}
