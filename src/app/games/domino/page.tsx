import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import DominoLobbyClient from "./domino-lobby-client";

export default async function DominoLobbyPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return <DominoLobbyClient />;
}
