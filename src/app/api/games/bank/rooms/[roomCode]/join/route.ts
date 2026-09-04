import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { BANK_ROOM_CODE_REGEX, joinBankRoom } from "@/lib/games/bank";

type RouteContext = {
  params: Promise<{ roomCode: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roomCode } = await context.params;
  if (!BANK_ROOM_CODE_REGEX.test(roomCode.toUpperCase())) {
    return NextResponse.json({ error: "Invalid room code." }, { status: 400 });
  }

  let password: string | undefined;
  try {
    const body = await request.json();
    if (typeof body?.password === "string") {
      password = body.password;
    }
  } catch {
    // Body is optional
  }

  try {
    const player = await joinBankRoom({
      roomCode,
      userId: session.user.id,
      displayName: session.user.name?.trim() || session.user.email || "Player",
      password,
    });

    return NextResponse.json({ player });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to join room." },
      { status: 400 },
    );
  }
}
