import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { joinSabahoRoom, SABAHO_ROOM_CODE_REGEX } from "@/lib/games/sabaho";

type RouteContext = {
  params: Promise<{ roomCode: string }>;
};

const joinSchema = z.object({
  password: z.string().trim().optional(),
});

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
    const json = await request.json().catch(() => ({}));
    const parsed = joinSchema.parse(json);

    const result = await joinSabahoRoom({
      userId: session.user.id,
      roomCode,
      password: parsed.password,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not join room." },
      { status: 400 },
    );
  }
}
