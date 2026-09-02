import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { BEKASA_ROOM_CODE_REGEX, startBekasaRoom } from "@/lib/games/bekasa";

type RouteContext = {
  params: Promise<{ roomCode: string }>;
};

const startSchema = z.object({
  categoryId: z.string().optional(),
});

export async function POST(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roomCode } = await context.params;
  if (!BEKASA_ROOM_CODE_REGEX.test(roomCode.toUpperCase())) {
    return NextResponse.json({ error: "Invalid room code." }, { status: 400 });
  }

  let categoryId: string | undefined;
  try {
    const payload = await request.json();
    const parsed = startSchema.safeParse(payload);
    if (parsed.success) {
      categoryId = parsed.data.categoryId;
    }
  } catch {
    // Body optional
  }

  try {
    await startBekasaRoom({ roomCode, userId: session.user.id, categoryId });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not start game." },
      { status: 400 },
    );
  }
}
