import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { joinUnoRoom, UNO_ROOM_CODE_REGEX } from "@/lib/games/uno";

type RouteContext = {
  params: Promise<{ roomCode: string }>;
};

const joinSchema = z.object({
  password: z.string().trim().optional(),
});

export async function POST(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roomCode } = await context.params;
  if (!UNO_ROOM_CODE_REGEX.test(roomCode.toUpperCase())) {
    return NextResponse.json({ error: "Invalid table code." }, { status: 400 });
  }

  let password: string | undefined;
  try {
    const payload = await request.json();
    const parsed = joinSchema.safeParse(payload);
    if (parsed.success) {
      password = parsed.data.password;
    }
  } catch {
    // Optional body
  }

  try {
    await joinUnoRoom({
      roomCode,
      userId: session.user.id,
      displayName: session.user.name?.trim() || session.user.email || "Player",
      password,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not join table." },
      { status: 400 },
    );
  }
}
