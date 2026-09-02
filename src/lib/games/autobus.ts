import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import {
  AutobusAnswers,
  evaluateRoundAnswers,
  pickNextLetter,
} from "./autobus-types";

export const AUTOBUS_ROOM_CODE_REGEX = /^[A-Z0-9]{6}$/;

function generateRoomCode(): string {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    const randomIndex = crypto.randomInt(0, characters.length);
    code += characters[randomIndex];
  }
  return code;
}

export async function listPublicAutobusRooms() {
  return prisma.autobusRoom.findMany({
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
      currentLetter: true,
      _count: { select: { players: true } },
    },
  });
}

export async function createAutobusRoom({
  userId,
  title,
  visibility,
  password,
  scoreLimit = 100,
  countdownSeconds = 15,
}: {
  userId: string;
  title: string;
  visibility: "PUBLIC" | "PRIVATE";
  password?: string;
  scoreLimit?: number;
  countdownSeconds?: number;
}) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found.");

  let roomCode = generateRoomCode();
  let exists = await prisma.autobusRoom.findUnique({ where: { roomCode } });
  while (exists) {
    roomCode = generateRoomCode();
    exists = await prisma.autobusRoom.findUnique({ where: { roomCode } });
  }

  const passwordHash =
    visibility === "PRIVATE" && password ? await hashPassword(password) : null;

  const firstLetter = pickNextLetter([]);

  return prisma.autobusRoom.create({
    data: {
      roomCode,
      title: title.trim() || "أتوبيس كومبليت",
      visibility,
      passwordHash,
      scoreLimit: Math.max(30, Math.min(300, scoreLimit)),
      countdownSeconds: Math.max(10, Math.min(30, countdownSeconds)),
      currentLetter: firstLetter,
      usedLettersJson: JSON.stringify([firstLetter]),
      createdById: userId,
      status: "WAITING",
      currentPhase: "PLAYING",
      players: {
        create: {
          userId,
          displayName: user.name || "Host",
          isHost: true,
          seatIndex: 0,
          answersJson: "{}",
        },
      },
      actions: {
        create: {
          type: "JOIN",
          details: `${user.name || "Host"} created the Autobus Complete table.`,
        },
      },
    },
    select: { roomCode: true },
  });
}

export async function joinAutobusRoom({
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

  const room = await prisma.autobusRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: true },
  });

  if (!room) throw new Error("Table not found.");
  if (room.status === "FINISHED") throw new Error("This match has already ended.");

  const existingPlayer = room.players.find((p) => p.userId === userId);
  if (existingPlayer) {
    return { roomCode: room.roomCode };
  }

  if (room.visibility === "PRIVATE" && room.passwordHash) {
    if (!password) throw new Error("Password required.");
    const valid = await verifyPassword(password, room.passwordHash);
    if (!valid) throw new Error("Incorrect table password.");
  }

  if (room.players.length >= 10) {
    throw new Error("Table is full (maximum 10 players).");
  }

  await prisma.$transaction(async (tx) => {
    const seatIndex = room.players.length;
    await tx.autobusRoomPlayer.create({
      data: {
        roomId: room.id,
        userId,
        displayName: user.name || `Player ${seatIndex + 1}`,
        seatIndex,
        answersJson: "{}",
      },
    });

    await tx.autobusRoomAction.create({
      data: {
        roomId: room.id,
        type: "JOIN",
        details: `${user.name || "A player"} joined the table.`,
      },
    });
  });

  return { roomCode: room.roomCode };
}

