import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { normalizePhoneNumber } from "@/lib/sms";

const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(80, "Name must be 80 characters or fewer.")
    .optional(),
  phone: z.string().trim().optional(),
  image: z
    .string()
    .trim()
    .refine(
      (val) => val === "" || /^https?:\/\/.+/i.test(val),
      "Profile image must be a valid http or https URL link.",
    )
    .optional(),
  currentPassword: z.string().optional(),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters long.")
    .max(128, "New password cannot exceed 128 characters.")
    .optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      image: true,
      role: true,
      createdAt: true,
      passwordHash: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      image: user.image,
      role: user.role,
      createdAt: user.createdAt,
      hasPassword: Boolean(user.passwordHash),
    },
  });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    const parsed = updateProfileSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid input data.",
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { name, phone: rawPhone, image, currentPassword, newPassword } = parsed.data;

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, passwordHash: true, phone: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updateData: {
      name?: string;
      phone?: string;
      image?: string | null;
      passwordHash?: string;
    } = {};

    if (name !== undefined) {
      updateData.name = name;
    }

    if (rawPhone !== undefined && rawPhone.trim()) {
      const normalized = normalizePhoneNumber(rawPhone);
      if (normalized && normalized !== currentUser.phone) {
        // Check if phone already taken
        const phoneTaken = await prisma.user.findFirst({
          where: { phone: normalized, NOT: { id: session.user.id } },
          select: { id: true },
        });
        if (phoneTaken) {
          return NextResponse.json(
            { error: "This WhatsApp number is already in use by another account." },
            { status: 409 },
          );
        }
        updateData.phone = normalized;
      }
    }

    if (image !== undefined) {
      updateData.image = image.trim() === "" ? null : image.trim();
    }

    // Password change logic
    if (newPassword) {
      if (currentUser.passwordHash) {
        if (!currentPassword) {
          return NextResponse.json(
            { error: "Current password is required to set a new password." },
            { status: 400 },
          );
        }

        const isCurrentValid = await verifyPassword(
          currentPassword,
          currentUser.passwordHash,
        );

        if (!isCurrentValid) {
          return NextResponse.json(
            { error: "Incorrect current password." },
            { status: 400 },
          );
        }
      }

      updateData.passwordHash = await hashPassword(newPassword);
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        image: true,
        role: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Profile updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("[ProfileUpdate] Error occurred:", error);
    return NextResponse.json(
      { error: "Could not update profile. Please try again." },
      { status: 500 },
    );
  }
}
