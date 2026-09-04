import dotenv from "dotenv";
dotenv.config();

// Dynamically import prisma singleton or pg directly
import { createBankRoom, joinBankRoom, getBankRoomState, startBankGame } from "../src/lib/games/bank.ts";
import { prisma } from "../src/lib/prisma.ts";

async function runTest() {
  console.log("--- STARTING BANK EL HAZZ VERIFICATION TEST ---");

  const hostUserId = "cmtm7h259000304jv70vnmtxl"; // Ahmed
  const player2UserId = "test_player_2_id_" + Date.now();

  // 1. Create room
  console.log("Step 1: Creating room...");
  const room = await createBankRoom({
    hostUserId,
    hostDisplayName: "Ahmed (Host)",
    title: "Test Verification Table",
    visibility: "PUBLIC",
    turnTimerSeconds: 30,
  });
  console.log("Room created successfully. Code:", room.roomCode);

  // 2. Player 2 joins room
  console.log("Step 2: Player 2 joining room...");
  const p2 = await joinBankRoom({
    roomCode: room.roomCode,
    userId: player2UserId,
    displayName: "Player Two",
  });
  console.log("Player 2 joined:", p2.displayName, "Seat:", p2.seatIndex);

  // 3. Verify state
  console.log("Step 3: Checking room state for both players...");
  const stateHost = await getBankRoomState(room.roomCode, hostUserId);
  const stateP2 = await getBankRoomState(room.roomCode, player2UserId);

  if (!stateHost || !stateP2) {
    throw new Error("Could not retrieve room state");
  }

  console.log("Host view - Players count:", stateHost.players.length);
  console.log("Host view - Self isHost:", stateHost.selfPlayer?.isHost);
  console.log("Player 2 view - Self name:", stateP2.selfPlayer?.displayName);

  if (stateHost.players.length !== 2) {
    throw new Error(`Expected 2 players, got ${stateHost.players.length}`);
  }

  // 4. Start match
  console.log("Step 4: Host starting match...");
  await startBankGame({
    roomCode: room.roomCode,
    hostUserId,
  });

  // 5. Verify game started
  const playingState = await getBankRoomState(room.roomCode, hostUserId);
  console.log("Game status:", playingState?.room.status);
  console.log("Current phase:", playingState?.room.currentPhase);
  console.log("Current turn player:", playingState?.room.currentTurnPlayerId);

  if (playingState?.room.status !== "PLAYING") {
    throw new Error("Room did not transition to PLAYING");
  }

  // 6. Cleanup test room
  console.log("Step 6: Cleaning up test room...");
  await prisma.bankRoom.delete({ where: { id: room.id } });
  console.log("--- ALL TESTS PASSED SUCCESSFULLY! ---");
}

runTest()
  .catch((err) => {
    console.error("TEST FAILED:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
