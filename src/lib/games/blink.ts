import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export const BLINK_ROOM_CODE_REGEX = /^[A-Z0-9]{6}$/;

function generateRoomCode(): string {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    const randomIndex = crypto.randomInt(0, characters.length);
    code += characters[randomIndex];
  }
  return code;
}

export interface CreateBlinkRoomInput {
  userId: string;
  displayName: string;
  title: string;
  visibility: "PUBLIC" | "PRIVATE";
  password?: string;
  scoreLimit?: number;
}

export interface JoinBlinkRoomInput {
  roomCode: string;
  userId: string;
  displayName: string;
  password?: string;
}

export async function listPublicBlinkRooms() {
  return prisma.blinkRoom.findMany({
    where: {
      visibility: "PUBLIC",
      status: {
        in: ["WAITING", "PLAYING"],
      },
    },
    include: {
      players: {
        select: {
          id: true,
          userId: true,
          displayName: true,
          isHost: true,
          score: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 30,
  });
}

export async function createBlinkRoom(input: CreateBlinkRoomInput) {
  const title = input.title.trim();
  if (title.length < 2 || title.length > 80) {
    throw new Error("Room title must be between 2 and 80 characters.");
  }

  const scoreLimit = Math.min(Math.max(input.scoreLimit ?? 3, 1), 20);
  let passwordHash: string | null = null;
  if (input.visibility === "PRIVATE") {
    if (!input.password || input.password.length < 4) {
      throw new Error("Private rooms require a password with at least 4 characters.");
    }
    passwordHash = await hashPassword(input.password);
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const roomCode = generateRoomCode();
    try {
      const room = await prisma.blinkRoom.create({
        data: {
          roomCode,
          title,
          visibility: input.visibility,
          passwordHash,
          scoreLimit,
          createdById: input.userId,
          status: "WAITING",
          currentPhase: "ROLE_REVEAL",
          players: {
            create: {
              userId: input.userId,
              displayName: input.displayName.trim() || "Host",
              isHost: true,
            },
          },
          actions: {
            create: {
              type: "JOIN",
              details: `${input.displayName.trim() || "Host"} created the room.`,
            },
          },
        },
        include: {
          players: true,
        },
      });

      return room;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        continue;
      }
      throw error;
    }
  }

  throw new Error("Failed to generate a unique room code. Please try again.");
}

export async function joinBlinkRoom(input: JoinBlinkRoomInput) {
  const roomCode = input.roomCode.toUpperCase().trim();
  if (!BLINK_ROOM_CODE_REGEX.test(roomCode)) {
    throw new Error("Invalid room code format.");
  }

  const room = await prisma.blinkRoom.findUnique({
    where: { roomCode },
    include: {
      players: true,
    },
  });

  if (!room) {
    throw new Error("Room not found.");
  }

  if (room.status === "FINISHED") {
    throw new Error("This game match is already finished.");
  }

  const existingPlayer = room.players.find((p) => p.userId === input.userId);
  if (existingPlayer) {
    return { room, player: existingPlayer };
  }

  if (room.status === "PLAYING") {
    throw new Error("Game is already in progress. Wait for the match to finish.");
  }

  if (room.players.length >= 20) {
    throw new Error("Room is full (max 20 players).");
  }

  if (room.visibility === "PRIVATE") {
    if (!input.password) {
      throw new Error("Password required for private rooms.");
    }
    const valid = await verifyPassword(input.password, room.passwordHash ?? "");
    if (!valid) {
      throw new Error("Incorrect room password.");
    }
  }

  const newPlayer = await prisma.blinkRoomPlayer.create({
    data: {
      roomId: room.id,
      userId: input.userId,
      displayName: input.displayName.trim() || "Player",
      isHost: false,
    },
  });

  await prisma.blinkRoomAction.create({
    data: {
      roomId: room.id,
      actorId: newPlayer.id,
      type: "JOIN",
      details: `${newPlayer.displayName} joined the room.`,
    },
  });

  return { room, player: newPlayer };
}

export async function getBlinkRoomState(roomCode: string, currentUserId: string) {
  const normalizedCode = roomCode.toUpperCase().trim();
  const room = await prisma.blinkRoom.findUnique({
    where: { roomCode: normalizedCode },
    include: {
      players: {
        orderBy: { createdAt: "asc" },
      },
      actions: {
        orderBy: { createdAt: "desc" },
        take: 30,
      },
    },
  });

  if (!room) {
    throw new Error("Room not found.");
  }

  const selfPlayer = room.players.find((p) => p.userId === currentUserId);
  if (!selfPlayer) {
    throw new Error("Join the room first.");
  }

  // Role privacy: Only reveal isBlinker to the player themself OR if round/game is over!
  const isRoundOver = room.currentPhase === "ROUND_OVER" || room.currentPhase === "FINISHED" || room.status === "FINISHED";

  const sanitizedPlayers = room.players.map((p) => {
    const showRole = isRoundOver || p.userId === currentUserId;
    return {
      id: p.id,
      userId: p.userId,
      displayName: p.displayName,
      score: p.score,
      isHost: p.isHost,
      isBlinker: showRole ? p.isBlinker : null,
      roleRevealed: p.roleRevealed,
      isReady: p.isReady,
      isWinked: p.isWinked,
      winkedAt: p.winkedAt,
    };
  });

  return {
    room: {
      id: room.id,
      roomCode: room.roomCode,
      title: room.title,
      visibility: room.visibility,
      scoreLimit: room.scoreLimit,
      status: room.status,
      currentPhase: room.currentPhase,
      roundNumber: room.roundNumber,
      blinkerPlayerId: isRoundOver ? room.blinkerPlayerId : null,
      survivorPlayerId: room.survivorPlayerId,
      guessTargetPlayerId: room.guessTargetPlayerId,
      roundWinnerPlayerId: room.roundWinnerPlayerId,
      roundResultSummary: room.roundResultSummary,
      createdById: room.createdById,
      winnerId: room.winnerId,
      createdAt: room.createdAt,
      players: sanitizedPlayers,
      actions: room.actions,
    },
    selfPlayer: {
      id: selfPlayer.id,
      userId: selfPlayer.userId,
      displayName: selfPlayer.displayName,
      score: selfPlayer.score,
      isHost: selfPlayer.isHost,
      isBlinker: selfPlayer.isBlinker,
      roleRevealed: selfPlayer.roleRevealed,
      isReady: selfPlayer.isReady,
      isWinked: selfPlayer.isWinked,
    },
  };
}

export async function startBlinkRoom({
  roomCode,
  userId,
}: {
  roomCode: string;
  userId: string;
}) {
  const normalizedCode = roomCode.toUpperCase().trim();
  const room = await prisma.blinkRoom.findUnique({
    where: { roomCode: normalizedCode },
    include: { players: true },
  });

  if (!room) {
    throw new Error("Room not found.");
  }

  const hostPlayer = room.players.find((p) => p.userId === userId && p.isHost);
  if (!hostPlayer) {
    throw new Error("Only the host can start the game.");
  }

  if (room.players.length < 3) {
    throw new Error("At least 3 players are required to play غمازة (Blink).");
  }

  // Randomly pick one player as the Blinker
  const randomIndex = crypto.randomInt(0, room.players.length);
  const chosenBlinker = room.players[randomIndex];

  await prisma.$transaction(async (tx) => {
    // Reset all players for round 1
    for (let i = 0; i < room.players.length; i++) {
      const p = room.players[i];
      await tx.blinkRoomPlayer.update({
        where: { id: p.id },
        data: {
          isBlinker: p.id === chosenBlinker.id,
          roleRevealed: false,
          isReady: false,
          isWinked: false,
          winkedAt: null,
        },
      });
    }

    await tx.blinkRoom.update({
      where: { id: room.id },
      data: {
        status: "PLAYING",
        currentPhase: "ROLE_REVEAL",
        roundNumber: 1,
        blinkerPlayerId: chosenBlinker.id,
        survivorPlayerId: null,
        guessTargetPlayerId: null,
        roundWinnerPlayerId: null,
        roundResultSummary: null,
        winnerId: null,
        startedAt: new Date(),
        finishedAt: null,
      },
    });

    await tx.blinkRoomAction.create({
      data: {
        roomId: room.id,
        actorId: hostPlayer.id,
        type: "START_ROUND",
        details: "Round 1 started! Check your secret roles.",
      },
    });
  });
}

export async function revealRoleAction({
  roomCode,
  actorUserId,
}: {
  roomCode: string;
  actorUserId: string;
}) {
  const room = await prisma.blinkRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: true },
  });
  if (!room || room.status !== "PLAYING") {
    throw new Error("Game is not active.");
  }

  const player = room.players.find((p) => p.userId === actorUserId);
  if (!player) {
    throw new Error("Player not found in room.");
  }

  await prisma.blinkRoomPlayer.update({
    where: { id: player.id },
    data: { roleRevealed: true },
  });

  await prisma.blinkRoomAction.create({
    data: {
      roomId: room.id,
      actorId: player.id,
      type: "REVEAL_ROLE",
      details: `${player.displayName} checked their role.`,
    },
  });
}

