import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  applyActionMove,
  callScrewAction,
  declareBasraAction,
  discardDrawnCardAction,
  drawCardAction,
  finishInitialPeekAction,
  leaveScrewRoomAction,
  nextRoundScrewAction,
  replayScrewGameAction,
  replaceSlotAction,
  SCREW_ROOM_CODE_REGEX,
} from "@/lib/games/screw";

type RouteContext = {
  params: Promise<{ roomCode: string }>;
};

const actionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("FINISH_INITIAL_PEEK"),
  }),
  z.object({
    type: z.literal("DRAW_CARD"),
    source: z.enum(["DECK", "DISCARD"]),
  }),
  z.object({
    type: z.literal("REPLACE_SLOT"),
    slotIndex: z.number().int().min(0).max(10),
  }),
  z.object({
    type: z.literal("DISCARD_DRAWN"),
  }),
  z.object({
    type: z.literal("APPLY_ACTION"),
    actionPayload: z.object({
      type: z.enum(["NUMBER", "PEEK_SELF", "PEEK_OTHER", "SWAP", "PING_PONG", "THE_THIEF", "SPY_ALL"]),
      selfSlotIndex: z.number().int().min(0).max(10).optional(),
      targetPlayerId: z.string().optional(),
      targetSlotIndex: z.number().int().min(0).max(10).optional(),
      doSwap: z.boolean().optional(),
    }),
  }),
  z.object({
    type: z.literal("BASRA"),
    slotIndex: z.number().int().min(0).max(10),
  }),
  z.object({
    type: z.literal("CALL_SCREW"),
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
  if (!SCREW_ROOM_CODE_REGEX.test(roomCode.toUpperCase())) {
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
      case "FINISH_INITIAL_PEEK":
        await finishInitialPeekAction({
          roomCode,
          actorUserId: session.user.id,
        });
        break;
      case "DRAW_CARD":
        await drawCardAction({
          roomCode,
          actorUserId: session.user.id,
          source: parsed.data.source,
        });
        break;
      case "REPLACE_SLOT":
        await replaceSlotAction({
          roomCode,
          actorUserId: session.user.id,
          slotIndex: parsed.data.slotIndex,
        });
        break;
      case "DISCARD_DRAWN":
        await discardDrawnCardAction({
          roomCode,
          actorUserId: session.user.id,
        });
        break;
      case "APPLY_ACTION":
        await applyActionMove({
          roomCode,
          actorUserId: session.user.id,
          actionPayload: parsed.data.actionPayload,
        });
        break;
      case "CALL_SCREW":
        await callScrewAction({
          roomCode,
          actorUserId: session.user.id,
        });
        break;
      case "BASRA": {
        const result = await declareBasraAction({
          roomCode,
          actorUserId: session.user.id,
          slotIndex: parsed.data.slotIndex,
        });
        return NextResponse.json({ ok: true, ...result });
      }
      case "NEXT_ROUND":
        await nextRoundScrewAction({
          roomCode,
          userId: session.user.id,
        });
        break;
      case "REPLAY":
        await replayScrewGameAction({
          roomCode,
          userId: session.user.id,
        });
        break;
      case "LEAVE": {
        const result = await leaveScrewRoomAction({
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
