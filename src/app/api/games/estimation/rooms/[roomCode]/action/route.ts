import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  bidEstimationAction,
  ESTIMATION_ROOM_CODE_REGEX,
  leaveEstimationRoomAction,
  nextRoundEstimationAction,
  playEstimationCardAction,
  replayEstimationGameAction,
  selectEstimationTrumpAction,
} from "@/lib/games/estimation";

type RouteContext = {
  params: Promise<{ roomCode: string }>;
};

const actionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("BID"),
    bid: z.number().int().min(0).max(13),
  }),
  z.object({
    type: z.literal("SELECT_TRUMP"),
    trumpSuit: z.enum(["SPADES", "HEARTS", "DIAMONDS", "CLUBS", "NO_TRUMP"]),
  }),
  z.object({
    type: z.literal("PLAY_CARD"),
    cardId: z.string().min(1),
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
  if (!ESTIMATION_ROOM_CODE_REGEX.test(roomCode.toUpperCase())) {
    return NextResponse.json({ error: "Invalid table code." }, { status: 400 });
  }

  try {
    const json = await request.json();
    const parsed = actionSchema.parse(json);

    switch (parsed.type) {
      case "BID":
        await bidEstimationAction({
          roomCode,
          actorUserId: session.user.id,
          bid: parsed.bid,
        });
        break;
      case "SELECT_TRUMP":
        await selectEstimationTrumpAction({
          roomCode,
          actorUserId: session.user.id,
          trumpSuit: parsed.trumpSuit,
        });
        break;
      case "PLAY_CARD":
        await playEstimationCardAction({
          roomCode,
          actorUserId: session.user.id,
          cardId: parsed.cardId,
        });
        break;
      case "NEXT_ROUND":
        await nextRoundEstimationAction({
          roomCode,
          userId: session.user.id,
        });
        break;
      case "REPLAY":
        await replayEstimationGameAction({
          roomCode,
          userId: session.user.id,
        });
        break;
      case "LEAVE": {
        const result = await leaveEstimationRoomAction({
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
