import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import PingoRoomClient from "./pingo-room-client";

type PageProps = {
  params: Promise<{ roomCode: string }>;
};

export default async function PingoRoomPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { roomCode } = await params;
  return <PingoRoomClient roomCode={roomCode.toUpperCase()} />;
}
