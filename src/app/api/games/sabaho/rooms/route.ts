import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createSabahoRoom, listPublicSabahoRooms } from "@/lib/games/sabaho";

const createSchema = z.object({
  title: z.string().trim().min(2).max(40),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
  password: z.string().trim().min(3).max(30).optional(),
  gameMode: z.enum(["MIXED", "AUCTION", "CAREER_PATH", "SPEED", "PASSWORD"]).default("MIXED"),
  isTeamPlay: z.boolean().default(true),
  roundsTotal: z.number().int().min(3).max(12).default(6),
  team1Name: z.string().trim().min(1).max(30).optional(),
  team2Name: z.string().trim().min(1).max(30).optional(),
});

export async function GET() {
  const rooms = await listPublicSabahoRooms();
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
        { error: "Password is required for private rooms." },
        { status: 400 },
      );
    }

    const room = await createSabahoRoom({
      userId: session.user.id,
      title: parsed.title,
      visibility: parsed.visibility,
      password: parsed.password,
      gameMode: parsed.gameMode,
      isTeamPlay: parsed.isTeamPlay,
      roundsTotal: parsed.roundsTotal,
      team1Name: parsed.team1Name,
      team2Name: parsed.team2Name,
    });

    return NextResponse.json({ roomCode: room.roomCode }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create room." },
      { status: 400 },
    );
  }
}
