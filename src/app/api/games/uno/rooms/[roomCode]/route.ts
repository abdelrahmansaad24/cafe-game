import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUnoRoomState, UNO_ROOM_CODE_REGEX } from "@/lib/games/uno";

type RouteContext = {
  params: Promise<{ roomCode: string }>;
};

export async function GET(_: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roomCode } = await context.params;
  if (!UNO_ROOM_CODE_REGEX.test(roomCode.toUpperCase())) {
    return NextResponse.json({ error: "Invalid table code." }, { status: 400 });
  }

  try {
    const data = await getUnoRoomState(roomCode, session.user.id);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load table." },
      { status: 400 },
    );
  }
}
