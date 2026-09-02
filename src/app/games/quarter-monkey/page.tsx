import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

import QuarterMonkeyLobbyClient from "./quarter-monkey-lobby-client";

export default async function QuarterMonkeyLobbyPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  return <QuarterMonkeyLobbyClient />;
}
