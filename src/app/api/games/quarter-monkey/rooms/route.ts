import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { createRoom, listPublicRooms } from "@/lib/games/quarter-monkey";

const createRoomSchema = z.object({
  title: z.string().trim().min(2).max(80),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
  password: z.string().trim().min(4).max(64).optional(),
  scoreLimit: z.coerce.number().int().min(1).max(10).default(3),
  turnTimerSeconds: z.coerce.number().int().min(0).max(300).optional().nullable(),
});

export async function GET() {
  const rooms = await listPublicRooms();
  return NextResponse.json({
    rooms: rooms.map((room) => ({
      roomCode: room.roomCode,
      title: room.title,
      status: room.status,
      scoreLimit: room.scoreLimit,
      turnTimerSeconds: room.turnTimerSeconds,
      playerCount: room.players.length,
    })),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = createRoomSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid room payload.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const room = await createRoom({
      userId: session.user.id,
      displayName: session.user.name?.trim() || session.user.email || "Player",
      title: parsed.data.title,
      visibility: parsed.data.visibility,
      password: parsed.data.password,
      scoreLimit: parsed.data.scoreLimit,
      turnTimerSeconds: parsed.data.turnTimerSeconds,
    });

    return NextResponse.json({ roomCode: room.roomCode }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create room." },
      { status: 400 },
    );
  }
}
