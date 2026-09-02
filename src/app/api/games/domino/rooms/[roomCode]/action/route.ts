import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  DOMINO_ROOM_CODE_REGEX,
  drawTileAction,
  leaveDominoRoomAction,
  nextRoundDominoAction,
  passTurnAction,
  playTileAction,
  replayDominoGameAction,
} from "@/lib/games/domino";

type RouteContext = {
  params: Promise<{ roomCode: string }>;
};

const actionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("PLAY_TILE"),
    tile: z.tuple([z.number().int().min(0).max(6), z.number().int().min(0).max(6)]),
    side: z.enum(["LEFT", "RIGHT"]),
  }),
  z.object({
    type: z.literal("DRAW_TILE"),
  }),
  z.object({
    type: z.literal("PASS_TURN"),
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
  if (!DOMINO_ROOM_CODE_REGEX.test(roomCode.toUpperCase())) {
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
      case "PLAY_TILE":
        await playTileAction({
          roomCode,
          actorUserId: session.user.id,
          tile: parsed.data.tile,
          side: parsed.data.side,
        });
        break;
      case "DRAW_TILE":
        await drawTileAction({
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
      case "NEXT_ROUND":
        await nextRoundDominoAction({
          roomCode,
          userId: session.user.id,
        });
        break;
      case "REPLAY":
        await replayDominoGameAction({
          roomCode,
          userId: session.user.id,
        });
        break;
      case "LEAVE": {
        const result = await leaveDominoRoomAction({
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
