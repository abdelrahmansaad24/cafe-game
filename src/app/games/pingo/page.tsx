import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import PingoLobbyClient from "./pingo-lobby-client";

export default async function PingoLobbyPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return <PingoLobbyClient />;
}
