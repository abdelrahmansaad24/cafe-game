import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import ScrewLobbyClient from "./screw-lobby-client";

export default async function ScrewLobbyPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return <ScrewLobbyClient />;
}