export async function readyAction({
  roomCode,
  actorUserId,
}: {
  roomCode: string;
  actorUserId: string;
}) {
  const room = await prisma.blinkRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: true },
  });
  if (!room || room.status !== "PLAYING") {
    throw new Error("Game is not active.");
  }

  const player = room.players.find((p) => p.userId === actorUserId);
  if (!player) {
    throw new Error("Player not found in room.");
  }

  await prisma.blinkRoomPlayer.update({
    where: { id: player.id },
    data: { isReady: true, roleRevealed: true },
  });

  await prisma.blinkRoomAction.create({
    data: {
      roomId: room.id,
      actorId: player.id,
      type: "READY",
      details: `${player.displayName} is ready!`,
    },
  });

  // Check if all players are ready now
  const allReady = room.players.every((p) => (p.id === player.id ? true : p.isReady));
  if (allReady && room.currentPhase === "ROLE_REVEAL") {
    await prisma.blinkRoom.update({
      where: { id: room.id },
      data: { currentPhase: "BLINKING" },
    });

    await prisma.blinkRoomAction.create({
      data: {
        roomId: room.id,
        type: "START_ROUND",
        details: "All players are ready! The Blinker is on the loose. Wink away! 😉",
      },
    });
  }
}

export async function gotWinkedAction({
  roomCode,
  actorUserId,
}: {
  roomCode: string;
  actorUserId: string;
}) {
  const room = await prisma.blinkRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: true },
  });
  if (!room || room.status !== "PLAYING" || room.currentPhase !== "BLINKING") {
    throw new Error("Blinking phase is not active.");
  }

  const player = room.players.find((p) => p.userId === actorUserId);
  if (!player) {
    throw new Error("Player not found in room.");
  }

  if (player.isWinked) {
    return; // Already winked
  }

  await prisma.blinkRoomPlayer.update({
    where: { id: player.id },
    data: { isWinked: true, winkedAt: new Date() },
  });

  await prisma.blinkRoomAction.create({
    data: {
      roomId: room.id,
      actorId: player.id,
      type: "GOT_WINKED",
      details: `${player.displayName} got winked! 😵`,
    },
  });

  // Calculate remaining innocent alive players (not winked and not blinker)
  const remainingInnocents = room.players.filter(
    (p) => p.id !== player.id && !p.isWinked && !p.isBlinker
  );

  // If only 1 innocent remains alive, phase transitions to GUESSING!
  if (remainingInnocents.length === 1) {
    const lastSurvivor = remainingInnocents[0];

    await prisma.blinkRoom.update({
      where: { id: room.id },
      data: {
        currentPhase: "GUESSING",
        survivorPlayerId: lastSurvivor.id,
      },
    });

    await prisma.blinkRoomAction.create({
      data: {
        roomId: room.id,
        actorId: lastSurvivor.id,
        type: "START_ROUND",
        details: `Only ${lastSurvivor.displayName} is left standing! Time to guess the Blinker! 🕵️‍♂️`,
      },
    });
  } else if (remainingInnocents.length === 0) {
    // Edge case: All innocents were winked
    const blinker = room.players.find((p) => p.isBlinker);
    if (blinker) {
      await awardRoundWin({
        roomId: room.id,
        roundWinnerPlayerId: blinker.id,
        summary: `The Blinker (${blinker.displayName}) winked everyone and won the round! 😉🏆`,
      });
    }
  }
}

