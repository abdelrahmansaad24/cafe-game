import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  advanceQuestionBekasaAction,
  bekasGuessAction,
  BEKASA_ROOM_CODE_REGEX,
  bonusQuestionBekasaAction,
  castVoteBekasaAction,
  leaveBekasaRoomAction,
  nextRoundBekasaAction,
  readyBekasaAction,
  replayBekasaGameAction,
  revealRoleBekasaAction,
} from "@/lib/games/bekasa";

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
    type: z.literal("ADVANCE_QUESTION"),
  }),
  z.object({
    type: z.literal("BONUS_QUESTION"),
    targetPlayerId: z.string().min(1),
  }),
  z.object({
    type: z.literal("SKIP_BONUS"),
  }),
  z.object({
    type: z.literal("CAST_VOTE"),
    votedPlayerId: z.string().min(1),
  }),
  z.object({
    type: z.literal("BEKAS_GUESS"),
    guessedWordAr: z.string().min(1),
  }),
  z.object({
    type: z.literal("NEXT_ROUND"),
    categoryId: z.string().optional(),
  }),
  z.object({
    type: z.literal("REPLAY"),
    categoryId: z.string().optional(),
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
  if (!BEKASA_ROOM_CODE_REGEX.test(roomCode.toUpperCase())) {
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
        await revealRoleBekasaAction({
          roomCode,
          actorUserId: session.user.id,
        });
        break;
      case "READY":
        await readyBekasaAction({
          roomCode,
          actorUserId: session.user.id,
        });
        break;
      case "ADVANCE_QUESTION":
        await advanceQuestionBekasaAction({
          roomCode,
          actorUserId: session.user.id,
        });
        break;
      case "BONUS_QUESTION":
        await bonusQuestionBekasaAction({
          roomCode,
          actorUserId: session.user.id,
          targetPlayerId: parsed.data.targetPlayerId,
          skip: false,
        });
        break;
      case "SKIP_BONUS":
        await bonusQuestionBekasaAction({
          roomCode,
          actorUserId: session.user.id,
          skip: true,
        });
        break;
      case "CAST_VOTE":
        await castVoteBekasaAction({
          roomCode,
          actorUserId: session.user.id,
          votedPlayerId: parsed.data.votedPlayerId,
        });
        break;
      case "BEKAS_GUESS":
        await bekasGuessAction({
          roomCode,
          actorUserId: session.user.id,
          guessedWordAr: parsed.data.guessedWordAr,
        });
        break;
      case "NEXT_ROUND":
        await nextRoundBekasaAction({
          roomCode,
          userId: session.user.id,
          categoryId: parsed.data.categoryId,
        });
        break;
      case "REPLAY":
        await replayBekasaGameAction({
          roomCode,
          userId: session.user.id,
          categoryId: parsed.data.categoryId,
        });
        break;
      case "LEAVE": {
        const result = await leaveBekasaRoomAction({
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
