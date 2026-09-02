import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { pickSecretWordAndCandidates } from "./bekasa-words";

export const BEKASA_ROOM_CODE_REGEX = /^[A-Z0-9]{6}$/;

function generateRoomCode(): string {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    const randomIndex = crypto.randomInt(0, characters.length);
    code += characters[randomIndex];
  }
  return code;
}

export interface QuestionQueueItem {
  askerId: string;
  targetId: string;
  done: boolean;
}

export interface BonusQueueItem {
  askerId: string;
  targetId?: string | null;
  skipped: boolean;
  done: boolean;
}

// Generate randomized round-robin question pairs where every player asks 1 and is asked 1 (no self-loops)
function generateQuestionSchedule(playerIds: string[]): QuestionQueueItem[] {
  const n = playerIds.length;
  if (n < 2) return [];

  // Fisher-Yates shuffle
  const askers = [...playerIds].sort(() => Math.random() - 0.5);

  // Shift by a random offset between 1 and n-1 to guarantee derangement (nobody asks themselves)
  const offset = crypto.randomInt(1, n);
  const targets = askers.map((_, i) => askers[(i + offset) % n]);

  return askers.map((askerId, i) => ({
    askerId,
    targetId: targets[i],
    done: false,
  }));
}

export async function listPublicBekasaRooms() {
  return prisma.bekasaRoom.findMany({
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

export async function createBekasaRoom({
  userId,
  displayName,
  title,
  visibility,
  password,
  scoreLimit = 3,
  categoryId = "football",
}: {
  userId: string;
  displayName: string;
  title: string;
  visibility: "PUBLIC" | "PRIVATE";
  password?: string;
  scoreLimit?: number;
  categoryId?: string;
}) {
  const trimmedTitle = title.trim();
  if (trimmedTitle.length < 2 || trimmedTitle.length > 80) {
    throw new Error("Room title must be between 2 and 80 characters.");
  }

  const limit = Math.min(Math.max(scoreLimit, 1), 20);
  let passwordHash: string | null = null;
  if (visibility === "PRIVATE") {
    if (!password || password.length < 4) {
      throw new Error("Private rooms require a password with at least 4 characters.");
    }
    passwordHash = await hashPassword(password);
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const roomCode = generateRoomCode();
    try {
      const room = await prisma.bekasaRoom.create({
        data: {
          roomCode,
          title: trimmedTitle,
          visibility,
          passwordHash,
          scoreLimit: limit,
          categoryId,
          createdById: userId,
          status: "WAITING",
          currentPhase: "ROLE_REVEAL",
          players: {
            create: {
              userId,
              displayName: displayName.trim() || "Host",
              isHost: true,
            },
          },
          actions: {
            create: {
              type: "JOIN",
              details: `${displayName.trim() || "Host"} created the room.`,
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

export async function joinBekasaRoom({
  roomCode,
  userId,
  displayName,
  password,
}: {
  roomCode: string;
  userId: string;
  displayName: string;
  password?: string;
}) {
  const normalizedCode = roomCode.toUpperCase().trim();
  const room = await prisma.bekasaRoom.findUnique({
    where: { roomCode: normalizedCode },
    include: { players: true },
  });

  if (!room) {
    throw new Error("Room not found.");
  }

  if (room.status === "FINISHED") {
    throw new Error("This game match is already finished.");
  }

  const existingPlayer = room.players.find((p) => p.userId === userId);
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
    if (!password) {
      throw new Error("Password required for private rooms.");
    }
    const valid = await verifyPassword(password, room.passwordHash ?? "");
    if (!valid) {
      throw new Error("Incorrect room password.");
    }
  }

  const newPlayer = await prisma.bekasaRoomPlayer.create({
    data: {
      roomId: room.id,
      userId,
      displayName: displayName.trim() || "Player",
      isHost: false,
    },
  });

  await prisma.bekasaRoomAction.create({
    data: {
      roomId: room.id,
      actorId: newPlayer.id,
      type: "JOIN",
      details: `${newPlayer.displayName} joined the room.`,
    },
  });

  return { room, player: newPlayer };
}

export async function getBekasaRoomState(roomCode: string, currentUserId: string) {
  const normalizedCode = roomCode.toUpperCase().trim();
  const room = await prisma.bekasaRoom.findUnique({
    where: { roomCode: normalizedCode },
    include: {
      players: { orderBy: { createdAt: "asc" } },
      actions: { orderBy: { createdAt: "desc" }, take: 30 },
    },
  });

  if (!room) {
    throw new Error("Room not found.");
  }

  const selfPlayer = room.players.find((p) => p.userId === currentUserId);
  if (!selfPlayer) {
    throw new Error("Join the room first.");
  }

  const isRoundOver =
    room.currentPhase === "REVEAL_VOTES" ||
    room.currentPhase === "BEKAS_GUESS" ||
    room.currentPhase === "ROUND_OVER" ||
    room.currentPhase === "FINISHED" ||
    room.status === "FINISHED";

  // Hide secret word from Bekas until the round is over!
  const shouldHideSecretWord = selfPlayer.isBekas && !isRoundOver;

  // Mask other players' votes until REVEAL_VOTES
  const isVotingRevealed = isRoundOver || room.currentPhase === "REVEAL_VOTES";

  const sanitizedPlayers = room.players.map((p) => {
    const showRole = isRoundOver || p.userId === currentUserId;
    const showVote = isVotingRevealed || p.userId === currentUserId;

    return {
      id: p.id,
      userId: p.userId,
      displayName: p.displayName,
      score: p.score,
      isHost: p.isHost,
      isBekas: showRole ? p.isBekas : null,
      roleRevealed: p.roleRevealed,
      isReady: p.isReady,
      votedPlayerId: showVote ? p.votedPlayerId : null,
      hasVoted: Boolean(p.votedPlayerId),
      bekasGuessedWord: isRoundOver ? p.bekasGuessedWord : null,
      bekasGuessCorrect: isRoundOver ? p.bekasGuessCorrect : null,
    };
  });

  let parsedCandidates: Array<{ ar: string; en: string }> = [];
  try {
    parsedCandidates = JSON.parse(room.candidateWordsJson || "[]");
  } catch {
    parsedCandidates = [];
  }

  let questionQueue: QuestionQueueItem[] = [];
  try {
    questionQueue = JSON.parse(room.questionQueueJson || "[]");
  } catch {
    questionQueue = [];
  }

  let bonusQueue: BonusQueueItem[] = [];
  try {
    bonusQueue = JSON.parse(room.bonusQueueJson || "[]");
  } catch {
    bonusQueue = [];
  }

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
      categoryId: room.categoryId,
      categoryNameAr: room.categoryNameAr,
      categoryNameEn: room.categoryNameEn,
      secretWordAr: shouldHideSecretWord ? "???" : room.secretWordAr,
      secretWordEn: shouldHideSecretWord ? "???" : room.secretWordEn,
      candidateWords: parsedCandidates,
      bekasPlayerId: isRoundOver ? room.bekasPlayerId : null,
      questionQueue,
      currentQuestionIndex: room.currentQuestionIndex,
      bonusQueue,
      currentBonusIndex: room.currentBonusIndex,
      roundResultSummary: room.roundResultSummary,
      createdById: room.createdById,
      winnerId: room.winnerId,
      players: sanitizedPlayers,
      actions: room.actions,
    },
    selfPlayer: {
      id: selfPlayer.id,
      userId: selfPlayer.userId,
      displayName: selfPlayer.displayName,
      score: selfPlayer.score,
      isHost: selfPlayer.isHost,
      isBekas: selfPlayer.isBekas,
      roleRevealed: selfPlayer.roleRevealed,
      isReady: selfPlayer.isReady,
      votedPlayerId: selfPlayer.votedPlayerId,
      hasVoted: Boolean(selfPlayer.votedPlayerId),
    },
  };
}

export async function startBekasaRoom({
  roomCode,
  userId,
  categoryId,
}: {
  roomCode: string;
  userId: string;
  categoryId?: string;
}) {
  const normalizedCode = roomCode.toUpperCase().trim();
  const room = await prisma.bekasaRoom.findUnique({
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
    throw new Error("At least 3 players are required to play بكاسة (Bekasa).");
  }

  // Pick Category & Secret Word with close candidate distractors
  const chosenCat = categoryId || room.categoryId;
  const wordPayload = pickSecretWordAndCandidates(chosenCat);

  // Pick random Bekas
  const randomIndex = crypto.randomInt(0, room.players.length);
  const chosenBekas = room.players[randomIndex];

  // Generate randomized questioning schedule
  const playerIds = room.players.map((p) => p.id);
  const questionQueue = generateQuestionSchedule(playerIds);
  const bonusQueue: BonusQueueItem[] = playerIds.map((id) => ({
    askerId: id,
    targetId: null,
    skipped: false,
    done: false,
  }));

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < room.players.length; i++) {
      const p = room.players[i];
      await tx.bekasaRoomPlayer.update({
        where: { id: p.id },
        data: {
          isBekas: p.id === chosenBekas.id,
          roleRevealed: false,
          isReady: false,
          votedPlayerId: null,
          bekasGuessedWord: null,
          bekasGuessCorrect: null,
        },
      });
    }

    await tx.bekasaRoom.update({
      where: { id: room.id },
      data: {
        status: "PLAYING",
        currentPhase: "ROLE_REVEAL",
        roundNumber: 1,
        categoryId: wordPayload.category.id,
        categoryNameAr: wordPayload.category.nameAr,
        categoryNameEn: wordPayload.category.nameEn,
        secretWordAr: wordPayload.secretWord.ar,
        secretWordEn: wordPayload.secretWord.en,
        candidateWordsJson: JSON.stringify(wordPayload.candidateWords),
        bekasPlayerId: chosenBekas.id,
        questionQueueJson: JSON.stringify(questionQueue),
        currentQuestionIndex: 0,
        bonusQueueJson: JSON.stringify(bonusQueue),
        currentBonusIndex: 0,
        roundResultSummary: null,
        winnerId: null,
        startedAt: new Date(),
        finishedAt: null,
      },
    });

    await tx.bekasaRoomAction.create({
      data: {
        roomId: room.id,
        actorId: hostPlayer.id,
        type: "START_ROUND",
        details: `Round 1 started! Category: ${wordPayload.category.nameAr} (${wordPayload.category.nameEn}). Check your secret cards!`,
      },
    });
  });
}

export async function revealRoleBekasaAction({
  roomCode,
  actorUserId,
}: {
  roomCode: string;
  actorUserId: string;
}) {
  const room = await prisma.bekasaRoom.findUnique({
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

  await prisma.bekasaRoomPlayer.update({
    where: { id: player.id },
    data: { roleRevealed: true },
  });

  await prisma.bekasaRoomAction.create({
    data: {
      roomId: room.id,
      actorId: player.id,
      type: "REVEAL_ROLE",
      details: `${player.displayName} checked their card.`,
    },
  });
}

export async function readyBekasaAction({
  roomCode,
  actorUserId,
}: {
  roomCode: string;
  actorUserId: string;
}) {
  const room = await prisma.bekasaRoom.findUnique({
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

  await prisma.bekasaRoomPlayer.update({
    where: { id: player.id },
    data: { isReady: true, roleRevealed: true },
  });

  await prisma.bekasaRoomAction.create({
    data: {
      roomId: room.id,
      actorId: player.id,
      type: "READY",
      details: `${player.displayName} is ready!`,
    },
  });

  // Check if all players are ready -> transition to MAIN_QUESTIONS
  const allReady = room.players.every((p) => (p.id === player.id ? true : p.isReady));
  if (allReady && room.currentPhase === "ROLE_REVEAL") {
    await prisma.bekasaRoom.update({
      where: { id: room.id },
      data: { currentPhase: "MAIN_QUESTIONS", currentQuestionIndex: 0 },
    });

    await prisma.bekasaRoomAction.create({
      data: {
        roomId: room.id,
        type: "START_ROUND",
        details: "Everyone is ready! Questioning round begins! 🎤",
      },
    });
  }
}

export async function advanceQuestionBekasaAction({
  roomCode,
  actorUserId,
}: {
  roomCode: string;
  actorUserId: string;
}) {
  const room = await prisma.bekasaRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: true },
  });
  if (!room || room.status !== "PLAYING" || room.currentPhase !== "MAIN_QUESTIONS") {
    throw new Error("Main questioning phase is not active.");
  }

  const player = room.players.find((p) => p.userId === actorUserId);
  if (!player) {
    throw new Error("Player not found in room.");
  }

  let queue: QuestionQueueItem[] = [];
  try {
    queue = JSON.parse(room.questionQueueJson || "[]");
  } catch {
    queue = [];
  }

  const currentIdx = room.currentQuestionIndex;
  if (currentIdx < queue.length) {
    queue[currentIdx].done = true;
  }

  const nextIdx = currentIdx + 1;
  const isComplete = nextIdx >= queue.length;

  await prisma.bekasaRoom.update({
    where: { id: room.id },
    data: {
      questionQueueJson: JSON.stringify(queue),
      currentQuestionIndex: nextIdx,
      currentPhase: isComplete ? "BONUS_QUESTIONS" : "MAIN_QUESTIONS",
    },
  });

  await prisma.bekasaRoomAction.create({
    data: {
      roomId: room.id,
      actorId: player.id,
      type: "ADVANCE_QUESTION",
      details: isComplete
        ? "Main question round completed! Moving to bonus questions."
        : `Question ${currentIdx + 1} completed!`,
    },
  });
}

export async function bonusQuestionBekasaAction({
  roomCode,
  actorUserId,
  targetPlayerId,
  skip = false,
}: {
  roomCode: string;
  actorUserId: string;
  targetPlayerId?: string;
  skip?: boolean;
}) {
  const room = await prisma.bekasaRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: true },
  });
  if (!room || room.status !== "PLAYING" || room.currentPhase !== "BONUS_QUESTIONS") {
    throw new Error("Bonus question phase is not active.");
  }

  const player = room.players.find((p) => p.userId === actorUserId);
  if (!player) {
    throw new Error("Player not found in room.");
  }

  let queue: BonusQueueItem[] = [];
  try {
    queue = JSON.parse(room.bonusQueueJson || "[]");
  } catch {
    queue = [];
  }

  const currentIdx = room.currentBonusIndex;
  const currentItem = queue[currentIdx];

  // Only the current asker or host can advance
  if (currentItem && currentItem.askerId !== player.id && !player.isHost) {
    throw new Error("Not your turn to ask a bonus question.");
  }

  if (currentIdx < queue.length) {
    queue[currentIdx].done = true;
    queue[currentIdx].skipped = Boolean(skip);
    queue[currentIdx].targetId = targetPlayerId ?? null;
  }

  const nextIdx = currentIdx + 1;
  const isComplete = nextIdx >= queue.length;

  await prisma.bekasaRoom.update({
    where: { id: room.id },
    data: {
      bonusQueueJson: JSON.stringify(queue),
      currentBonusIndex: nextIdx,
      currentPhase: isComplete ? "VOTING" : "BONUS_QUESTIONS",
    },
  });

  const targetPlayer = targetPlayerId ? room.players.find((p) => p.id === targetPlayerId) : null;

  await prisma.bekasaRoomAction.create({
    data: {
      roomId: room.id,
      actorId: player.id,
      type: skip ? "SKIP_BONUS" : "BONUS_QUESTION",
      details: skip
        ? `${player.displayName} skipped their bonus question.`
        : `${player.displayName} asked an extra question to ${targetPlayer?.displayName ?? "someone"}.`,
    },
  });

  if (isComplete) {
    await prisma.bekasaRoomAction.create({
      data: {
        roomId: room.id,
        type: "START_ROUND",
        details: "Bonus round completed! Time to vote for the Bekas! 🗳️",
      },
    });
  }
}

export async function castVoteBekasaAction({
  roomCode,
  actorUserId,
  votedPlayerId,
}: {
  roomCode: string;
  actorUserId: string;
  votedPlayerId: string;
}) {
  const room = await prisma.bekasaRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: true },
  });
  if (!room || room.status !== "PLAYING" || room.currentPhase !== "VOTING") {
    throw new Error("Voting phase is not active.");
  }

  const voter = room.players.find((p) => p.userId === actorUserId);
  if (!voter) {
    throw new Error("Player not found in room.");
  }

  if (voter.id === votedPlayerId) {
    throw new Error("You cannot vote for yourself!");
  }

  await prisma.bekasaRoomPlayer.update({
    where: { id: voter.id },
    data: { votedPlayerId },
  });

  await prisma.bekasaRoomAction.create({
    data: {
      roomId: room.id,
      actorId: voter.id,
      type: "CAST_VOTE",
      details: `${voter.displayName} submitted their vote.`,
    },
  });

  // Check if all players have voted
  const allVoted = room.players.every((p) => (p.id === voter.id ? true : Boolean(p.votedPlayerId)));
  if (allVoted) {
    await resolveVotingOutcome(room.id);
  }
}

async function resolveVotingOutcome(roomId: string) {
  const room = await prisma.bekasaRoom.findUnique({
    where: { id: roomId },
    include: { players: true },
  });
  if (!room) return;

  const bekasPlayer = room.players.find((p) => p.id === room.bekasPlayerId);
  if (!bekasPlayer) return;

  // Count players who voted for the Bekas
  const correctVoters = room.players.filter((p) => p.votedPlayerId === bekasPlayer.id);

  let summary = "";
  if (correctVoters.length === 0) {
    // 0 players voted for the Bekas! Bekas wins the vote and gets +1 pt!
    summary = `🎭 Nobody voted for the Bekas (${bekasPlayer.displayName})! The Bekas successfully tricked everyone and scores +1 point!`;
    await prisma.bekasaRoomPlayer.update({
      where: { id: bekasPlayer.id },
      data: { score: { increment: 1 } },
    });
  } else {
    // Some players correctly identified the Bekas! Each correct voter gets +1 pt!
    const names = correctVoters.map((p) => p.displayName).join(", ");
    summary = `🕵️‍♂️ ${names} correctly caught the Bekas (${bekasPlayer.displayName})! Each scores +1 point!`;

    for (let i = 0; i < correctVoters.length; i++) {
      await prisma.bekasaRoomPlayer.update({
        where: { id: correctVoters[i].id },
        data: { score: { increment: 1 } },
      });
    }
  }

  // Phase transitions to BEKAS_GUESS so the Bekas gets to guess the secret word from candidate list
  await prisma.bekasaRoom.update({
    where: { id: room.id },
    data: {
      currentPhase: "BEKAS_GUESS",
      roundResultSummary: summary,
    },
  });

  await prisma.bekasaRoomAction.create({
    data: {
      roomId: room.id,
      type: "REVEAL_BEKAS",
      details: summary,
    },
  });
}

export async function bekasGuessAction({
  roomCode,
  actorUserId,
  guessedWordAr,
}: {
  roomCode: string;
  actorUserId: string;
  guessedWordAr: string;
}) {
  const room = await prisma.bekasaRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: true },
  });

  if (!room || room.status !== "PLAYING" || room.currentPhase !== "BEKAS_GUESS") {
    throw new Error("Bekas guess phase is not active.");
  }

  const bekasPlayer = room.players.find((p) => p.id === room.bekasPlayerId);
  if (!bekasPlayer || bekasPlayer.userId !== actorUserId) {
    throw new Error("Only the Bekas can guess the secret word.");
  }

  const isCorrect =
    guessedWordAr.trim().toLowerCase() === room.secretWordAr.trim().toLowerCase();

  let finalSummary = room.roundResultSummary ?? "";

  await prisma.$transaction(async (tx) => {
    let bonusAdded = false;
    if (isCorrect) {
      await tx.bekasaRoomPlayer.update({
        where: { id: bekasPlayer.id },
        data: {
          score: { increment: 1 },
          bekasGuessedWord: guessedWordAr,
          bekasGuessCorrect: true,
        },
      });
      bonusAdded = true;
      finalSummary += `\n🎯 The Bekas also correctly guessed the secret word ("${room.secretWordAr}") and earned +1 BONUS point!`;
    } else {
      await tx.bekasaRoomPlayer.update({
        where: { id: bekasPlayer.id },
        data: {
          bekasGuessedWord: guessedWordAr,
          bekasGuessCorrect: false,
        },
      });
      finalSummary += `\n❌ The Bekas guessed ("${guessedWordAr}") incorrectly. The secret word was ("${room.secretWordAr}").`;
    }

    // Check if any player reached scoreLimit threshold
    const allPlayers = await tx.bekasaRoomPlayer.findMany({
      where: { roomId: room.id },
    });

    const champion = allPlayers.find((p) => p.score >= room.scoreLimit);
    const hasWonMatch = Boolean(champion);

    await tx.bekasaRoom.update({
      where: { id: room.id },
      data: {
        roundResultSummary: finalSummary,
        currentPhase: hasWonMatch ? "FINISHED" : "ROUND_OVER",
        status: hasWonMatch ? "FINISHED" : "PLAYING",
        winnerId: champion ? champion.userId : null,
        finishedAt: hasWonMatch ? new Date() : null,
      },
    });

    await tx.bekasaRoomAction.create({
      data: {
        roomId: room.id,
        actorId: bekasPlayer.id,
        type: "BEKAS_GUESS",
        value: guessedWordAr,
        details: isCorrect
          ? `The Bekas guessed correctly! (+1 bonus point)`
          : `The Bekas guessed incorrectly.`,
      },
    });

    if (hasWonMatch && champion) {
      await tx.bekasaRoomAction.create({
        data: {
          roomId: room.id,
          actorId: champion.id,
          type: "START_ROUND",
          details: `🏆 ${champion.displayName} reached ${room.scoreLimit} points and won the entire match! 🎉`,
        },
      });
    }
  });
}

