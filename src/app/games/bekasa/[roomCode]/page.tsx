import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import BekasaRoomClient from "./bekasa-room-client";

type RouteProps = {
  params: Promise<{ roomCode: string }>;
};

export default async function BekasaRoomPage({ params }: RouteProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { roomCode } = await params;
  return <BekasaRoomClient roomCode={roomCode.toUpperCase()} />;
}
