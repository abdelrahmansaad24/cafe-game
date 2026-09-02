import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import ScrewRoomClient from "./screw-room-client";

type PageProps = {
  params: Promise<{ roomCode: string }>;
};

export default async function ScrewRoomPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { roomCode } = await params;
  return <ScrewRoomClient roomCode={roomCode.toUpperCase()} />;
}