export async function nextRoundBekasaAction({
  roomCode,
  userId,
  categoryId,
}: {
  roomCode: string;
  userId: string;
  categoryId?: string;
}) {
  const room = await prisma.bekasaRoom.findUnique({
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

  const chosenCat = categoryId || room.categoryId;
  const wordPayload = pickSecretWordAndCandidates(chosenCat);

  // Pick random Bekas
  const randomIndex = crypto.randomInt(0, room.players.length);
  const chosenBekas = room.players[randomIndex];

  const playerIds = room.players.map((p) => p.id);
  const questionQueue = generateQuestionSchedule(playerIds);
  const bonusQueue: BonusQueueItem[] = playerIds.map((id) => ({
    askerId: id,
    targetId: null,
    skipped: false,
    done: false,
  }));

  const nextRoundNum = room.roundNumber + 1;

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < room.players.length; i++) {
      const p = room.players[i];
      await tx.bekasaRoomPlayer.update({
        where: { id: p.id },
        data: {
          isBekas: p.id === chosenBekas.id,
          roleRevealed: false,
          isReady: false,
          votedPlayerId: null,
          bekasGuessedWord: null,
          bekasGuessCorrect: null,
        },
      });
    }

    await tx.bekasaRoom.update({
      where: { id: room.id },
      data: {
        roundNumber: nextRoundNum,
        currentPhase: "ROLE_REVEAL",
        categoryId: wordPayload.category.id,
        categoryNameAr: wordPayload.category.nameAr,
        categoryNameEn: wordPayload.category.nameEn,
        secretWordAr: wordPayload.secretWord.ar,
        secretWordEn: wordPayload.secretWord.en,
        candidateWordsJson: JSON.stringify(wordPayload.candidateWords),
        bekasPlayerId: chosenBekas.id,
        questionQueueJson: JSON.stringify(questionQueue),
        currentQuestionIndex: 0,
        bonusQueueJson: JSON.stringify(bonusQueue),
        currentBonusIndex: 0,
        roundResultSummary: null,
      },
    });

    await tx.bekasaRoomAction.create({
      data: {
        roomId: room.id,
        actorId: hostPlayer.id,
        type: "NEXT_ROUND",
        details: `Round ${nextRoundNum} started! Category: ${wordPayload.category.nameAr}. Check your secret cards!`,
      },
    });
  });
}