export async function makeGuessAction({
  roomCode,
  actorUserId,
  guessedPlayerId,
}: {
  roomCode: string;
  actorUserId: string;
  guessedPlayerId: string;
}) {
  const room = await prisma.blinkRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: { include: { user: true } } },
  });

  if (!room || room.status !== "PLAYING" || room.currentPhase !== "GUESSING") {
    throw new Error("Guessing phase is not active.");
  }

  const survivor = room.players.find((p) => p.userId === actorUserId);
  if (!survivor || survivor.id !== room.survivorPlayerId) {
    throw new Error("Only the last surviving player can make the guess.");
  }

  const targetPlayer = room.players.find((p) => p.id === guessedPlayerId);
  if (!targetPlayer) {
    throw new Error("Guessed player not found.");
  }

  const blinkerPlayer = room.players.find((p) => p.id === room.blinkerPlayerId);
  if (!blinkerPlayer) {
    throw new Error("Blinker player not found.");
  }

  const isCorrect = targetPlayer.id === blinkerPlayer.id;
  const roundWinner = isCorrect ? survivor : blinkerPlayer;
  const summary = isCorrect
    ? `🎯 ${survivor.displayName} guessed correctly! The Blinker was ${blinkerPlayer.displayName}! ${survivor.displayName} scores +1 point!`
    : `❌ ${survivor.displayName} guessed ${targetPlayer.displayName} incorrectly! The real Blinker was ${blinkerPlayer.displayName}! ${blinkerPlayer.displayName} scores +1 point!`;

  await prisma.blinkRoomAction.create({
    data: {
      roomId: room.id,
      actorId: survivor.id,
      type: "MAKE_GUESS",
      value: targetPlayer.displayName,
      details: summary,
    },
  });

  await awardRoundWin({
    roomId: room.id,
    roundWinnerPlayerId: roundWinner.id,
    guessTargetPlayerId: targetPlayer.id,
    summary,
  });
}

