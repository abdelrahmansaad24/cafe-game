import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import {
  addCharacterAction,
  completeChallengeAction,
  finishWordAction,
  leaveRoomAction,
  QUARTER_MONKEY_ROOM_CODE_REGEX,
  replayGameAction,
  suspectPreviousPlayerAction,
  timeoutTurnAction,
} from "@/lib/games/quarter-monkey";

type RouteContext = {
  params: Promise<{ roomCode: string }>;
};

const actionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("ADD_CHAR"),
    character: z.string().trim().min(1).max(8),
  }),
  z.object({
    type: z.literal("SUSPECT"),
  }),
  z.object({
    type: z.literal("COMPLETE_CHALLENGE"),
    completedWord: z.string().trim().min(2).max(64),
  }),
  z.object({
    type: z.literal("FINISH_WORD"),
    character: z.string().trim().min(1).max(8).optional(),
  }),
  z.object({
    type: z.literal("TIMEOUT"),
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
  if (!QUARTER_MONKEY_ROOM_CODE_REGEX.test(roomCode)) {
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
      case "ADD_CHAR":
        await addCharacterAction({
          roomCode,
          actorUserId: session.user.id,
          character: parsed.data.character,
        });
        break;
      case "SUSPECT":
        await suspectPreviousPlayerAction({
          roomCode,
          actorUserId: session.user.id,
        });
        break;
      case "COMPLETE_CHALLENGE":
        await completeChallengeAction({
          roomCode,
          actorUserId: session.user.id,
          completedWord: parsed.data.completedWord,
        });
        break;
      case "FINISH_WORD":
        await finishWordAction({
          roomCode,
          actorUserId: session.user.id,
          character: parsed.data.character,
        });
        break;
      case "TIMEOUT":
        await timeoutTurnAction({
          roomCode,
          actorUserId: session.user.id,
        });
        break;
      case "REPLAY":
        await replayGameAction({
          roomCode,
          userId: session.user.id,
        });
        break;
      case "LEAVE": {
        const result = await leaveRoomAction({
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
