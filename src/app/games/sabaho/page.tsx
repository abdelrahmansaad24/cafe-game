import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import SabahoLobbyClient from "./sabaho-lobby-client";

export default async function SabahoLobbyPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return <SabahoLobbyClient />;
}
