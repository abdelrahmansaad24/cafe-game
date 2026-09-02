import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import {
  calculateCompletedLines,
  generateRandomPingoCard,
  validatePingoCard,
} from "./pingo-types";

export const PINGO_ROOM_CODE_REGEX = /^[A-Z0-9]{6}$/;

function generateRoomCode(): string {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    const randomIndex = crypto.randomInt(0, characters.length);
    code += characters[randomIndex];
  }
  return code;
}

export async function listPublicPingoRooms() {
  return prisma.pingoRoom.findMany({
    where: {
      visibility: "PUBLIC",
      status: { in: ["WAITING", "PLAYING"] },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      roomCode: true,
      title: true,
      status: true,
      scoreLimit: true,
      roundNumber: true,
      _count: { select: { players: true } },
    },
  });
}

export async function createPingoRoom({
  userId,
  title,
  visibility,
  password,
  scoreLimit = 3,
  turnTimerSeconds = 30,
}: {
  userId: string;
  title: string;
  visibility: "PUBLIC" | "PRIVATE";
  password?: string;
  scoreLimit?: number;
  turnTimerSeconds?: number;
}) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found.");

  let roomCode = generateRoomCode();
  let exists = await prisma.pingoRoom.findUnique({ where: { roomCode } });
  while (exists) {
    roomCode = generateRoomCode();
    exists = await prisma.pingoRoom.findUnique({ where: { roomCode } });
  }

  const passwordHash =
    visibility === "PRIVATE" && password ? await hashPassword(password) : null;

  const initialCard = generateRandomPingoCard();

  return prisma.pingoRoom.create({
    data: {
      roomCode,
      title: title.trim() || "طاولة بينجو",
      visibility,
      passwordHash,
      scoreLimit: Math.max(1, Math.min(10, scoreLimit)),
      turnTimerSeconds: Math.max(15, Math.min(60, turnTimerSeconds)),
      createdById: userId,
      status: "WAITING",
      currentPhase: "SETUP",
      players: {
        create: {
          userId,
          displayName: user.name || "Host",
          isHost: true,
          seatIndex: 0,
          gridNumbersJson: JSON.stringify(initialCard),
          isReady: false,
        },
      },
      actions: {
        create: {
          type: "JOIN",
          details: `${user.name || "Host"} created the Pingo table.`,
        },
      },
    },
    select: { roomCode: true },
  });
}

export async function joinPingoRoom({
  userId,
  roomCode,
  password,
}: {
  userId: string;
  roomCode: string;
  password?: string;
}) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found.");

  const room = await prisma.pingoRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: true },
  });

  if (!room) throw new Error("Table not found.");
  if (room.status === "FINISHED") throw new Error("This game has already finished.");

  const existingPlayer = room.players.find((p) => p.userId === userId);
  if (existingPlayer) {
    return { roomCode: room.roomCode };
  }

  if (room.visibility === "PRIVATE" && room.passwordHash) {
    if (!password) throw new Error("Password required.");
    const valid = await verifyPassword(password, room.passwordHash);
    if (!valid) throw new Error("Incorrect table password.");
  }

  if (room.players.length >= 8) {
    throw new Error("Table is full (maximum 8 players).");
  }

  const initialCard = generateRandomPingoCard();

  await prisma.$transaction(async (tx) => {
    const seatIndex = room.players.length;
    await tx.pingoRoomPlayer.create({
      data: {
        roomId: room.id,
        userId,
        displayName: user.name || `Player ${seatIndex + 1}`,
        seatIndex,
        gridNumbersJson: JSON.stringify(initialCard),
        isReady: false,
      },
    });

    await tx.pingoRoomAction.create({
      data: {
        roomId: room.id,
        type: "JOIN",
        details: `${user.name || "A player"} joined the table.`,
      },
    });
  });

  return { roomCode: room.roomCode };
}

