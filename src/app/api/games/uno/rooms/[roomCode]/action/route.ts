import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  callUnoAction,
  catchUnoAction,
  drawCardAction,
  leaveUnoRoomAction,
  nextRoundUnoAction,
  passTurnAction,
  playCardAction,
  replayUnoGameAction,
  UNO_ROOM_CODE_REGEX,
} from "@/lib/games/uno";

type RouteContext = {
  params: Promise<{ roomCode: string }>;
};

const actionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("PLAY_CARD"),
    cardId: z.string().min(1),
    chosenColor: z.enum(["RED", "BLUE", "GREEN", "YELLOW", "WILD"]).optional(),
    calledUno: z.boolean().optional(),
  }),
  z.object({
    type: z.literal("DRAW_CARD"),
  }),
  z.object({
    type: z.literal("PASS_TURN"),
  }),
  z.object({
    type: z.literal("CALL_UNO"),
  }),
  z.object({
    type: z.literal("CATCH_UNO"),
    targetPlayerId: z.string().min(1),
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
  if (!UNO_ROOM_CODE_REGEX.test(roomCode.toUpperCase())) {
    return NextResponse.json({ error: "Invalid table code." }, { status: 400 });
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
      case "PLAY_CARD":
        await playCardAction({
          roomCode,
          actorUserId: session.user.id,
          cardId: parsed.data.cardId,
          chosenColor: parsed.data.chosenColor,
          calledUno: parsed.data.calledUno,
        });
        break;
      case "DRAW_CARD":
        await drawCardAction({
          roomCode,
          actorUserId: session.user.id,
        });
        break;
      case "PASS_TURN":
        await passTurnAction({
          roomCode,
          actorUserId: session.user.id,
        });
        break;
      case "CALL_UNO":
        await callUnoAction({
          roomCode,
          actorUserId: session.user.id,
        });
        break;
      case "CATCH_UNO":
        await catchUnoAction({
          roomCode,
          actorUserId: session.user.id,
          targetPlayerId: parsed.data.targetPlayerId,
        });
        break;
      case "NEXT_ROUND":
        await nextRoundUnoAction({
          roomCode,
          userId: session.user.id,
        });
        break;
      case "REPLAY":
        await replayUnoGameAction({
          roomCode,
          userId: session.user.id,
        });
        break;
      case "LEAVE": {
        const result = await leaveUnoRoomAction({
          roomCode,
          userId: session.user.id,
        });
        return NextResponse.json({ ok: true, deleted: result.deleted });
      }
      default:
        return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Action failed." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
