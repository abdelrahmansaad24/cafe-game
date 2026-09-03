import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import BankLobbyClient from "./bank-lobby-client";

export default async function BankLobbyPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return <BankLobbyClient />;
}
