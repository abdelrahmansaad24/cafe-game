import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  AUTOBUS_ROOM_CODE_REGEX,
  confirmRoundScoresAction,
  leaveAutobusRoomAction,
  nextRoundAutobusAction,
  pressAutobusBuzzerAction,
  replayAutobusGameAction,
  submitAutobusAnswersAction,
} from "@/lib/games/autobus";

type RouteContext = {
  params: Promise<{ roomCode: string }>;
};

const actionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("SUBMIT_ANSWERS"),
    answers: z.record(z.string(), z.string()),
  }),
  z.object({
    type: z.literal("PRESS_AUTOBUS"),
    answers: z.record(z.string(), z.string()),
  }),
  z.object({
    type: z.literal("CONFIRM_SCORES"),
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
  if (!AUTOBUS_ROOM_CODE_REGEX.test(roomCode.toUpperCase())) {
    return NextResponse.json({ error: "Invalid table code." }, { status: 400 });
  }

  try {
    const json = await request.json();
    const parsed = actionSchema.parse(json);

    switch (parsed.type) {
      case "SUBMIT_ANSWERS":
        await submitAutobusAnswersAction({
          roomCode,
          actorUserId: session.user.id,
          answers: parsed.answers,
        });
        break;
      case "PRESS_AUTOBUS":
        await pressAutobusBuzzerAction({
          roomCode,
          actorUserId: session.user.id,
          answers: parsed.answers,
        });
        break;
      case "CONFIRM_SCORES":
        await confirmRoundScoresAction({
          roomCode,
          userId: session.user.id,
        });
        break;
      case "NEXT_ROUND":
        await nextRoundAutobusAction({
          roomCode,
          userId: session.user.id,
        });
        break;
      case "REPLAY":
        await replayAutobusGameAction({
          roomCode,
          userId: session.user.id,
        });
        break;
      case "LEAVE": {
        const result = await leaveAutobusRoomAction({
          roomCode,
          userId: session.user.id,
        });
        return NextResponse.json({ ok: true, deleted: result.deleted });
      }
      default:
        return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Action failed." },
      { status: 400 },
    );
  }
}
