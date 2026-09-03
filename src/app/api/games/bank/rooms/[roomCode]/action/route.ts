import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  BANK_ROOM_CODE_REGEX,
  buyPropertyBankAction,
  declareBankruptcyBankAction,
  endTurnBankAction,
  mortgagePropertyBankAction,
  passPropertyBankAction,
  payJailFineBankAction,
  replayBankGameAction,
  rollDiceBankAction,
  buildHouseBankAction,
  sellHouseBankAction,
  unmortgagePropertyBankAction,
  useJailCardBankAction,
} from "@/lib/games/bank";

type RouteContext = {
  params: Promise<{ roomCode: string }>;
};

const actionSchema = z.object({
  type: z.enum([
    "ROLL_DICE",
    "BUY_PROPERTY",
    "PASS_PROPERTY",
    "BUILD_HOUSE",
    "SELL_HOUSE",
    "MORTGAGE_PROPERTY",
    "UNMORTGAGE_PROPERTY",
    "PAY_JAIL_FINE",
    "USE_JAIL_CARD",
    "END_TURN",
    "DECLARE_BANKRUPTCY",
    "REPLAY",
  ]),
  tileIndex: z.number().int().min(0).max(39).optional(),
});

export async function POST(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roomCode } = await context.params;
  if (!BANK_ROOM_CODE_REGEX.test(roomCode.toUpperCase())) {
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

  const { type, tileIndex } = parsed.data;
  const userId = session.user.id;

  try {
    switch (type) {
      case "ROLL_DICE":
        await rollDiceBankAction({ roomCode, actorUserId: userId });
        break;
      case "BUY_PROPERTY":
        await buyPropertyBankAction({ roomCode, actorUserId: userId });
        break;
      case "PASS_PROPERTY":
        await passPropertyBankAction({ roomCode, actorUserId: userId });
        break;
      case "BUILD_HOUSE":
        if (tileIndex === undefined) throw new Error("Tile index required.");
        await buildHouseBankAction({ roomCode, actorUserId: userId, tileIndex });
        break;
      case "SELL_HOUSE":
        if (tileIndex === undefined) throw new Error("Tile index required.");
        await sellHouseBankAction({ roomCode, actorUserId: userId, tileIndex });
        break;
      case "MORTGAGE_PROPERTY":
        if (tileIndex === undefined) throw new Error("Tile index required.");
        await mortgagePropertyBankAction({ roomCode, actorUserId: userId, tileIndex });
        break;
      case "UNMORTGAGE_PROPERTY":
        if (tileIndex === undefined) throw new Error("Tile index required.");
        await unmortgagePropertyBankAction({ roomCode, actorUserId: userId, tileIndex });
        break;
      case "PAY_JAIL_FINE":
        await payJailFineBankAction({ roomCode, actorUserId: userId });
        break;
      case "USE_JAIL_CARD":
        await useJailCardBankAction({ roomCode, actorUserId: userId });
        break;
      case "END_TURN":
        await endTurnBankAction({ roomCode, actorUserId: userId });
        break;
      case "DECLARE_BANKRUPTCY":
        await declareBankruptcyBankAction({ roomCode, actorUserId: userId });
        break;
      case "REPLAY":
        await replayBankGameAction({ roomCode, hostUserId: userId });
        break;
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
