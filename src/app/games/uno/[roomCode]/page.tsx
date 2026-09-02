import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import UnoRoomClient from "./uno-room-client";

type PageProps = {
  params: Promise<{ roomCode: string }>;
};

export default async function UnoRoomPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { roomCode } = await params;
  return <UnoRoomClient roomCode={roomCode.toUpperCase()} />;
}
