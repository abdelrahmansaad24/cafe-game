import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AutobusRoomClient from "./autobus-room-client";

type PageProps = {
  params: Promise<{ roomCode: string }>;
};

export default async function AutobusRoomPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { roomCode } = await params;
  return <AutobusRoomClient roomCode={roomCode.toUpperCase()} />;
}
