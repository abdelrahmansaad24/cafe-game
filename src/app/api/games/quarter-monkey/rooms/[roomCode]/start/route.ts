import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { QUARTER_MONKEY_ROOM_CODE_REGEX, startRoomGame } from "@/lib/games/quarter-monkey";

type RouteContext = {
  params: Promise<{ roomCode: string }>;
};

export async function POST(_: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roomCode } = await context.params;
  if (!QUARTER_MONKEY_ROOM_CODE_REGEX.test(roomCode)) {
    return NextResponse.json({ error: "Invalid room code." }, { status: 400 });
  }

  try {
    await startRoomGame({ roomCode, userId: session.user.id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not start game." },
      { status: 400 },
    );
  }
}
