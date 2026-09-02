import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createScrewRoom, listPublicScrewRooms } from "@/lib/games/screw";

const createRoomSchema = z.object({
  title: z.string().trim().min(2).max(80),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
  password: z.string().trim().min(4).max(64).optional(),
  mode: z.enum(["SOLO", "TEAMS"]).default("SOLO"),
  cardsPerPlayer: z.coerce.number().int().min(4).max(6).default(4),
  scoreLimit: z.coerce.number().int().min(50).max(300).default(100),
  turnTimerSeconds: z.coerce.number().int().min(0).max(120).default(30),
  doubleFinalRound: z.boolean().default(false),
  screwPenaltyType: z.enum(["PLUS_30", "DOUBLE_SCORE"]).default("PLUS_30"),
});

export async function GET() {
  const rooms = await listPublicScrewRooms();
  return NextResponse.json({
    rooms: rooms.map((room) => ({
      roomCode: room.roomCode,
      title: room.title,
      status: room.status,
      mode: room.mode,
      cardsPerPlayer: room.cardsPerPlayer,
      scoreLimit: room.scoreLimit,
      turnTimerSeconds: room.turnTimerSeconds,
      doubleFinalRound: room.doubleFinalRound,
      screwPenaltyType: room.screwPenaltyType,
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
      { error: "Invalid table payload.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const room = await createScrewRoom({
      userId: session.user.id,
      displayName: session.user.name?.trim() || session.user.email || "Player",
      title: parsed.data.title,
      visibility: parsed.data.visibility,
      password: parsed.data.password,
      mode: parsed.data.mode,
      cardsPerPlayer: parsed.data.cardsPerPlayer,
      scoreLimit: parsed.data.scoreLimit,
      turnTimerSeconds: parsed.data.turnTimerSeconds,
      doubleFinalRound: parsed.data.doubleFinalRound,
      screwPenaltyType: parsed.data.screwPenaltyType,
    });

    return NextResponse.json({ roomCode: room.roomCode }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create table." },
      { status: 400 },
    );
  }
}
