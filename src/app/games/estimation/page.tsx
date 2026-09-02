import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import EstimationLobbyClient from "./estimation-lobby-client";

export default async function EstimationLobbyPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return <EstimationLobbyClient />;
}
