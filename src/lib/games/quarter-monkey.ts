import type {
  Prisma,
  QuarterMonkeyActionType,
  QuarterMonkeyRoom,
  QuarterMonkeyRoomPlayer,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { validateCountryNameWithGemini } from "@/lib/gemini";
import { normalizeWord } from "@/lib/countries";

export const QUARTER_MONKEY_ROOM_CODE_REGEX = /^\d{8}$/;

export type QuarterMonkeyRoomState = Prisma.QuarterMonkeyRoomGetPayload<{
  include: {
    players: true;
    actions: {
      orderBy: { createdAt: "desc" };
      take: 20;
    };
  };
}>;

function ensureRoomCode(roomCode: string) {
  if (!QUARTER_MONKEY_ROOM_CODE_REGEX.test(roomCode)) {
    throw new Error("Room code must be exactly 8 digits.");
  }
}

function activePlayers(players: QuarterMonkeyRoomPlayer[]) {
  return [...players]
    .filter((player) => player.eliminatedAt === null)
    .sort((a, b) => a.turnOrder - b.turnOrder);
}

function nextActivePlayerFromTurnOrder(
  players: QuarterMonkeyRoomPlayer[],
  fromTurnOrder: number,
) {
  const living = activePlayers(players);
  if (living.length <= 1) {
    return null;
  }

  const next = living.find((player) => player.turnOrder > fromTurnOrder);
  return next ?? living[0];
}

function actorInTurn(
  room: QuarterMonkeyRoomState,
  actorPlayerId: string,
  expectedPlayerId: string | null,
) {
  if (!expectedPlayerId || actorPlayerId !== expectedPlayerId) {
    throw new Error("It is not your turn.");
  }

  const actor = room.players.find((player) => player.id === actorPlayerId);
  if (!actor || actor.eliminatedAt) {
    throw new Error("You are not eligible to act in this room.");
  }

  return actor;
}

async function assignPenaltyAndResetRound(
  tx: Prisma.TransactionClient,
  room: QuarterMonkeyRoomState,
  penalizedPlayerId: string,
  details: string,
  newUsedWord?: string | null,
) {
  const penalizedPlayer = room.players.find((player) => player.id === penalizedPlayerId);
  if (!penalizedPlayer) {
    throw new Error("Penalized player was not found.");
  }

  const newPenaltyScore = penalizedPlayer.penaltyScore + 1;
  const eliminated = newPenaltyScore >= room.scoreLimit;

  await tx.quarterMonkeyRoomPlayer.update({
    where: { id: penalizedPlayer.id },
    data: {
      penaltyScore: newPenaltyScore,
      eliminatedAt: eliminated ? new Date() : null,
    },
  });

  const updatedPlayers = room.players.map((player) =>
    player.id === penalizedPlayer.id
      ? {
          ...player,
          penaltyScore: newPenaltyScore,
          eliminatedAt: eliminated ? new Date() : null,
        }
      : player,
  );

  const updatedUsedWords = newUsedWord && !room.usedWords.includes(newUsedWord)
    ? [...room.usedWords, newUsedWord]
    : room.usedWords;

  const livingPlayers = activePlayers(updatedPlayers);
  if (livingPlayers.length <= 1) {
    await tx.quarterMonkeyRoom.update({
      where: { id: room.id },
      data: {
        status: "FINISHED",
        winnerId: livingPlayers[0]?.userId ?? null,
        finishedAt: new Date(),
        currentWord: "",
        usedWords: updatedUsedWords,
        currentTurnPlayerId: null,
        previousTurnPlayerId: null,
        challengeByPlayerId: null,
        challengeTargetPlayerId: null,
        challengePrefix: null,
      },
    });
  } else {
    const next = nextActivePlayerFromTurnOrder(updatedPlayers, penalizedPlayer.turnOrder);
    await tx.quarterMonkeyRoom.update({
      where: { id: room.id },
      data: {
        currentWord: "",
        usedWords: updatedUsedWords,
        currentTurnPlayerId: next?.id ?? null,
        turnStartedAt: new Date(),
        previousTurnPlayerId: null,
        challengeByPlayerId: null,
        challengeTargetPlayerId: null,
        challengePrefix: null,
      },
    });
  }

  await tx.quarterMonkeyRoomAction.create({
    data: {
      roomId: room.id,
      actorId: penalizedPlayerId,
      type: "ROUND_RESULT",
      success: !eliminated,
      details,
    },
  });
}

async function appendAction(
  tx: Prisma.TransactionClient,
  input: {
    roomId: string;
    actorId?: string | null;
    type: QuarterMonkeyActionType;
    value?: string | null;
    success?: boolean | null;
    details?: string | null;
  },
) {
  await tx.quarterMonkeyRoomAction.create({
    data: {
      roomId: input.roomId,
      actorId: input.actorId ?? null,
      type: input.type,
      value: input.value ?? null,
      success: input.success ?? null,
      details: input.details ?? null,
    },
  });
}

async function generateUniqueRoomCode() {
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const roomCode = Math.floor(10_000_000 + Math.random() * 90_000_000).toString();
    const exists = await prisma.quarterMonkeyRoom.findUnique({
      where: { roomCode },
      select: { id: true },
    });
    if (!exists) {
      return roomCode;
    }
  }

  throw new Error("Could not generate unique room code. Please retry.");
}

