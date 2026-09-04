import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { forgotPasswordSchema } from "@/lib/validation/auth";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    const parsedPayload = forgotPasswordSchema.safeParse(payload);
    if (!parsedPayload.success) {
      return NextResponse.json(
        {
          error: "Please enter a valid email address.",
          issues: parsedPayload.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const email = parsedPayload.data.email.toLowerCase().trim();

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      // Don't leak whether an account exists or not
      return NextResponse.json({
        ok: true,
        message: "If an account with that email exists, we sent a password reset link.",
      });
    }

    const identifier = `password-reset:${email}`;

    // Clean up any old tokens for this user
    try {
      await prisma.verificationToken.deleteMany({
        where: { identifier },
      });
    } catch (cleanErr) {
      console.warn("Could not clean old verification tokens:", cleanErr);
    }

    // Generate secure token (valid for 1 hour)
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.verificationToken.create({
      data: {
        identifier,
        token,
        expires,
      },
    });

    // Construct reset link
    const resetUrl = `${env.APP_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    await sendPasswordResetEmail({
      email,
      name: user.name,
      resetUrl,
    });

    return NextResponse.json({
      ok: true,
      message: "If an account with that email exists, we sent a password reset link.",
    });
  } catch (error) {
    console.error("Forgot password request failed:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 },
    );
  }
}