export async function getAutobusRoomState({
  roomCode,
  currentUserId,
}: {
  roomCode: string;
  currentUserId: string;
}) {
  const room = await prisma.autobusRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: {
      players: { orderBy: { seatIndex: "asc" } },
      actions: { orderBy: { createdAt: "desc" }, take: 25 },
    },
  });

  if (!room) return null;

  const selfPlayer = room.players.find((p) => p.userId === currentUserId);
  if (!selfPlayer) return null;

  const isReviewOrOver =
    room.currentPhase === "REVIEW" ||
    room.currentPhase === "ROUND_OVER" ||
    room.status === "FINISHED";

  // Check if countdown expired, automatically transition to REVIEW
  let activePhase = room.currentPhase;
  if (
    room.currentPhase === "COUNTDOWN" &&
    room.countdownStartedAt
  ) {
    const elapsed = (Date.now() - new Date(room.countdownStartedAt).getTime()) / 1000;
    if (elapsed >= room.countdownSeconds) {
      activePhase = "REVIEW";
      await prisma.autobusRoom.update({
        where: { id: room.id },
        data: { currentPhase: "REVIEW" },
      });
    }
  }

  // Pre-calculate evaluation for review phase
  const allPlayersAnswers = room.players.map((p) => {
    let answers: AutobusAnswers = {};
    try {
      answers = JSON.parse(p.answersJson || "{}");
    } catch {
      answers = {};
    }
    return { playerId: p.id, answers };
  });

  const evaluations = isReviewOrOver
    ? evaluateRoundAnswers(room.currentLetter, allPlayersAnswers)
    : null;

  const playersState = room.players.map((p) => {
    let answers: AutobusAnswers = {};
    try {
      answers = JSON.parse(p.answersJson || "{}");
    } catch {
      answers = {};
    }

    const isSelf = p.userId === currentUserId;
    // Hide answers from other players until countdown ends & review phase begins
    const visibleAnswers = isSelf || isReviewOrOver ? answers : {};
    const filledCategoriesCount = Object.values(answers).filter(
      (v) => (v || "").trim().length > 0,
    ).length;

    const evaluation = evaluations ? evaluations[p.id] : null;

    return {
      id: p.id,
      userId: p.userId,
      displayName: p.displayName,
      seatIndex: p.seatIndex,
      score: p.score,
      roundPoints: p.roundPoints,
      isHost: p.isHost,
      hasSubmitted: p.hasSubmitted,
      filledCategoriesCount,
      answers: visibleAnswers,
      evaluation,
    };
  });

  const presser = room.players.find((p) => p.id === room.autobusPresserId);

  return {
    room: {
      id: room.id,
      roomCode: room.roomCode,
      title: room.title,
      visibility: room.visibility,
      status: room.status,
      currentPhase: activePhase,
      scoreLimit: room.scoreLimit,
      roundNumber: room.roundNumber,
      currentLetter: room.currentLetter,
      countdownStartedAt: room.countdownStartedAt?.toISOString() || null,
      countdownSeconds: room.countdownSeconds,
      autobusPresserName: presser?.displayName || null,
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
      hasSubmitted: selfPlayer.hasSubmitted,
    },
  };
}

export async function startAutobusGame({
  roomCode,
  hostUserId,
}: {
  roomCode: string;
  hostUserId: string;
}) {
  const room = await prisma.autobusRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: true },
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

  const initialLetter = pickNextLetter([]);

  await prisma.$transaction(async (tx) => {
    await tx.autobusRoomPlayer.updateMany({
      where: { roomId: room.id },
      data: {
        answersJson: "{}",
        roundPoints: 0,
        hasSubmitted: false,
      },
    });

    await tx.autobusRoom.update({
      where: { id: room.id },
      data: {
        status: "PLAYING",
        currentPhase: "PLAYING",
        roundNumber: 1,
        currentLetter: initialLetter,
        usedLettersJson: JSON.stringify([initialLetter]),
        countdownStartedAt: null,
        autobusPresserId: null,
        roundWinnerId: null,
        roundSummary: null,
      },
    });

    await tx.autobusRoomAction.create({
      data: {
        roomId: room.id,
        type: "START",
        details: `Game started! Round 1 letter is: [ ${initialLetter} ]!`,
      },
    });
  });
}