export async function getPingoRoomState({
  roomCode,
  currentUserId,
}: {
  roomCode: string;
  currentUserId: string;
}) {
  const room = await prisma.pingoRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: {
      players: { orderBy: { seatIndex: "asc" } },
      actions: { orderBy: { createdAt: "desc" }, take: 25 },
    },
  });

  if (!room) return null;

  const selfPlayer = room.players.find((p) => p.userId === currentUserId);
  if (!selfPlayer) return null;

  let calledNumbers: number[] = [];
  try {
    calledNumbers = JSON.parse(room.calledNumbersJson || "[]");
  } catch {
    calledNumbers = [];
  }

  // Calculate lines and letters for each player
  const playersState = room.players.map((p) => {
    let gridNumbers: number[] = [];
    try {
      gridNumbers = JSON.parse(p.gridNumbersJson || "[]");
    } catch {
      gridNumbers = [];
    }

    const {
      completedLinesCount,
      completedLineIndices,
      scratchedCellIndices,
      letters,
      isPingoReady,
    } = calculateCompletedLines(gridNumbers, calledNumbers);

    const isSelf = p.userId === currentUserId;
    const isRoundOver =
      room.currentPhase === "ROUND_OVER" || room.status === "FINISHED";

    return {
      id: p.id,
      userId: p.userId,
      displayName: p.displayName,
      seatIndex: p.seatIndex,
      score: p.score,
      isHost: p.isHost,
      isReady: p.isReady,
      completedLinesCount,
      lettersUnlocked: letters,
      isPingoReady,
      // Grid numbers are private to the player during game, revealed upon round over
      gridNumbers: isSelf || isRoundOver ? gridNumbers : [],
      scratchedCellIndices: Array.from(scratchedCellIndices),
      completedLineIndices,
    };
  });

  return {
    room: {
      id: room.id,
      roomCode: room.roomCode,
      title: room.title,
      visibility: room.visibility,
      status: room.status,
      currentPhase: room.currentPhase,
      scoreLimit: room.scoreLimit,
      roundNumber: room.roundNumber,
      currentTurnPlayerId: room.currentTurnPlayerId,
      turnStartedAt: room.turnStartedAt?.toISOString() || null,
      turnTimerSeconds: room.turnTimerSeconds,
      calledNumbers,
      lastCalledNumber: room.lastCalledNumber,
      roundWinnerId: room.roundWinnerId,
      roundSummary: room.roundSummary,
      createdById: room.createdById,
      winnerId: room.winnerId,
      players: playersState,
      actions: room.actions.map((act) => ({
        id: act.id,
        type: act.type,
        details: act.details,
        createdAt: act.createdAt.toISOString(),
      })),
    },
    selfPlayer: {
      id: selfPlayer.id,
      userId: selfPlayer.userId,
      displayName: selfPlayer.displayName,
      seatIndex: selfPlayer.seatIndex,
      score: selfPlayer.score,
      isHost: selfPlayer.isHost,
      isReady: selfPlayer.isReady,
      isMyTurn: room.currentTurnPlayerId === selfPlayer.id,
    },
  };
}

export async function startPingoGame({
  roomCode,
  hostUserId,
}: {
  roomCode: string;
  hostUserId: string;
}) {
  const room = await prisma.pingoRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: { orderBy: { seatIndex: "asc" } } },
  });

  if (!room || room.status !== "WAITING") {
    throw new Error("Table is not in waiting status.");
  }
  if (room.createdById !== hostUserId) {
    throw new Error("Only the host can start the game.");
  }
  if (room.players.length < 2) {
    throw new Error("At least 2 players are required to start.");
  }

  const firstTurnPlayerId = room.players[0].id;

  await prisma.$transaction(async (tx) => {
    // Reset players for round 1
    await tx.pingoRoomPlayer.updateMany({
      where: { roomId: room.id },
      data: {
        isReady: true,
        completedLinesCount: 0,
        lettersUnlocked: "",
        claimedPingo: false,
      },
    });

    await tx.pingoRoom.update({
      where: { id: room.id },
      data: {
        status: "PLAYING",
        currentPhase: "PLAYING",
        roundNumber: 1,
        calledNumbersJson: "[]",
        lastCalledNumber: null,
        currentTurnPlayerId: firstTurnPlayerId,
        turnStartedAt: new Date(),
      },
    });

    await tx.pingoRoomAction.create({
      data: {
        roomId: room.id,
        type: "START",
        details: "Game started! Round 1 is in progress.",
      },
    });
  });
}