async function awardRoundWin({
  roomId,
  roundWinnerPlayerId,
  guessTargetPlayerId,
  summary,
}: {
  roomId: string;
  roundWinnerPlayerId: string;
  guessTargetPlayerId?: string;
  summary: string;
}) {
  await prisma.$transaction(async (tx) => {
    // Increment score of the round winner
    const updatedWinner = await tx.blinkRoomPlayer.update({
      where: { id: roundWinnerPlayerId },
      data: { score: { increment: 1 } },
      include: { user: true },
    });

    const room = await tx.blinkRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) return;

    // Check if winner reached scoreLimit
    const hasWonMatch = updatedWinner.score >= room.scoreLimit;

    await tx.blinkRoom.update({
      where: { id: roomId },
      data: {
        roundWinnerPlayerId,
        guessTargetPlayerId: guessTargetPlayerId ?? null,
        roundResultSummary: summary,
        currentPhase: hasWonMatch ? "FINISHED" : "ROUND_OVER",
        status: hasWonMatch ? "FINISHED" : "PLAYING",
        winnerId: hasWonMatch ? updatedWinner.userId : null,
        finishedAt: hasWonMatch ? new Date() : null,
      },
    });

    if (hasWonMatch) {
      await tx.blinkRoomAction.create({
        data: {
          roomId,
          actorId: roundWinnerPlayerId,
          type: "START_ROUND",
          details: `🏆 ${updatedWinner.displayName} reached ${room.scoreLimit} points and won the entire match! 🎉`,
        },
      });
    }
  });
}

