import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createAutobusRoom, listPublicAutobusRooms } from "@/lib/games/autobus";

const createSchema = z.object({
  title: z.string().trim().min(2).max(40),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
  password: z.string().trim().min(3).max(30).optional(),
  scoreLimit: z.number().int().min(30).max(300).default(100),
  countdownSeconds: z.number().int().min(10).max(30).default(15),
});

export async function GET() {
  const rooms = await listPublicAutobusRooms();
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

    const room = await createAutobusRoom({
      userId: session.user.id,
      title: parsed.title,
      visibility: parsed.visibility,
      password: parsed.password,
      scoreLimit: parsed.scoreLimit,
      countdownSeconds: parsed.countdownSeconds,
    });

    return NextResponse.json({ roomCode: room.roomCode }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create table." },
      { status: 400 },
    );
  }
}
