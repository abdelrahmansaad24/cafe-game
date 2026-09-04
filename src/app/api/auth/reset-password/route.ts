import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { resetPasswordSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  try {
    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    const parsedPayload = resetPasswordSchema.safeParse(payload);
    if (!parsedPayload.success) {
      return NextResponse.json(
        {
          error: "Invalid reset details.",
          issues: parsedPayload.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const email = parsedPayload.data.email.toLowerCase().trim();
    const token = parsedPayload.data.token;
    const identifier = `password-reset:${email}`;

    const record = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier,
          token,
        },
      },
    });

    if (!record) {
      return NextResponse.json(
        { error: "This password reset link is invalid or has already been used." },
        { status: 400 },
      );
    }

    if (new Date() > record.expires) {
      // Token has expired; clean it up
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier,
            token,
          },
        },
      });
      return NextResponse.json(
        { error: "This password reset link has expired. Please request a new one." },
        { status: 400 },
      );
    }

    // User must exist
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email address." },
        { status: 404 },
      );
    }

    // Hash the new password
    const passwordHash = await hashPassword(parsedPayload.data.password);

    // Update password
    await prisma.user.update({
      where: { email },
      data: { passwordHash },
    });

    // Clean up consumed token
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier,
          token,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Your password has been successfully reset! You can now sign in.",
    });
  } catch (error) {
    console.error("Reset password failed:", error);
    return NextResponse.json(
      { error: "Failed to reset password. Please try again or contact support." },
      { status: 500 },
    );
  }
}
