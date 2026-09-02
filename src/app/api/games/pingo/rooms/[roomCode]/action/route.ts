import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  callPingoNumberAction,
  leavePingoRoomAction,
  nextRoundPingoAction,
  PINGO_ROOM_CODE_REGEX,
  replayPingoGameAction,
  setupPingoCardAction,
  shoutPingoAction,
} from "@/lib/games/pingo";

type RouteContext = {
  params: Promise<{ roomCode: string }>;
};

const actionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("SETUP_CARD"),
    gridNumbers: z.array(z.number().int().min(1).max(25)).length(25),
  }),
  z.object({
    type: z.literal("CALL_NUMBER"),
    calledNumber: z.number().int().min(1).max(25),
  }),
  z.object({
    type: z.literal("SHOUT_PINGO"),
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
  if (!PINGO_ROOM_CODE_REGEX.test(roomCode.toUpperCase())) {
    return NextResponse.json({ error: "Invalid table code." }, { status: 400 });
  }

  try {
    const json = await request.json();
    const parsed = actionSchema.parse(json);

    switch (parsed.type) {
      case "SETUP_CARD":
        await setupPingoCardAction({
          roomCode,
          actorUserId: session.user.id,
          gridNumbers: parsed.gridNumbers,
        });
        break;
      case "CALL_NUMBER":
        await callPingoNumberAction({
          roomCode,
          actorUserId: session.user.id,
          calledNumber: parsed.calledNumber,
        });
        break;
      case "SHOUT_PINGO":
        await shoutPingoAction({
          roomCode,
          actorUserId: session.user.id,
        });
        break;
      case "NEXT_ROUND":
        await nextRoundPingoAction({
          roomCode,
          userId: session.user.id,
        });
        break;
      case "REPLAY":
        await replayPingoGameAction({
          roomCode,
          userId: session.user.id,
        });
        break;
      case "LEAVE": {
        const result = await leavePingoRoomAction({
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
