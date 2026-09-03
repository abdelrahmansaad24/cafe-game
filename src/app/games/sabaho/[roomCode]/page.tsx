import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import SabahoRoomClient from "./sabaho-room-client";

type PageProps = {
  params: Promise<{ roomCode: string }>;
};

export default async function SabahoRoomPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { roomCode } = await params;
  return <SabahoRoomClient roomCode={roomCode.toUpperCase()} />;
}