export async function nextRoundAction({
  roomCode,
  userId,
}: {
  roomCode: string;
  userId: string;
}) {
  const room = await prisma.blinkRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: true },
  });

  if (!room || room.status === "FINISHED") {
    throw new Error("Cannot start next round on a finished match.");
  }

  const hostPlayer = room.players.find((p) => p.userId === userId && p.isHost);
  if (!hostPlayer) {
    throw new Error("Only the host can start the next round.");
  }

  // Randomly pick a new Blinker for next round
  const randomIndex = crypto.randomInt(0, room.players.length);
  const chosenBlinker = room.players[randomIndex];

  await prisma.$transaction(async (tx) => {
    // Reset player round flags
    for (let i = 0; i < room.players.length; i++) {
      const p = room.players[i];
      await tx.blinkRoomPlayer.update({
        where: { id: p.id },
        data: {
          isBlinker: p.id === chosenBlinker.id,
          roleRevealed: false,
          isReady: false,
          isWinked: false,
          winkedAt: null,
        },
      });
    }

    const nextRoundNum = room.roundNumber + 1;

    await tx.blinkRoom.update({
      where: { id: room.id },
      data: {
        roundNumber: nextRoundNum,
        currentPhase: "ROLE_REVEAL",
        blinkerPlayerId: chosenBlinker.id,
        survivorPlayerId: null,
        guessTargetPlayerId: null,
        roundWinnerPlayerId: null,
        roundResultSummary: null,
      },
    });

    await tx.blinkRoomAction.create({
      data: {
        roomId: room.id,
        actorId: hostPlayer.id,
        type: "NEXT_ROUND",
        details: `Round ${nextRoundNum} started! Check your new roles.`,
      },
    });
  });
}

export async function replayBlinkGameAction({
  roomCode,
  userId,
}: {
  roomCode: string;
  userId: string;
}) {
  const room = await prisma.blinkRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: true },
  });

  if (!room) {
    throw new Error("Room not found.");
  }

  const hostPlayer = room.players.find((p) => p.userId === userId && p.isHost);
  if (!hostPlayer) {
    throw new Error("Only the host can replay the match.");
  }

  const randomIndex = crypto.randomInt(0, room.players.length);
  const chosenBlinker = room.players[randomIndex];

  await prisma.$transaction(async (tx) => {
    // Reset all scores and round flags
    for (let i = 0; i < room.players.length; i++) {
      const p = room.players[i];
      await tx.blinkRoomPlayer.update({
        where: { id: p.id },
        data: {
          score: 0,
          isBlinker: p.id === chosenBlinker.id,
          roleRevealed: false,
          isReady: false,
          isWinked: false,
          winkedAt: null,
        },
      });
    }

    await tx.blinkRoom.update({
      where: { id: room.id },
      data: {
        status: "PLAYING",
        currentPhase: "ROLE_REVEAL",
        roundNumber: 1,
        blinkerPlayerId: chosenBlinker.id,
        survivorPlayerId: null,
        guessTargetPlayerId: null,
        roundWinnerPlayerId: null,
        roundResultSummary: null,
        winnerId: null,
        startedAt: new Date(),
        finishedAt: null,
      },
    });

    await tx.blinkRoomAction.create({
      data: {
        roomId: room.id,
        actorId: hostPlayer.id,
        type: "REPLAY",
        details: "New match started! Scores reset to 0.",
      },
    });
  });
}

export async function leaveBlinkRoomAction({
  roomCode,
  userId,
}: {
  roomCode: string;
  userId: string;
}) {
  const room = await prisma.blinkRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: true },
  });

  if (!room) {
    throw new Error("Room not found.");
  }

  const leavingPlayer = room.players.find((p) => p.userId === userId);
  if (!leavingPlayer) {
    return { ok: true, deleted: false };
  }

  // If only player, delete room
  if (room.players.length <= 1) {
    await prisma.blinkRoom.delete({ where: { id: room.id } });
    return { ok: true, deleted: true };
  }

  // If host leaves, assign next host
  if (leavingPlayer.isHost) {
    const nextHost = room.players.find((p) => p.id !== leavingPlayer.id);
    if (nextHost) {
      await prisma.blinkRoomPlayer.update({
        where: { id: nextHost.id },
        data: { isHost: true },
      });
    }
  }

  await prisma.blinkRoomPlayer.delete({
    where: { id: leavingPlayer.id },
  });

  await prisma.blinkRoomAction.create({
    data: {
      roomId: room.id,
      type: "LEAVE",
      details: `${leavingPlayer.displayName} left the room.`,
    },
  });

  return { ok: true, deleted: false };
}