export async function setupPingoCardAction({
  roomCode,
  actorUserId,
  gridNumbers,
}: {
  roomCode: string;
  actorUserId: string;
  gridNumbers: number[];
}) {
  if (!validatePingoCard(gridNumbers)) {
    throw new Error("Invalid card: must contain all numbers from 1 to 25.");
  }

  const room = await prisma.pingoRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: true },
  });

  if (!room || (room.currentPhase !== "SETUP" && room.status !== "WAITING")) {
    throw new Error("Cannot reconfigure card during active play.");
  }

  const player = room.players.find((p) => p.userId === actorUserId);
  if (!player) throw new Error("Player not found.");

  await prisma.pingoRoomPlayer.update({
    where: { id: player.id },
    data: {
      gridNumbersJson: JSON.stringify(gridNumbers),
    },
  });
}

export async function callPingoNumberAction({
  roomCode,
  actorUserId,
  calledNumber,
}: {
  roomCode: string;
  actorUserId: string;
  calledNumber: number;
}) {
  if (calledNumber < 1 || calledNumber > 25) {
    throw new Error("Number must be between 1 and 25.");
  }

  const room = await prisma.pingoRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: { orderBy: { seatIndex: "asc" } } },
  });

  if (!room || room.status !== "PLAYING" || room.currentPhase !== "PLAYING") {
    throw new Error("Game is not actively playing.");
  }

  const activePlayer = room.players.find((p) => p.id === room.currentTurnPlayerId);
  if (!activePlayer || activePlayer.userId !== actorUserId) {
    throw new Error("It is not your turn to call a number.");
  }

  let calledNumbers: number[] = [];
  try {
    calledNumbers = JSON.parse(room.calledNumbersJson || "[]");
  } catch {
    calledNumbers = [];
  }

  if (calledNumbers.includes(calledNumber)) {
    throw new Error(`Number ${calledNumber} has already been called!`);
  }

  calledNumbers.push(calledNumber);

  // Rotate turn to next player
  const currentIndex = room.players.findIndex((p) => p.id === activePlayer.id);
  const nextPlayer = room.players[(currentIndex + 1) % room.players.length];

  await prisma.$transaction(async (tx) => {
    await tx.pingoRoom.update({
      where: { id: room.id },
      data: {
        calledNumbersJson: JSON.stringify(calledNumbers),
        lastCalledNumber: calledNumber,
        currentTurnPlayerId: nextPlayer.id,
        turnStartedAt: new Date(),
      },
    });

    await tx.pingoRoomAction.create({
      data: {
        roomId: room.id,
        actorId: activePlayer.id,
        type: "CALL_NUMBER",
        value: String(calledNumber),
        details: `📣 ${activePlayer.displayName} called number [${calledNumber}]!`,
      },
    });
  });
}

export async function shoutPingoAction({
  roomCode,
  actorUserId,
}: {
  roomCode: string;
  actorUserId: string;
}) {
  const room = await prisma.pingoRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: { orderBy: { seatIndex: "asc" } } },
  });

  if (!room || room.status !== "PLAYING" || room.currentPhase !== "PLAYING") {
    throw new Error("Cannot shout PINGO right now.");
  }

  const player = room.players.find((p) => p.userId === actorUserId);
  if (!player) throw new Error("Player not found.");

  let calledNumbers: number[] = [];
  try {
    calledNumbers = JSON.parse(room.calledNumbersJson || "[]");
  } catch {
    calledNumbers = [];
  }

  let gridNumbers: number[] = [];
  try {
    gridNumbers = JSON.parse(player.gridNumbersJson || "[]");
  } catch {
    gridNumbers = [];
  }

  const { completedLinesCount, isPingoReady } = calculateCompletedLines(
    gridNumbers,
    calledNumbers,
  );

  if (!isPingoReady || completedLinesCount < 5) {
    throw new Error(
      `False Pingo claim! You have only completed ${completedLinesCount}/5 lines.`,
    );
  }

  const newScore = player.score + 1;
  const isMatchOver = newScore >= room.scoreLimit;

  await prisma.$transaction(async (tx) => {
    await tx.pingoRoomPlayer.update({
      where: { id: player.id },
      data: {
        score: newScore,
        claimedPingo: true,
      },
    });

    await tx.pingoRoom.update({
      where: { id: room.id },
      data: {
        status: isMatchOver ? "FINISHED" : "PLAYING",
        currentPhase: isMatchOver ? "FINISHED" : "ROUND_OVER",
        roundWinnerId: player.id,
        winnerId: isMatchOver ? player.userId : null,
        roundSummary: `🎉 ${player.displayName} completed 5 lines and shouted PINGO! (Won Round ${room.roundNumber})`,
      },
    });

    await tx.pingoRoomAction.create({
      data: {
        roomId: room.id,
        actorId: player.id,
        type: "SHOUT_PINGO",
        details: `🚨 PINGO! ${player.displayName} completed 5 lines and won Round ${room.roundNumber}!`,
      },
    });
  });
}

