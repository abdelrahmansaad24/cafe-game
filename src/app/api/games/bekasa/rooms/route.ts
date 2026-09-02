import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createBekasaRoom, listPublicBekasaRooms } from "@/lib/games/bekasa";

const createRoomSchema = z.object({
  title: z.string().trim().min(2).max(80),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
  password: z.string().trim().min(4).max(64).optional(),
  scoreLimit: z.coerce.number().int().min(1).max(20).default(3),
  categoryId: z.string().min(1).default("football"),
});

export async function GET() {
  const rooms = await listPublicBekasaRooms();
  return NextResponse.json({
    rooms: rooms.map((room) => ({
      roomCode: room.roomCode,
      title: room.title,
      status: room.status,
      scoreLimit: room.scoreLimit,
      roundNumber: room.roundNumber,
      categoryId: room.categoryId,
      categoryNameAr: room.categoryNameAr,
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
    const room = await createBekasaRoom({
      userId: session.user.id,
      displayName: session.user.name?.trim() || session.user.email || "Player",
      title: parsed.data.title,
      visibility: parsed.data.visibility,
      password: parsed.data.password,
      scoreLimit: parsed.data.scoreLimit,
      categoryId: parsed.data.categoryId,
    });

    return NextResponse.json({ roomCode: room.roomCode }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create room." },
      { status: 400 },
    );
  }
}
