import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { joinRoom, QUARTER_MONKEY_ROOM_CODE_REGEX } from "@/lib/games/quarter-monkey";

type RouteContext = {
  params: Promise<{ roomCode: string }>;
};

const joinSchema = z.object({
  password: z.string().trim().min(4).max(64).optional(),
});

export async function POST(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roomCode } = await context.params;
  if (!QUARTER_MONKEY_ROOM_CODE_REGEX.test(roomCode)) {
    return NextResponse.json({ error: "Invalid room code." }, { status: 400 });
  }

  let payload: unknown = {};
  try {
    payload = await request.json();
  } catch {
    payload = {};
  }

  const parsed = joinSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid join payload.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    await joinRoom({
      roomCode,
      userId: session.user.id,
      displayName: session.user.name?.trim() || session.user.email || "Player",
      password: parsed.data.password,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not join room." },
      { status: 400 },
    );
  }
}
