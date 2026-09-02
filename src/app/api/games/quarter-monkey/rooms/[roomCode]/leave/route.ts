import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { leaveRoomAction, QUARTER_MONKEY_ROOM_CODE_REGEX } from "@/lib/games/quarter-monkey";

type RouteContext = {
  params: Promise<{ roomCode: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roomCode } = await context.params;
  if (!QUARTER_MONKEY_ROOM_CODE_REGEX.test(roomCode)) {
    return NextResponse.json({ error: "Invalid room code." }, { status: 400 });
  }

  try {
    const result = await leaveRoomAction({
      roomCode,
      userId: session.user.id,
    });
    return NextResponse.json({ ok: true, deleted: result.deleted });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not leave room." },
      { status: 400 },
    );
  }
}
