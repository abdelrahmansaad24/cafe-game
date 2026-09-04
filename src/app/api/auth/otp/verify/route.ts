import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { normalizePhoneNumber } from "@/lib/sms";

const verifyOtpSchema = z.object({
  phone: z.string().trim().min(8),
  code: z.string().trim().length(6, "Code must be 6 digits."),
});

export async function POST(request: Request) {
  try {
    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    const parsed = verifyOtpSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid input data.",
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { phone: rawPhone, code } = parsed.data;
    const phone = normalizePhoneNumber(rawPhone);
    const identifier = `phone_${phone}`;

    const tokenRecord = await prisma.verificationToken.findFirst({
      where: {
        identifier,
        token: code,
      },
    });

    if (!tokenRecord) {
      return NextResponse.json(
        { error: "Incorrect verification code. Please check your SMS and try again." },
        { status: 400 },
      );
    }

    if (new Date(tokenRecord.expires) < new Date()) {
      await prisma.verificationToken.deleteMany({
        where: { identifier },
      });
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new one." },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true, message: "Code verified successfully." });
  } catch (error) {
    console.error("[OTP Verify Error]:", error);
    return NextResponse.json(
      { error: "Could not verify code. Please try again." },
      { status: 500 },
    );
  }
}
