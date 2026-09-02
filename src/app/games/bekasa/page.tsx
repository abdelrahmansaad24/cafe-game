import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import BekasaLobbyClient from "./bekasa-lobby-client";

export default async function BekasaLobbyPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return <BekasaLobbyClient />;
}