export async function replayBekasaGameAction({
  roomCode,
  userId,
  categoryId,
}: {
  roomCode: string;
  userId: string;
  categoryId?: string;
}) {
  const room = await prisma.bekasaRoom.findUnique({
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

  const chosenCat = categoryId || room.categoryId;
  const wordPayload = pickSecretWordAndCandidates(chosenCat);

  const randomIndex = crypto.randomInt(0, room.players.length);
  const chosenBekas = room.players[randomIndex];

  const playerIds = room.players.map((p) => p.id);
  const questionQueue = generateQuestionSchedule(playerIds);
  const bonusQueue: BonusQueueItem[] = playerIds.map((id) => ({
    askerId: id,
    targetId: null,
    skipped: false,
    done: false,
  }));

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < room.players.length; i++) {
      const p = room.players[i];
      await tx.bekasaRoomPlayer.update({
        where: { id: p.id },
        data: {
          score: 0,
          isBekas: p.id === chosenBekas.id,
          roleRevealed: false,
          isReady: false,
          votedPlayerId: null,
          bekasGuessedWord: null,
          bekasGuessCorrect: null,
        },
      });
    }

    await tx.bekasaRoom.update({
      where: { id: room.id },
      data: {
        status: "PLAYING",
        currentPhase: "ROLE_REVEAL",
        roundNumber: 1,
        categoryId: wordPayload.category.id,
        categoryNameAr: wordPayload.category.nameAr,
        categoryNameEn: wordPayload.category.nameEn,
        secretWordAr: wordPayload.secretWord.ar,
        secretWordEn: wordPayload.secretWord.en,
        candidateWordsJson: JSON.stringify(wordPayload.candidateWords),
        bekasPlayerId: chosenBekas.id,
        questionQueueJson: JSON.stringify(questionQueue),
        currentQuestionIndex: 0,
        bonusQueueJson: JSON.stringify(bonusQueue),
        currentBonusIndex: 0,
        roundResultSummary: null,
        winnerId: null,
        startedAt: new Date(),
        finishedAt: null,
      },
    });

    await tx.bekasaRoomAction.create({
      data: {
        roomId: room.id,
        actorId: hostPlayer.id,
        type: "REPLAY",
        details: "New match started! Scores reset to 0.",
      },
    });
  });
}

export async function leaveBekasaRoomAction({
  roomCode,
  userId,
}: {
  roomCode: string;
  userId: string;
}) {
  const room = await prisma.bekasaRoom.findUnique({
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

  if (room.players.length <= 1) {
    await prisma.bekasaRoom.delete({ where: { id: room.id } });
    return { ok: true, deleted: true };
  }

  if (leavingPlayer.isHost) {
    const nextHost = room.players.find((p) => p.id !== leavingPlayer.id);
    if (nextHost) {
      await prisma.bekasaRoomPlayer.update({
        where: { id: nextHost.id },
        data: { isHost: true },
      });
    }
  }

  await prisma.bekasaRoomPlayer.delete({
    where: { id: leavingPlayer.id },
  });

  await prisma.bekasaRoomAction.create({
    data: {
      roomId: room.id,
      type: "LEAVE",
      details: `${leavingPlayer.displayName} left the room.`,
    },
  });

  return { ok: true, deleted: false };
}
