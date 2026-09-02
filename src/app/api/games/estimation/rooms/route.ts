import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createEstimationRoom, listPublicEstimationRooms } from "@/lib/games/estimation";

const createSchema = z.object({
  title: z.string().trim().min(2).max(40),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
  password: z.string().trim().min(3).max(30).optional(),
  roundsTotal: z.number().int().min(4).max(8).default(4),
});

export async function GET() {
  const rooms = await listPublicEstimationRooms();
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

    const room = await createEstimationRoom({
      userId: session.user.id,
      title: parsed.title,
      visibility: parsed.visibility,
      password: parsed.password,
      roundsTotal: parsed.roundsTotal,
    });

    return NextResponse.json({ roomCode: room.roomCode }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create table." },
      { status: 400 },
    );
  }
}