export async function submitAutobusAnswersAction({
  roomCode,
  actorUserId,
  answers,
}: {
  roomCode: string;
  actorUserId: string;
  answers: AutobusAnswers;
}) {
  const room = await prisma.autobusRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: true },
  });

  if (
    !room ||
    room.status !== "PLAYING" ||
    (room.currentPhase !== "PLAYING" && room.currentPhase !== "COUNTDOWN")
  ) {
    throw new Error("Cannot submit answers right now.");
  }

  const player = room.players.find((p) => p.userId === actorUserId);
  if (!player) throw new Error("Player not found.");

  await prisma.autobusRoomPlayer.update({
    where: { id: player.id },
    data: {
      answersJson: JSON.stringify(answers),
      hasSubmitted: true,
    },
  });
}

export async function pressAutobusBuzzerAction({
  roomCode,
  actorUserId,
  answers,
}: {
  roomCode: string;
  actorUserId: string;
  answers: AutobusAnswers;
}) {
  const room = await prisma.autobusRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: true },
  });

  if (!room || room.status !== "PLAYING" || room.currentPhase !== "PLAYING") {
    throw new Error("Autobus buzzer has already been pressed or round is over.");
  }

  const player = room.players.find((p) => p.userId === actorUserId);
  if (!player) throw new Error("Player not found.");

  await prisma.$transaction(async (tx) => {
    // Save pressing player's answers and mark submitted
    await tx.autobusRoomPlayer.update({
      where: { id: player.id },
      data: {
        answersJson: JSON.stringify(answers),
        hasSubmitted: true,
      },
    });

    // Start 15s countdown for all other players
    await tx.autobusRoom.update({
      where: { id: room.id },
      data: {
        currentPhase: "COUNTDOWN",
        countdownStartedAt: new Date(),
        autobusPresserId: player.id,
      },
    });

    await tx.autobusRoomAction.create({
      data: {
        roomId: room.id,
        actorId: player.id,
        type: "PRESS_AUTOBUS",
        details: `🚌 ${player.displayName} pressed AUTOBUS COMPLETE! 15 seconds remaining for everyone!`,
      },
    });
  });
}

export async function confirmRoundScoresAction({
  roomCode,
  userId,
}: {
  roomCode: string;
  userId: string;
}) {
  const room = await prisma.autobusRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: true },
  });

  if (!room || (room.currentPhase !== "REVIEW" && room.currentPhase !== "COUNTDOWN")) {
    throw new Error("Cannot confirm scores right now.");
  }

  const isHost = room.createdById === userId;
  if (!isHost) throw new Error("Only the host can confirm round scores.");

  const allPlayersAnswers = room.players.map((p) => {
    let answers: AutobusAnswers = {};
    try {
      answers = JSON.parse(p.answersJson || "{}");
    } catch {
      answers = {};
    }
    return { playerId: p.id, answers };
  });

  const evaluations = evaluateRoundAnswers(room.currentLetter, allPlayersAnswers);

  let highestScore = 0;
  let matchWinnerUserId: string | null = null;
  let roundTopPlayerId: string | null = null;
  let roundTopPoints = -1;

  await prisma.$transaction(async (tx) => {
    for (const player of room.players) {
      const evaluation = evaluations[player.id];
      const pts = evaluation?.totalRoundPoints || 0;
      const newScore = player.score + pts;

      if (pts > roundTopPoints) {
        roundTopPoints = pts;
        roundTopPlayerId = player.id;
      }

      if (newScore >= room.scoreLimit && newScore > highestScore) {
        highestScore = newScore;
        matchWinnerUserId = player.userId;
      }

      await tx.autobusRoomPlayer.update({
        where: { id: player.id },
        data: {
          roundPoints: pts,
          score: newScore,
        },
      });
    }

    const isMatchOver = matchWinnerUserId !== null;

    await tx.autobusRoom.update({
      where: { id: room.id },
      data: {
        status: isMatchOver ? "FINISHED" : "PLAYING",
        currentPhase: isMatchOver ? "FINISHED" : "ROUND_OVER",
        roundWinnerId: roundTopPlayerId,
        winnerId: matchWinnerUserId,
        roundSummary: `Round ${room.roundNumber} ended! Top score: ${roundTopPoints} pts.`,
      },
    });

    await tx.autobusRoomAction.create({
      data: {
        roomId: room.id,
        type: "CONFIRM_SCORES",
        details: `Scores confirmed for Round ${room.roundNumber}!`,
      },
    });
  });
}

