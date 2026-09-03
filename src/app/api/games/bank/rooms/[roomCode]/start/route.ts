import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { BANK_ROOM_CODE_REGEX, startBankGame } from "@/lib/games/bank";

type RouteContext = {
  params: Promise<{ roomCode: string }>;
};

export async function POST(_: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roomCode } = await context.params;
  if (!BANK_ROOM_CODE_REGEX.test(roomCode.toUpperCase())) {
    return NextResponse.json({ error: "Invalid room code." }, { status: 400 });
  }

  try {
    await startBankGame({ roomCode, hostUserId: session.user.id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not start game." },
      { status: 400 },
    );
  }
}
