import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { ESTIMATION_ROOM_CODE_REGEX, joinEstimationRoom } from "@/lib/games/estimation";

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
  if (!ESTIMATION_ROOM_CODE_REGEX.test(roomCode.toUpperCase())) {
    return NextResponse.json({ error: "Invalid table code." }, { status: 400 });
  }

  try {
    const json = await request.json().catch(() => ({}));
    const parsed = joinSchema.parse(json);

    const result = await joinEstimationRoom({
      userId: session.user.id,
      roomCode,
      password: parsed.password,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not join table." },
      { status: 400 },
    );
  }
}
