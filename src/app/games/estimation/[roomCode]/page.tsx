import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import EstimationRoomClient from "./estimation-room-client";

type PageProps = {
  params: Promise<{ roomCode: string }>;
};

export default async function EstimationRoomPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { roomCode } = await params;
  return <EstimationRoomClient roomCode={roomCode.toUpperCase()} />;
}
