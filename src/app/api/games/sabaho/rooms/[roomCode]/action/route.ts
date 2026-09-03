import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  bidSabahoAction,
  buzzSabahoAction,
  changeTeamSabahoAction,
  judgeSabahoAnswerAction,
  leaveSabahoRoomAction,
  nextCareerStepSabahoAction,
  nextRoundSabahoAction,
  passBidSabahoAction,
  passwordCorrectSabahoAction,
  passwordPassSabahoAction,
  replaySabahoGameAction,
  SABAHO_ROOM_CODE_REGEX,
  submitGuessSabahoAction,
  updateTeamNamesSabahoAction,
} from "@/lib/games/sabaho";

type RouteContext = {
  params: Promise<{ roomCode: string }>;
};

const actionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("UPDATE_TEAM_NAMES"),
    team1Name: z.string().trim().min(1).max(30).optional(),
    team2Name: z.string().trim().min(1).max(30).optional(),
  }),
  z.object({
    type: z.literal("CHANGE_TEAM"),
    team: z.union([z.literal(1), z.literal(2)]),
  }),
  z.object({
    type: z.literal("BID"),
    bid: z.number().int().min(1),
  }),
  z.object({
    type: z.literal("PASS_BID"),
  }),
  z.object({
    type: z.literal("NEXT_STEP"),
  }),
  z.object({
    type: z.literal("BUZZ"),
  }),
  z.object({
    type: z.literal("SUBMIT_GUESS"),
    guess: z.string().trim().min(1).max(50),
  }),
  z.object({
    type: z.literal("PASSWORD_CORRECT"),
  }),
  z.object({
    type: z.literal("PASSWORD_PASS"),
  }),
  z.object({
    type: z.literal("JUDGE_ANSWER"),
    isCorrect: z.boolean(),
    awardedPlayerId: z.string().optional(),
    points: z.number().int().default(10),
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
  if (!SABAHO_ROOM_CODE_REGEX.test(roomCode.toUpperCase())) {
    return NextResponse.json({ error: "Invalid room code." }, { status: 400 });
  }

  try {
    const json = await request.json();
    const parsed = actionSchema.parse(json);

    switch (parsed.type) {
      case "UPDATE_TEAM_NAMES":
        await updateTeamNamesSabahoAction({
          roomCode,
          hostUserId: session.user.id,
          team1Name: parsed.team1Name,
          team2Name: parsed.team2Name,
        });
        break;
      case "CHANGE_TEAM":
        await changeTeamSabahoAction({
          roomCode,
          userId: session.user.id,
          team: parsed.team,
        });
        break;
      case "BID":
        await bidSabahoAction({
          roomCode,
          actorUserId: session.user.id,
          bid: parsed.bid,
        });
        break;
      case "PASS_BID":
        await passBidSabahoAction({
          roomCode,
          actorUserId: session.user.id,
        });
        break;
      case "NEXT_STEP":
        await nextCareerStepSabahoAction({
          roomCode,
          hostUserId: session.user.id,
        });
        break;
      case "BUZZ":
        await buzzSabahoAction({
          roomCode,
          actorUserId: session.user.id,
        });
        break;
      case "SUBMIT_GUESS": {
        const guessResult = await submitGuessSabahoAction({
          roomCode,
          actorUserId: session.user.id,
          guess: parsed.guess,
        });
        return NextResponse.json({ ok: true, result: guessResult });
      }
      case "PASSWORD_CORRECT":
        await passwordCorrectSabahoAction({
          roomCode,
          actorUserId: session.user.id,
        });
        break;
      case "PASSWORD_PASS":
        await passwordPassSabahoAction({
          roomCode,
          actorUserId: session.user.id,
        });
        break;
      case "JUDGE_ANSWER":
        await judgeSabahoAnswerAction({
          roomCode,
          hostUserId: session.user.id,
          isCorrect: parsed.isCorrect,
          awardedPlayerId: parsed.awardedPlayerId,
          points: parsed.points,
        });
        break;
      case "NEXT_ROUND":
        await nextRoundSabahoAction({
          roomCode,
          hostUserId: session.user.id,
        });
        break;
      case "REPLAY":
        await replaySabahoGameAction({
          roomCode,
          hostUserId: session.user.id,
        });
        break;
      case "LEAVE": {
        const result = await leaveSabahoRoomAction({
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
