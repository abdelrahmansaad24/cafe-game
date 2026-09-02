import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createPingoRoom, listPublicPingoRooms } from "@/lib/games/pingo";

const createSchema = z.object({
  title: z.string().trim().min(2).max(40),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
  password: z.string().trim().min(3).max(30).optional(),
  scoreLimit: z.number().int().min(1).max(10).default(3),
  turnTimerSeconds: z.number().int().min(15).max(60).default(30),
});

export async function GET() {
  const rooms = await listPublicPingoRooms();
  return NextResponse.json({ rooms });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const parsed = createSchema.parse(json);

    if (parsed.visibility === "PRIVATE" && !parsed.password) {
      return NextResponse.json(
        { error: "Password is required for private tables." },
        { status: 400 },
      );
    }

    const room = await createPingoRoom({
      userId: session.user.id,
      title: parsed.title,
      visibility: parsed.visibility,
      password: parsed.password,
      scoreLimit: parsed.scoreLimit,
      turnTimerSeconds: parsed.turnTimerSeconds,
    });

    return NextResponse.json({ roomCode: room.roomCode }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create table." },
      { status: 400 },
    );
  }
}