export async function createRoom(input: {
  userId: string;
  displayName: string;
  title: string;
  visibility: "PUBLIC" | "PRIVATE";
  password?: string;
  scoreLimit: number;
  turnTimerSeconds?: number | null;
}) {
  const title = input.title.trim();
  if (!title) {
    throw new Error("Room title is required.");
  }

  if (input.visibility === "PRIVATE" && !input.password) {
    throw new Error("Private rooms require a password.");
  }

  const passwordHash =
    input.visibility === "PRIVATE" && input.password
      ? await hashPassword(input.password.trim())
      : null;
  const roomCode = await generateUniqueRoomCode();

  const turnTimerSeconds =
    typeof input.turnTimerSeconds === "number" && input.turnTimerSeconds > 0
      ? input.turnTimerSeconds
      : input.turnTimerSeconds === 0
        ? null
        : 30;

  const room = await prisma.quarterMonkeyRoom.create({
    data: {
      roomCode,
      title,
      visibility: input.visibility,
      passwordHash,
      scoreLimit: input.scoreLimit,
      turnTimerSeconds,
      turnStartedAt: new Date(),
      usedWords: [],
      createdById: input.userId,
      players: {
        create: {
          userId: input.userId,
          displayName: input.displayName,
          turnOrder: 1,
          isHost: true,
        },
      },
    },
    include: { players: true },
  });

  await prisma.quarterMonkeyRoomAction.create({
    data: {
      roomId: room.id,
      actorId: room.players[0]?.id ?? null,
      type: "JOIN",
      details: `${input.displayName} created the room.`,
    },
  });

  return room;
}

export async function listPublicRooms() {
  return prisma.quarterMonkeyRoom.findMany({
    where: {
      visibility: "PUBLIC",
      status: { in: ["WAITING", "PLAYING"] },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      players: true,
    },
    take: 30,
  });
}

export async function joinRoom(input: {
  roomCode: string;
  userId: string;
  displayName: string;
  password?: string;
}) {
  ensureRoomCode(input.roomCode);
  const room = await prisma.quarterMonkeyRoom.findUnique({
    where: { roomCode: input.roomCode },
    include: { players: true },
  });

  if (!room) {
    throw new Error("Room not found.");
  }
  if (room.status === "FINISHED") {
    throw new Error("This room has already finished.");
  }

  const existingPlayer = room.players.find((player) => player.userId === input.userId);
  if (existingPlayer) {
    return room;
  }

  if (room.visibility === "PRIVATE") {
    if (!room.passwordHash || !input.password) {
      throw new Error("Password is required for this room.");
    }

    const passwordValid = await verifyPassword(input.password, room.passwordHash);
    if (!passwordValid) {
      throw new Error("Incorrect room password.");
    }
  }

  const turnOrder = room.players.length + 1;
  await prisma.$transaction(async (tx) => {
    const player = await tx.quarterMonkeyRoomPlayer.create({
      data: {
        roomId: room.id,
        userId: input.userId,
        displayName: input.displayName,
        turnOrder,
      },
    });

    await appendAction(tx, {
      roomId: room.id,
      actorId: player.id,
      type: "JOIN",
      details: `${input.displayName} joined the room.`,
    });
  });

  return prisma.quarterMonkeyRoom.findUnique({
    where: { id: room.id },
    include: { players: true },
  });
}

