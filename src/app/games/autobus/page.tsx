import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AutobusLobbyClient from "./autobus-lobby-client";

export default async function AutobusLobbyPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return <AutobusLobbyClient />;
}