export async function nextRoundAutobusAction({
  roomCode,
  userId,
}: {
  roomCode: string;
  userId: string;
}) {
  const room = await prisma.autobusRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: true },
  });

  if (!room || room.currentPhase !== "ROUND_OVER") {
    throw new Error("Round is not over.");
  }
  if (room.createdById !== userId) {
    throw new Error("Only the host can advance to the next round.");
  }

  let usedLetters: string[] = [];
  try {
    usedLetters = JSON.parse(room.usedLettersJson || "[]");
  } catch {
    usedLetters = [];
  }

  const nextLetter = pickNextLetter(usedLetters);
  usedLetters.push(nextLetter);

  await prisma.$transaction(async (tx) => {
    await tx.autobusRoomPlayer.updateMany({
      where: { roomId: room.id },
      data: {
        answersJson: "{}",
        roundPoints: 0,
        hasSubmitted: false,
      },
    });

    await tx.autobusRoom.update({
      where: { id: room.id },
      data: {
        currentPhase: "PLAYING",
        roundNumber: room.roundNumber + 1,
        currentLetter: nextLetter,
        usedLettersJson: JSON.stringify(usedLetters),
        countdownStartedAt: null,
        autobusPresserId: null,
        roundWinnerId: null,
        roundSummary: null,
      },
    });

    await tx.autobusRoomAction.create({
      data: {
        roomId: room.id,
        type: "NEXT_ROUND",
        details: `Round ${room.roundNumber + 1} started with letter: [ ${nextLetter} ]!`,
      },
    });
  });
}

export async function replayAutobusGameAction({
  roomCode,
  userId,
}: {
  roomCode: string;
  userId: string;
}) {
  const room = await prisma.autobusRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: true },
  });

  if (!room || room.status !== "FINISHED") {
    throw new Error("Match is not finished.");
  }
  if (room.createdById !== userId) {
    throw new Error("Only the host can reset the match.");
  }

  const initialLetter = pickNextLetter([]);

  await prisma.$transaction(async (tx) => {
    await tx.autobusRoomPlayer.updateMany({
      where: { roomId: room.id },
      data: {
        score: 0,
        roundPoints: 0,
        answersJson: "{}",
        hasSubmitted: false,
      },
    });

    await tx.autobusRoom.update({
      where: { id: room.id },
      data: {
        status: "PLAYING",
        currentPhase: "PLAYING",
        roundNumber: 1,
        currentLetter: initialLetter,
        usedLettersJson: JSON.stringify([initialLetter]),
        countdownStartedAt: null,
        autobusPresserId: null,
        roundWinnerId: null,
        winnerId: null,
        roundSummary: null,
      },
    });

    await tx.autobusRoomAction.create({
      data: {
        roomId: room.id,
        type: "REPLAY",
        details: "Match scores reset! New match starting.",
      },
    });
  });
}

export async function leaveAutobusRoomAction({
  roomCode,
  userId,
}: {
  roomCode: string;
  userId: string;
}) {
  const room = await prisma.autobusRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: true },
  });

  if (!room) throw new Error("Table not found.");

  const player = room.players.find((p) => p.userId === userId);
  if (!player) return { deleted: false };

  if (player.isHost || room.players.length <= 1) {
    await prisma.autobusRoom.delete({ where: { id: room.id } });
    return { deleted: true };
  }

  await prisma.$transaction(async (tx) => {
    await tx.autobusRoomPlayer.delete({ where: { id: player.id } });
    await tx.autobusRoomAction.create({
      data: {
        roomId: room.id,
        type: "LEAVE",
        details: `${player.displayName} left the table.`,
      },
    });
  });

  return { deleted: false };
}
