import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import UnoLobbyClient from "./uno-lobby-client";

export default async function UnoLobbyPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return <UnoLobbyClient />;
}
