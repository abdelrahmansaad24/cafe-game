import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { SCREW_ROOM_CODE_REGEX, startScrewRoom } from "@/lib/games/screw";

type RouteContext = {
  params: Promise<{ roomCode: string }>;
};

export async function POST(_: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roomCode } = await context.params;
  if (!SCREW_ROOM_CODE_REGEX.test(roomCode.toUpperCase())) {
    return NextResponse.json({ error: "Invalid table code." }, { status: 400 });
  }

  try {
    await startScrewRoom({ roomCode, userId: session.user.id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not start game." },
      { status: 400 },
    );
  }
}
