import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSabahoRoomState, SABAHO_ROOM_CODE_REGEX } from "@/lib/games/sabaho";

type RouteContext = {
  params: Promise<{ roomCode: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roomCode } = await context.params;
  if (!SABAHO_ROOM_CODE_REGEX.test(roomCode.toUpperCase())) {
    return NextResponse.json({ error: "Invalid room code." }, { status: 400 });
  }

  const data = await getSabahoRoomState({
    roomCode,
    currentUserId: session.user.id,
  });

  if (!data) {
    return NextResponse.json(
      { error: "Room not found or you are not in this room." },
      { status: 404 },
    );
  }

  return NextResponse.json(data);
}
