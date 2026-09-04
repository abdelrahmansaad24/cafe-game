import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { updateProfileSchema } from "@/lib/validation/auth";

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
      email: true,
      image: true,
      role: true,
      passwordHash: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      hasPassword: Boolean(user.passwordHash),
      createdAt: user.createdAt,
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

    const parsedPayload = updateProfileSchema.safeParse(payload);
    if (!parsedPayload.success) {
      return NextResponse.json(
        {
          error: "Invalid profile data.",
          issues: parsedPayload.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { name, image, currentPassword, newPassword } = parsedPayload.data;

    const existingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, passwordHash: true },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const updateData: {
      name?: string | null;
      image?: string | null;
      passwordHash?: string;
    } = {};

    // Update name
    if (name !== undefined) {
      updateData.name = name.trim() || null;
    }

    // Update image link (link only, no file upload)
    if (image !== undefined) {
      updateData.image = image.trim() || null;
    }

    // Update password if requested
    if (newPassword && newPassword.trim().length > 0) {
      if (existingUser.passwordHash) {
        if (!currentPassword) {
          return NextResponse.json(
            { error: "Current password is required to set a new password." },
            { status: 400 },
          );
        }

        const isCurrentValid = await verifyPassword(
          currentPassword,
          existingUser.passwordHash,
        );

        if (!isCurrentValid) {
          return NextResponse.json(
            { error: "The current password you entered is incorrect." },
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
        email: true,
        image: true,
        role: true,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Profile updated successfully!",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Profile update failed:", error);
    return NextResponse.json(
      { error: "Failed to update profile. Please try again." },
      { status: 500 },
    );
  }
}
