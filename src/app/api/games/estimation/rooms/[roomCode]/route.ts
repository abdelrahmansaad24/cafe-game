import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ESTIMATION_ROOM_CODE_REGEX, getEstimationRoomState } from "@/lib/games/estimation";

type RouteContext = {
  params: Promise<{ roomCode: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roomCode } = await context.params;
  if (!ESTIMATION_ROOM_CODE_REGEX.test(roomCode.toUpperCase())) {
    return NextResponse.json({ error: "Invalid table code." }, { status: 400 });
  }

  const data = await getEstimationRoomState({
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
