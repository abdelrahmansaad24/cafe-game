import { NextResponse } from "next/server";
import { z } from "zod";

import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { normalizePhoneNumber } from "@/lib/sms";

const resetPasswordSchema = z.object({
  phone: z.string().trim().min(8, "Phone number is required."),
  otpCode: z.string().trim().length(6, "Verification code must be 6 digits."),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters long.")
    .max(128, "Password cannot exceed 128 characters."),
});

export async function POST(request: Request) {
  try {
    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    const parsed = resetPasswordSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid input data.",
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { phone: rawPhone, otpCode, newPassword } = parsed.data;
    const phone = normalizePhoneNumber(rawPhone);

    const identifier = `reset_phone_${phone}`;

    // 1. Verify OTP token
    const tokenRecord = await prisma.verificationToken.findFirst({
      where: {
        identifier,
        token: otpCode,
      },
    });

    if (!tokenRecord) {
      return NextResponse.json(
        { error: "Incorrect verification code. Please check your WhatsApp and try again." },
        { status: 400 },
      );
    }

    if (new Date(tokenRecord.expires) < new Date()) {
      await prisma.verificationToken.deleteMany({
        where: { identifier },
      });
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new code." },
        { status: 400 },
      );
    }

    // 2. Find user
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone },
          { email: `${phone}@phone.cafegames` },
        ],
      },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User account not found." }, { status: 404 });
    }

    // 3. Hash and update password
    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // 4. Invalidate used token
    await prisma.verificationToken.deleteMany({
      where: { identifier },
    });

    return NextResponse.json({
      ok: true,
      message: "Password updated successfully. You can now sign in with your new password.",
    });
  } catch (error) {
    console.error("[ResetPassword Error]:", error);
    return NextResponse.json(
      { error: "Could not reset password. Please try again later." },
      { status: 500 },
    );
  }
}
