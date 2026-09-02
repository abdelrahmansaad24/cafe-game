import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import BlinkLobbyClient from "./blink-lobby-client";

export default async function BlinkLobbyPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return <BlinkLobbyClient />;
}
