import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getRoomState, QUARTER_MONKEY_ROOM_CODE_REGEX } from "@/lib/games/quarter-monkey";

type RouteContext = {
  params: Promise<{ roomCode: string }>;
};

export async function GET(_: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roomCode } = await context.params;
  if (!QUARTER_MONKEY_ROOM_CODE_REGEX.test(roomCode)) {
    return NextResponse.json({ error: "Invalid room code." }, { status: 400 });
  }

  try {
    const room = await getRoomState(roomCode);
    const selfPlayer = room.players.find((player) => player.userId === session.user.id);
    if (!selfPlayer) {
      return NextResponse.json({ error: "Join the room first." }, { status: 403 });
    }

    return NextResponse.json({
      room: {
        roomCode: room.roomCode,
        title: room.title,
        visibility: room.visibility,
        status: room.status,
        scoreLimit: room.scoreLimit,
        currentWord: room.currentWord,
        currentTurnPlayerId: room.currentTurnPlayerId,
        previousTurnPlayerId: room.previousTurnPlayerId,
        challengeByPlayerId: room.challengeByPlayerId,
        challengeTargetPlayerId: room.challengeTargetPlayerId,
        challengePrefix: room.challengePrefix,
        createdById: room.createdById,
        winnerId: room.winnerId,
        players: room.players,
        actions: room.actions,
      },
      selfPlayerId: selfPlayer.id,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load room." },
      { status: 400 },
    );
  }
}
