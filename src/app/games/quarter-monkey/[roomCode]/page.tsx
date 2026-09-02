import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { QUARTER_MONKEY_ROOM_CODE_REGEX } from "@/lib/games/quarter-monkey";

import QuarterMonkeyRoomClient from "./quarter-monkey-room-client";

type PageProps = {
  params: Promise<{ roomCode: string }>;
};

export default async function QuarterMonkeyRoomPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { roomCode } = await params;
  if (!QUARTER_MONKEY_ROOM_CODE_REGEX.test(roomCode)) {
    redirect("/games/quarter-monkey");
  }

  return <QuarterMonkeyRoomClient roomCode={roomCode} />;
}
