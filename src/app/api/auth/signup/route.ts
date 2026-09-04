import { NextResponse } from "next/server";

import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validation/auth";
import { normalizePhoneNumber } from "@/lib/sms";

export async function POST(request: Request) {
  try {
    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    const parsedPayload = signupSchema.safeParse(payload);
    if (!parsedPayload.success) {
      return NextResponse.json(
        {
          error: "Invalid signup data.",
          issues: parsedPayload.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { phone: rawPhone, otpCode, password, name } = parsedPayload.data;
    const phone = normalizePhoneNumber(rawPhone);

    if (!phone || phone.length < 9) {
      return NextResponse.json(
        { error: "Please enter a valid phone number (e.g. 01xxxxxxxxx or +201xxxxxxxxx)." },
        { status: 400 },
      );
    }

    // 1. Verify OTP code
    const identifier = `phone_${phone}`;
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

    // 2. Check if phone is already registered
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phone },
          { email: `${phone}@phone.cafegames` },
        ],
      },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this WhatsApp number already exists. Please sign in." },
        { status: 409 },
      );
    }

    // 3. Hash password and create user
    const passwordHash = await hashPassword(password);
    await prisma.user.create({
      data: {
        phone,
        email: `${phone}@phone.cafegames`,
        name: name ?? null,
        passwordHash,
      },
      select: { id: true },
    });

    // 4. Invalidate used OTP token
    await prisma.verificationToken.deleteMany({
      where: { identifier },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Signup failed:", error);
    return NextResponse.json(
      { error: "Signup failed. Please try again or contact support." },
      { status: 500 },
    );
  }
}