export async function startRoomGame(input: { roomCode: string; userId: string }) {
  ensureRoomCode(input.roomCode);

  return prisma.$transaction(async (tx) => {
    const room = await tx.quarterMonkeyRoom.findUnique({
      where: { roomCode: input.roomCode },
      include: { players: true },
    });
    if (!room) {
      throw new Error("Room not found.");
    }
    if (room.status !== "WAITING") {
      throw new Error("Game has already started.");
    }

    const host = room.players.find((player) => player.isHost);
    if (!host || host.userId !== input.userId) {
      throw new Error("Only the host can start the game.");
    }

    const living = activePlayers(room.players);
    if (living.length < 2) {
      throw new Error("At least 2 players are required.");
    }

    await tx.quarterMonkeyRoom.update({
      where: { id: room.id },
      data: {
        status: "PLAYING",
        startedAt: new Date(),
        turnStartedAt: new Date(),
        currentTurnPlayerId: living[0].id,
      },
    });

    await appendAction(tx, {
      roomId: room.id,
      actorId: host.id,
      type: "START",
      details: "Game started.",
    });
  });
}

export async function getRoomState(roomCode: string) {
  ensureRoomCode(roomCode);

  const room = await prisma.quarterMonkeyRoom.findUnique({
    where: { roomCode },
    include: {
      players: {
        orderBy: { turnOrder: "asc" },
      },
      actions: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!room) {
    throw new Error("Room not found.");
  }

  return room;
}

export async function addCharacterAction(input: {
  roomCode: string;
  actorUserId: string;
  character: string;
}) {
  ensureRoomCode(input.roomCode);
  const character = input.character.trim();
  if (Array.from(character).length !== 1) {
    throw new Error("You must add exactly one character.");
  }

  await prisma.$transaction(async (tx) => {
    const room = await tx.quarterMonkeyRoom.findUnique({
      where: { roomCode: input.roomCode },
      include: { players: true, actions: { orderBy: { createdAt: "desc" }, take: 20 } },
    });
    if (!room) {
      throw new Error("Room not found.");
    }
    if (room.status !== "PLAYING") {
      throw new Error("Game is not currently active.");
    }
    if (room.challengeTargetPlayerId) {
      throw new Error("A challenge is pending and must be resolved first.");
    }

    const actor = room.players.find((player) => player.userId === input.actorUserId);
    if (!actor) {
      throw new Error("You are not a player in this room.");
    }

    actorInTurn(room, actor.id, room.currentTurnPlayerId);
    const next = nextActivePlayerFromTurnOrder(room.players, actor.turnOrder);
    if (!next) {
      throw new Error("Not enough active players to continue.");
    }

    await tx.quarterMonkeyRoom.update({
      where: { id: room.id },
      data: {
        currentWord: `${room.currentWord}${character}`,
        previousTurnPlayerId: actor.id,
        currentTurnPlayerId: next.id,
        turnStartedAt: new Date(),
      },
    });

    await appendAction(tx, {
      roomId: room.id,
      actorId: actor.id,
      type: "ADD_CHAR",
      value: character,
      success: true,
    });
  });
}

export async function suspectPreviousPlayerAction(input: {
  roomCode: string;
  actorUserId: string;
}) {
  ensureRoomCode(input.roomCode);

  await prisma.$transaction(async (tx) => {
    const room = await tx.quarterMonkeyRoom.findUnique({
      where: { roomCode: input.roomCode },
      include: { players: true, actions: { orderBy: { createdAt: "desc" }, take: 20 } },
    });
    if (!room) {
      throw new Error("Room not found.");
    }
    if (room.status !== "PLAYING") {
      throw new Error("Game is not currently active.");
    }
    if (!room.previousTurnPlayerId) {
      throw new Error("No previous player to suspect yet.");
    }
    if (room.challengeTargetPlayerId) {
      throw new Error("A challenge is already pending.");
    }

    const actor = room.players.find((player) => player.userId === input.actorUserId);
    if (!actor) {
      throw new Error("You are not a player in this room.");
    }
    actorInTurn(room, actor.id, room.currentTurnPlayerId);

    if (actor.id === room.previousTurnPlayerId) {
      throw new Error("You cannot suspect yourself.");
    }

    await tx.quarterMonkeyRoom.update({
      where: { id: room.id },
      data: {
        challengeByPlayerId: actor.id,
        challengeTargetPlayerId: room.previousTurnPlayerId,
        challengePrefix: room.currentWord,
        currentTurnPlayerId: room.previousTurnPlayerId,
        turnStartedAt: new Date(),
      },
    });

    await appendAction(tx, {
      roomId: room.id,
      actorId: actor.id,
      type: "SUSPECT",
      value: room.currentWord,
      success: true,
      details: "Previous player was challenged to complete the country.",
    });
  });
}

export async function completeChallengeAction(input: {
  roomCode: string;
  actorUserId: string;
  completedWord: string;
}) {
  ensureRoomCode(input.roomCode);
  const completedWord = input.completedWord.trim();
  if (!completedWord) {
    throw new Error("Completed word is required.");
  }

  const room = await prisma.quarterMonkeyRoom.findUnique({
    where: { roomCode: input.roomCode },
    include: { players: true, actions: { orderBy: { createdAt: "desc" }, take: 20 } },
  });
  if (!room) {
    throw new Error("Room not found.");
  }
  if (room.status !== "PLAYING") {
    throw new Error("Game is not currently active.");
  }
  if (!room.challengeTargetPlayerId || !room.challengeByPlayerId || !room.challengePrefix) {
    throw new Error("No challenge is pending.");
  }

  const actor = room.players.find((player) => player.userId === input.actorUserId);
  if (!actor) {
    throw new Error("You are not a player in this room.");
  }
  actorInTurn(room, actor.id, room.currentTurnPlayerId);

  if (actor.id !== room.challengeTargetPlayerId) {
    throw new Error("Only the challenged player can complete the word.");
  }

  if (!completedWord.startsWith(room.challengePrefix)) {
    throw new Error("Completed word must start with the challenge prefix.");
  }

  // Duplicate word check
  const normalizedCandidate = normalizeWord(completedWord);
  const isDuplicate = room.usedWords.includes(normalizedCandidate);

  // Validate country
  let validation: { valid: boolean; normalizedName?: string; explanation: string };
  if (isDuplicate) {
    validation = {
      valid: false,
      explanation: `Word "${completedWord}" was already used in this game.`,
    };
  } else {
    validation = await validateCountryNameWithGemini(completedWord);
  }

  const penalizedPlayerId = validation.valid ? room.challengeByPlayerId : actor.id;
  const details = validation.valid
    ? `Challenge failed. "${validation.normalizedName ?? completedWord}" is valid.`
    : `Challenge succeeded. "${completedWord}" is invalid or duplicate.`;

  const wordToRecord = validation.valid ? normalizeWord(validation.normalizedName ?? completedWord) : null;

  await prisma.$transaction(async (tx) => {
    await appendAction(tx, {
      roomId: room.id,
      actorId: actor.id,
      type: "COMPLETE_CHALLENGE",
      value: completedWord,
      success: validation.valid,
      details: validation.explanation,
    });

    await assignPenaltyAndResetRound(tx, room, penalizedPlayerId, details, wordToRecord);
  });
}

export async function finishWordAction(input: {
  roomCode: string;
  actorUserId: string;
  character?: string;
}) {
  ensureRoomCode(input.roomCode);

  const room = await prisma.quarterMonkeyRoom.findUnique({
    where: { roomCode: input.roomCode },
    include: { players: true, actions: { orderBy: { createdAt: "desc" }, take: 20 } },
  });
  if (!room) {
    throw new Error("Room not found.");
  }
  if (room.status !== "PLAYING") {
    throw new Error("Game is not currently active.");
  }
  if (room.challengeTargetPlayerId) {
    throw new Error("Resolve the active challenge first.");
  }

  const actor = room.players.find((player) => player.userId === input.actorUserId);
  if (!actor) {
    throw new Error("You are not a player in this room.");
  }
  actorInTurn(room, actor.id, room.currentTurnPlayerId);

  const addedChar = (input.character ?? "").trim();
  const candidateWord = addedChar ? `${room.currentWord}${addedChar}`.trim() : room.currentWord.trim();
  if (!candidateWord) {
    throw new Error("You must provide a letter or have an existing word to finish.");
  }

  // Duplicate check
  const normalizedCandidate = normalizeWord(candidateWord);
  const isDuplicate = room.usedWords.includes(normalizedCandidate);

  let validation: { valid: boolean; normalizedName?: string; explanation: string };
  if (isDuplicate) {
    validation = {
      valid: false,
      explanation: `Word "${candidateWord}" was already used in this game.`,
    };
  } else {
    validation = await validateCountryNameWithGemini(candidateWord);
  }

  // In Quarter Monkey, the player who completes a valid word receives the penalty point!
  const penalizedPlayerId = actor.id;
  const details = validation.valid
    ? `Word completed: "${validation.normalizedName ?? candidateWord}". ${actor.displayName} finished the word and received a penalty.`
    : `Word rejected: "${candidateWord}" is not a valid country. ${actor.displayName} penalized for invalid finish claim.`;

  const wordToRecord = validation.valid ? normalizeWord(validation.normalizedName ?? candidateWord) : null;

  await prisma.$transaction(async (tx) => {
    await appendAction(tx, {
      roomId: room.id,
      actorId: actor.id,
      type: "FINISH_WORD",
      value: candidateWord,
      success: validation.valid,
      details: validation.explanation || details,
    });

    await assignPenaltyAndResetRound(tx, room, penalizedPlayerId, details, wordToRecord);
  });
}

export async function timeoutTurnAction(input: { roomCode: string; actorUserId?: string }) {
  ensureRoomCode(input.roomCode);

  const room = await prisma.quarterMonkeyRoom.findUnique({
    where: { roomCode: input.roomCode },
    include: { players: true, actions: { orderBy: { createdAt: "desc" }, take: 20 } },
  });
  if (!room || room.status !== "PLAYING") {
    return { ok: false, reason: "Game is not active." };
  }

  if (!room.turnTimerSeconds || room.turnTimerSeconds <= 0) {
    return { ok: false, reason: "No turn timer in this room." };
  }

  const currentTurnPlayer = room.players.find((p) => p.id === room.currentTurnPlayerId);
  if (!currentTurnPlayer) {
    return { ok: false, reason: "No current turn player." };
  }

  const elapsedSeconds = room.turnStartedAt
    ? (Date.now() - new Date(room.turnStartedAt).getTime()) / 1000
    : 0;

  // Allow a tiny 1-second margin of error
  if (elapsedSeconds < room.turnTimerSeconds - 1) {
    return { ok: false, reason: "Turn has not timed out yet." };
  }

  const details = `${currentTurnPlayer.displayName} ran out of time (${room.turnTimerSeconds}s) and received a penalty point.`;

  await prisma.$transaction(async (tx) => {
    await appendAction(tx, {
      roomId: room.id,
      actorId: currentTurnPlayer.id,
      type: "TIMEOUT",
      details,
    });

    await assignPenaltyAndResetRound(tx, room, currentTurnPlayer.id, details);
  });

  return { ok: true };
}

export async function replayGameAction(input: { roomCode: string; userId: string }) {
  ensureRoomCode(input.roomCode);

  return prisma.$transaction(async (tx) => {
    const room = await tx.quarterMonkeyRoom.findUnique({
      where: { roomCode: input.roomCode },
      include: { players: { orderBy: { turnOrder: "asc" } } },
    });
    if (!room) {
      throw new Error("Room not found.");
    }

    const player = room.players.find((p) => p.userId === input.userId);
    if (!player) {
      throw new Error("You are not a player in this room.");
    }

    if (room.players.length < 2) {
      throw new Error("At least 2 players are required to play.");
    }

    // Reset all players
    await tx.quarterMonkeyRoomPlayer.updateMany({
      where: { roomId: room.id },
      data: {
        penaltyScore: 0,
        eliminatedAt: null,
      },
    });

    // Reset room state
    await tx.quarterMonkeyRoom.update({
      where: { id: room.id },
      data: {
        status: "PLAYING",
        winnerId: null,
        finishedAt: null,
        startedAt: new Date(),
        turnStartedAt: new Date(),
        currentWord: "",
        usedWords: [],
        previousTurnPlayerId: null,
        challengeByPlayerId: null,
        challengeTargetPlayerId: null,
        challengePrefix: null,
        currentTurnPlayerId: room.players[0].id,
      },
    });

    await appendAction(tx, {
      roomId: room.id,
      actorId: player.id,
      type: "REPLAY",
      details: `${player.displayName} restarted the game!`,
    });
  });
}

export async function leaveRoomAction(input: { roomCode: string; userId: string }) {
  ensureRoomCode(input.roomCode);

  return prisma.$transaction(async (tx) => {
    const room = await tx.quarterMonkeyRoom.findUnique({
      where: { roomCode: input.roomCode },
      include: { players: { orderBy: { turnOrder: "asc" } } },
    });
    if (!room) {
      return { deleted: true };
    }

    const leavingPlayer = room.players.find((p) => p.userId === input.userId);
    if (!leavingPlayer) {
      return { ok: true };
    }

    const remainingPlayers = room.players.filter((p) => p.id !== leavingPlayer.id);

    // If no players remain, delete the entire room from DB!
    if (remainingPlayers.length === 0) {
      await tx.quarterMonkeyRoom.delete({
        where: { id: room.id },
      });
      return { deleted: true };
    }

    // If the leaving player was the host, assign the first remaining player as host
    if (leavingPlayer.isHost) {
      await tx.quarterMonkeyRoomPlayer.update({
        where: { id: remainingPlayers[0].id },
        data: { isHost: true },
      });
    }

    // Delete the leaving player
    await tx.quarterMonkeyRoomPlayer.delete({
      where: { id: leavingPlayer.id },
    });

    // If game was playing and leaving player was current turn, pass turn
    if (room.status === "PLAYING") {
      const living = activePlayers(remainingPlayers);
      if (living.length <= 1) {
        await tx.quarterMonkeyRoom.update({
          where: { id: room.id },
          data: {
            status: "FINISHED",
            winnerId: living[0]?.userId ?? null,
            finishedAt: new Date(),
            currentTurnPlayerId: null,
            previousTurnPlayerId: null,
          },
        });
      } else if (room.currentTurnPlayerId === leavingPlayer.id) {
        const next = nextActivePlayerFromTurnOrder(remainingPlayers, leavingPlayer.turnOrder);
        await tx.quarterMonkeyRoom.update({
          where: { id: room.id },
          data: {
            currentTurnPlayerId: next?.id ?? null,
            turnStartedAt: new Date(),
          },
        });
      }
    }

    await appendAction(tx, {
      roomId: room.id,
      type: "LEAVE",
      details: `${leavingPlayer.displayName} left the room.`,
    });

    return { deleted: false };
  });
}
