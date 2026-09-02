import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import DominoRoomClient from "./domino-room-client";

type RouteProps = {
  params: Promise<{ roomCode: string }>;
};

export default async function DominoRoomPage({ params }: RouteProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { roomCode } = await params;
  return <DominoRoomClient roomCode={roomCode.toUpperCase()} />;
}
