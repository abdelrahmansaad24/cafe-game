import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { BANK_ROOM_CODE_REGEX, leaveBankRoom } from "@/lib/games/bank";

type RouteContext = {
  params: Promise<{ roomCode: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roomCode } = await context.params;
  if (!BANK_ROOM_CODE_REGEX.test(roomCode.toUpperCase())) {
    return NextResponse.json({ error: "Invalid room code." }, { status: 400 });
  }

  try {
    const result = await leaveBankRoom({
      roomCode,
      userId: session.user.id,
    });
    return NextResponse.json({ ok: true, deleted: result?.deleted ?? false });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not leave room." },
      { status: 400 },
    );
  }
}
