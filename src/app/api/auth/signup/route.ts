import { NextResponse } from "next/server";

import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validation/auth";

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

    const existingUser = await prisma.user.findUnique({
      where: { email: parsedPayload.data.email },
      select: { id: true },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(parsedPayload.data.password);
    await prisma.user.create({
      data: {
        email: parsedPayload.data.email,
        name: parsedPayload.data.name ?? null,
        passwordHash,
      },
      select: { id: true },
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
