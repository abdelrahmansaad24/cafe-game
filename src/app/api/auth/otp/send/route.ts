import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { formatE164Phone, normalizePhoneNumber, sendSmsVerifyCode } from "@/lib/sms";

const sendOtpSchema = z.object({
  phone: z.string().trim().min(8, "Phone number is too short."),
  purpose: z.enum(["SIGNUP", "RESET_PASSWORD"]),
});

export async function POST(request: Request) {
  try {
    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    const parsed = sendOtpSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid input data.",
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { phone: rawPhone, purpose } = parsed.data;
    const phone = normalizePhoneNumber(rawPhone);

    if (!phone || phone.length < 9) {
      return NextResponse.json(
        { error: "Please enter a valid phone number with country code (e.g. 01xxxxxxxxx or +201xxxxxxxxx)." },
        { status: 400 },
      );
    }

    // Check existing user
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phone },
          { email: `${phone}@phone.cafegames` },
        ],
      },
      select: { id: true },
    });

    if (purpose === "SIGNUP" && existingUser) {
      return NextResponse.json(
        { error: "An account with this phone number already exists. Please sign in instead." },
        { status: 409 },
      );
    }

    if (purpose === "RESET_PASSWORD" && !existingUser) {
      return NextResponse.json(
        { error: "No account found associated with this phone number." },
        { status: 404 },
      );
    }

    // Generate 6-digit numeric OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    const identifier = `phone_${phone}`;

    // Clean up old tokens for this phone
    await prisma.verificationToken.deleteMany({
      where: { identifier },
    });

    // Save token in DB
    await prisma.verificationToken.create({
      data: {
        identifier,
        token: otpCode,
        expires,
      },
    });

    // Dispatch via RapidAPI sms-verify3
    await sendSmsVerifyCode({
      phone,
      code: otpCode,
      purpose,
    });

    const isDev = process.env.NODE_ENV !== "production";

    return NextResponse.json({
      ok: true,
      message: isDev
        ? `Verification code generated for ${formatE164Phone(phone)}. (Code: ${otpCode} - check terminal/SMS)`
        : `Verification code sent via SMS to ${formatE164Phone(phone)}.`,
      phone,
      ...(isDev ? { devOtpCode: otpCode } : {}),
    });
  } catch (error) {
    console.error("[OTP Send Error]:", error);
    return NextResponse.json(
      { error: "Could not send verification code. Please try again." },
      { status: 500 },
    );
  }
}
