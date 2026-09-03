import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import BankRoomClient from "./bank-room-client";

type RouteProps = {
  params: Promise<{ roomCode: string }>;
};

export default async function BankRoomPage({ params }: RouteProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { roomCode } = await params;
  return <BankRoomClient roomCode={roomCode.toUpperCase()} />;
}
