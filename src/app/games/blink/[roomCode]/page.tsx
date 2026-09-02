import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import BlinkRoomClient from "./blink-room-client";

type RouteProps = {
  params: Promise<{ roomCode: string }>;
};

export default async function BlinkRoomPage({ params }: RouteProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { roomCode } = await params;
  return <BlinkRoomClient roomCode={roomCode.toUpperCase()} />;
}