export async function nextRoundPingoAction({
  roomCode,
  userId,
}: {
  roomCode: string;
  userId: string;
}) {
  const room = await prisma.pingoRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: { orderBy: { seatIndex: "asc" } } },
  });

  if (!room || room.currentPhase !== "ROUND_OVER") {
    throw new Error("Round is not over.");
  }

  const isHost = room.createdById === userId;
  if (!isHost) throw new Error("Only the host can start the next round.");

  const firstTurnPlayer = room.players[(room.roundNumber) % room.players.length];

  await prisma.$transaction(async (tx) => {
    // Generate fresh cards for each player for the new round
    for (const player of room.players) {
      const newCard = generateRandomPingoCard();
      await tx.pingoRoomPlayer.update({
        where: { id: player.id },
        data: {
          gridNumbersJson: JSON.stringify(newCard),
          completedLinesCount: 0,
          lettersUnlocked: "",
          claimedPingo: false,
          isReady: true,
        },
      });
    }

    await tx.pingoRoom.update({
      where: { id: room.id },
      data: {
        currentPhase: "PLAYING",
        roundNumber: room.roundNumber + 1,
        calledNumbersJson: "[]",
        lastCalledNumber: null,
        roundWinnerId: null,
        roundSummary: null,
        currentTurnPlayerId: firstTurnPlayer.id,
        turnStartedAt: new Date(),
      },
    });

    await tx.pingoRoomAction.create({
      data: {
        roomId: room.id,
        type: "NEXT_ROUND",
        details: `Round ${room.roundNumber + 1} started!`,
      },
    });
  });
}

export async function replayPingoGameAction({
  roomCode,
  userId,
}: {
  roomCode: string;
  userId: string;
}) {
  const room = await prisma.pingoRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: true },
  });

  if (!room || room.status !== "FINISHED") {
    throw new Error("Match is not finished.");
  }
  if (room.createdById !== userId) {
    throw new Error("Only the host can reset the match.");
  }

  await prisma.$transaction(async (tx) => {
    for (const p of room.players) {
      const newCard = generateRandomPingoCard();
      await tx.pingoRoomPlayer.update({
        where: { id: p.id },
        data: {
          score: 0,
          gridNumbersJson: JSON.stringify(newCard),
          completedLinesCount: 0,
          lettersUnlocked: "",
          claimedPingo: false,
        },
      });
    }

    await tx.pingoRoom.update({
      where: { id: room.id },
      data: {
        status: "PLAYING",
        currentPhase: "PLAYING",
        roundNumber: 1,
        calledNumbersJson: "[]",
        lastCalledNumber: null,
        roundWinnerId: null,
        winnerId: null,
        roundSummary: null,
        currentTurnPlayerId: room.players[0].id,
        turnStartedAt: new Date(),
      },
    });

    await tx.pingoRoomAction.create({
      data: {
        roomId: room.id,
        type: "REPLAY",
        details: "Match scores reset. Starting a new match!",
      },
    });
  });
}

export async function leavePingoRoomAction({
  roomCode,
  userId,
}: {
  roomCode: string;
  userId: string;
}) {
  const room = await prisma.pingoRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: true },
  });

  if (!room) throw new Error("Table not found.");

  const player = room.players.find((p) => p.userId === userId);
  if (!player) return { deleted: false };

  // If host leaves or only 1 player remains in waiting
  if (player.isHost || room.players.length <= 1) {
    await prisma.pingoRoom.delete({ where: { id: room.id } });
    return { deleted: true };
  }

  await prisma.$transaction(async (tx) => {
    await tx.pingoRoomPlayer.delete({ where: { id: player.id } });
    await tx.pingoRoomAction.create({
      data: {
        roomId: room.id,
        type: "LEAVE",
        details: `${player.displayName} left the table.`,
      },
    });
  });

  return { deleted: false };
}
