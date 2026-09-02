import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import {
  BLINK_ROOM_CODE_REGEX,
  gotWinkedAction,
  leaveBlinkRoomAction,
  makeGuessAction,
  nextRoundAction,
  readyAction,
  replayBlinkGameAction,
  revealRoleAction,
} from "@/lib/games/blink";

type RouteContext = {
  params: Promise<{ roomCode: string }>;
};

const actionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("REVEAL_ROLE"),
  }),
  z.object({
    type: z.literal("READY"),
  }),
  z.object({
    type: z.literal("GOT_WINKED"),
  }),
  z.object({
    type: z.literal("MAKE_GUESS"),
    guessedPlayerId: z.string().min(1),
  }),
  z.object({
    type: z.literal("NEXT_ROUND"),
  }),
  z.object({
    type: z.literal("REPLAY"),
  }),
  z.object({
    type: z.literal("LEAVE"),
  }),
]);

export async function POST(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roomCode } = await context.params;
  if (!BLINK_ROOM_CODE_REGEX.test(roomCode.toUpperCase())) {
    return NextResponse.json({ error: "Invalid room code." }, { status: 400 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = actionSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid action payload.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    switch (parsed.data.type) {
      case "REVEAL_ROLE":
        await revealRoleAction({
          roomCode,
          actorUserId: session.user.id,
        });
        break;
      case "READY":
        await readyAction({
          roomCode,
          actorUserId: session.user.id,
        });
        break;
      case "GOT_WINKED":
        await gotWinkedAction({
          roomCode,
          actorUserId: session.user.id,
        });
        break;
      case "MAKE_GUESS":
        await makeGuessAction({
          roomCode,
          actorUserId: session.user.id,
          guessedPlayerId: parsed.data.guessedPlayerId,
        });
        break;
      case "NEXT_ROUND":
        await nextRoundAction({
          roomCode,
          userId: session.user.id,
        });
        break;
      case "REPLAY":
        await replayBlinkGameAction({
          roomCode,
          userId: session.user.id,
        });
        break;
      case "LEAVE": {
        const result = await leaveBlinkRoomAction({
          roomCode,
          userId: session.user.id,
        });
        return NextResponse.json({ ok: true, deleted: result.deleted });
      }
      default:
        return NextResponse.json({ error: "Unknown action type." }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Action failed." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
