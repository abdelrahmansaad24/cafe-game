import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPingoRoomState, PINGO_ROOM_CODE_REGEX } from "@/lib/games/pingo";

type RouteContext = {
  params: Promise<{ roomCode: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roomCode } = await context.params;
  if (!PINGO_ROOM_CODE_REGEX.test(roomCode.toUpperCase())) {
    return NextResponse.json({ error: "Invalid table code." }, { status: 400 });
  }

  const data = await getPingoRoomState({
    roomCode,
    currentUserId: session.user.id,
  });

  if (!data) {
    return NextResponse.json(
      { error: "Table not found or you are not seated here." },
      { status: 404 },
    );
  }

  return NextResponse.json(data);
}
