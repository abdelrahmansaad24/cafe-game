import crypto from "node:crypto";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { ActiveSabahoQuestion, pickChallengeForRound } from "./sabaho-types";
import { generateSabahoChallenge, validatePlayerGuessWithGemini } from "./sabaho-ai";

export const SABAHO_ROOM_CODE_REGEX = /^[A-Z0-9]{6}$/;

function generateRoomCode(): string {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    const randomIndex = crypto.randomInt(0, characters.length);
    code += characters[randomIndex];
  }
  return code;
}

export async function listPublicSabahoRooms() {
  return prisma.sabahoRoom.findMany({
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
      gameMode: true,
      isTeamPlay: true,
      roundsTotal: true,
      roundNumber: true,
      _count: { select: { players: true } },
    },
  });
}

export async function createSabahoRoom({
  userId,
  title,
  visibility,
  password,
  gameMode = "MIXED",
  isTeamPlay = true,
  roundsTotal = 6,
  team1Name = "فريق الأهلي",
  team2Name = "فريق الزمالك",
}: {
  userId: string;
  title: string;
  visibility: "PUBLIC" | "PRIVATE";
  password?: string;
  gameMode?: "MIXED" | "AUCTION" | "CAREER_PATH" | "SPEED" | "PASSWORD";
  isTeamPlay?: boolean;
  roundsTotal?: number;
  team1Name?: string;
  team2Name?: string;
}) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found.");

  let roomCode = generateRoomCode();
  let exists = await prisma.sabahoRoom.findUnique({ where: { roomCode } });
  while (exists) {
    roomCode = generateRoomCode();
    exists = await prisma.sabahoRoom.findUnique({ where: { roomCode } });
  }

  const passwordHash =
    visibility === "PRIVATE" && password ? await hashPassword(password) : null;

  return prisma.sabahoRoom.create({
    data: {
      roomCode,
      title: title.trim() || "تحدي صباحو كورة",
      visibility,
      passwordHash,
      gameMode,
      isTeamPlay,
      roundsTotal: Math.max(3, Math.min(12, roundsTotal)),
      team1Name: (team1Name || "").trim() || "فريق الأهلي",
      team2Name: (team2Name || "").trim() || "فريق الزمالك",
      createdById: userId,
      status: "WAITING",
      players: {
        create: {
          userId,
          displayName: user.name || "Host",
          isHost: true,
          seatIndex: 0,
          team: 1,
        },
      },
      actions: {
        create: {
          type: "JOIN",
          details: `${user.name || "Host"} created the Sabaho Tahadi room.`,
        },
      },
    },
    select: { roomCode: true },
  });
}

export async function joinSabahoRoom({
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

  const room = await prisma.sabahoRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: true },
  });

  if (!room) throw new Error("Room not found.");
  if (room.status === "FINISHED") throw new Error("This match has ended.");

  const existingPlayer = room.players.find((p) => p.userId === userId);
  if (existingPlayer) {
    return { roomCode: room.roomCode };
  }

  if (room.visibility === "PRIVATE" && room.passwordHash) {
    if (!password) throw new Error("Password required.");
    const valid = await verifyPassword(password, room.passwordHash);
    if (!valid) throw new Error("Incorrect room password.");
  }

  if (room.players.length >= 12) {
    throw new Error("Room is full (max 12 players).");
  }

  await prisma.$transaction(async (tx) => {
    const seatIndex = room.players.length;
    // Balance teams 1 and 2
    const team1Count = room.players.filter((p) => p.team === 1).length;
    const team2Count = room.players.filter((p) => p.team === 2).length;
    const assignedTeam = team1Count <= team2Count ? 1 : 2;

    await tx.sabahoRoomPlayer.create({
      data: {
        roomId: room.id,
        userId,
        displayName: user.name || `Player ${seatIndex + 1}`,
        seatIndex,
        team: assignedTeam,
      },
    });

    await tx.sabahoRoomAction.create({
      data: {
        roomId: room.id,
        type: "JOIN",
        details: `${user.name || "A player"} joined ${assignedTeam === 1 ? room.team1Name : room.team2Name}.`,
      },
    });
  });

  return { roomCode: room.roomCode };
}

export async function getSabahoRoomState({
  roomCode,
  currentUserId,
}: {
  roomCode: string;
  currentUserId: string;
}) {
  const room = await prisma.sabahoRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: {
      players: { orderBy: { seatIndex: "asc" } },
      actions: { orderBy: { createdAt: "desc" }, take: 25 },
    },
  });

  if (!room) return null;

  const selfPlayer = room.players.find((p) => p.userId === currentUserId);
  if (!selfPlayer) return null;

  let activeQuestion: ActiveSabahoQuestion | null = null;
  try {
    activeQuestion = JSON.parse(room.activeQuestionJson || "null");
  } catch {
    activeQuestion = null;
  }

  const isBuzzerPlayer = room.activeBuzzerPlayerId === selfPlayer.id;

  const buzzerPlayer = room.players.find((p) => p.id === room.activeBuzzerPlayerId);
  const highBidder = room.players.find((p) => p.id === room.auctionHighBidderId);

  return {
    room: {
      id: room.id,
      roomCode: room.roomCode,
      title: room.title,
      visibility: room.visibility,
      status: room.status,
      gameMode: room.gameMode,
      currentPhase: room.currentPhase,
      roundsTotal: room.roundsTotal,
      roundNumber: room.roundNumber,
      isTeamPlay: room.isTeamPlay,
      team1Score: room.team1Score,
      team2Score: room.team2Score,
      team1Name: room.team1Name,
      team2Name: room.team2Name,
      currentTurnPlayerId: room.currentTurnPlayerId,
      activeQuestion,
      activeBuzzerPlayerId: room.activeBuzzerPlayerId,
      buzzerPlayerName: buzzerPlayer?.displayName || null,
      auctionHighBid: room.auctionHighBid,
      auctionHighBidderName: highBidder?.displayName || null,
      careerRevealedIndex: room.careerRevealedIndex,
      timerEndsAt: room.timerEndsAt?.toISOString() || null,
      timerSeconds: room.timerSeconds,
      clueGiverPlayerId: room.clueGiverPlayerId,
      passwordScore: room.passwordScore,
      roundWinnerId: room.roundWinnerId,
      winnerId: room.winnerId,
      winnerTeam: room.winnerTeam,
      createdById: room.createdById,
      players: room.players.map((p) => ({
        id: p.id,
        userId: p.userId,
        displayName: p.displayName,
        seatIndex: p.seatIndex,
        team: p.team,
        score: p.score,
        roundPoints: p.roundPoints,
        hasPassedBid: p.hasPassedBid,
        isHost: p.isHost,
      })),
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
      team: selfPlayer.team,
      score: selfPlayer.score,
      isHost: selfPlayer.isHost,
      isMyTurn: room.currentTurnPlayerId === selfPlayer.id,
      isBuzzerPlayer,
      isClueGiver: room.clueGiverPlayerId === selfPlayer.id,
    },
  };
}

export async function updateTeamNamesSabahoAction({
  roomCode,
  hostUserId,
  team1Name,
  team2Name,
}: {
  roomCode: string;
  hostUserId: string;
  team1Name?: string;
  team2Name?: string;
}) {
  const room = await prisma.sabahoRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
  });

  if (!room || room.status !== "WAITING") {
    throw new Error("Can only change team names in the lobby before start.");
  }
  if (room.createdById !== hostUserId) {
    throw new Error("Only the admin can change team names.");
  }

  const t1 = (team1Name || "").trim() || room.team1Name;
  const t2 = (team2Name || "").trim() || room.team2Name;

  await prisma.$transaction(async (tx) => {
    await tx.sabahoRoom.update({
      where: { id: room.id },
      data: { team1Name: t1, team2Name: t2 },
    });

    await tx.sabahoRoomAction.create({
      data: {
        roomId: room.id,
        type: "UPDATE_TEAM_NAMES",
        details: `Team names updated to: [ ${t1} ] vs [ ${t2} ]!`,
      },
    });
  });
}

export async function changeTeamSabahoAction({
  roomCode,
  userId,
  team,
}: {
  roomCode: string;
  userId: string;
  team: 1 | 2;
}) {
  const room = await prisma.sabahoRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: true },
  });

  if (!room || room.status !== "WAITING") {
    throw new Error("Can only switch teams in lobby.");
  }

  const player = room.players.find((p) => p.userId === userId);
  if (!player) throw new Error("Player not found.");

  await prisma.$transaction(async (tx) => {
    await tx.sabahoRoomPlayer.update({
      where: { id: player.id },
      data: { team },
    });

    await tx.sabahoRoomAction.create({
      data: {
        roomId: room.id,
        actorId: player.id,
        type: "CHANGE_TEAM",
        details: `${player.displayName} switched to ${team === 1 ? room.team1Name : room.team2Name}.`,
      },
    });
  });
}

export async function startSabahoGame({
  roomCode,
  hostUserId,
}: {
  roomCode: string;
  hostUserId: string;
}) {
  const room = await prisma.sabahoRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: { orderBy: { seatIndex: "asc" } } },
  });

  if (!room || room.status !== "WAITING") {
    throw new Error("Game is not in waiting status.");
  }
  if (room.createdById !== hostUserId) {
    throw new Error("Only the host can start the game.");
  }
  if (room.players.length < 2) {
    throw new Error("At least 2 players are required to start.");
  }

  const firstQuestion = await generateSabahoChallenge(room.gameMode, 1);
  let initialPhase: "AUCTION_BIDDING" | "CAREER_REVEAL" | "SPEED_CHALLENGE" | "PASSWORD_ROUND" = "AUCTION_BIDDING";
  let timerSeconds = 30;
  let timerEndsAt: Date | null = null;

  if (firstQuestion.type === "CAREER_PATH") {
    initialPhase = "CAREER_REVEAL";
  } else if (firstQuestion.type === "SPEED") {
    initialPhase = "SPEED_CHALLENGE";
  } else if (firstQuestion.type === "PASSWORD") {
    initialPhase = "PASSWORD_ROUND";
    timerSeconds = 60;
    timerEndsAt = new Date(Date.now() + 60 * 1000);
  }

  await prisma.$transaction(async (tx) => {
    await tx.sabahoRoomPlayer.updateMany({
      where: { roomId: room.id },
      data: {
        roundPoints: 0,
        hasPassedBid: false,
      },
    });

    await tx.sabahoRoom.update({
      where: { id: room.id },
      data: {
        status: "PLAYING",
        roundNumber: 1,
        currentPhase: initialPhase,
        activeQuestionJson: JSON.stringify(firstQuestion),
        currentTurnPlayerId: room.players[0].id,
        clueGiverPlayerId: room.players[0].id,
        passwordScore: 0,
        auctionHighBid: null,
        auctionHighBidderId: null,
        activeBuzzerPlayerId: null,
        careerRevealedIndex: 1, // Reveal first club
        timerSeconds,
        timerEndsAt,
        roundWinnerId: null,
      },
    });

    await tx.sabahoRoomAction.create({
      data: {
        roomId: room.id,
        type: "START",
        details: `Sabaho Tahadi Match Started! Round 1 is: [ ${firstQuestion.type} ]!`,
      },
    });
  });
}

export async function bidSabahoAction({
  roomCode,
  actorUserId,
  bid,
}: {
  roomCode: string;
  actorUserId: string;
  bid: number;
}) {
  const room = await prisma.sabahoRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: { orderBy: { seatIndex: "asc" } } },
  });

  if (!room || room.status !== "PLAYING" || room.currentPhase !== "AUCTION_BIDDING") {
    throw new Error("Not in auction bidding phase.");
  }

  const player = room.players.find((p) => p.userId === actorUserId);
  if (!player) throw new Error("Player not found.");

  const currentHigh = room.auctionHighBid ?? 0;
  if (bid <= currentHigh) {
    throw new Error(`Bid must be higher than current highest bid (${currentHigh}).`);
  }

  // Advance to next active bidder
  const currentIndex = room.players.findIndex((p) => p.id === player.id);
  let nextPlayer = room.players[(currentIndex + 1) % room.players.length];
  // Skip players who already passed
  for (let i = 1; i <= room.players.length; i++) {
    const candidate = room.players[(currentIndex + i) % room.players.length];
    if (!candidate.hasPassedBid) {
      nextPlayer = candidate;
      break;
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.sabahoRoom.update({
      where: { id: room.id },
      data: {
        auctionHighBid: bid,
        auctionHighBidderId: player.id,
        currentTurnPlayerId: nextPlayer.id,
      },
    });

    await tx.sabahoRoomAction.create({
      data: {
        roomId: room.id,
        actorId: player.id,
        type: "BID",
        value: String(bid),
        details: `🔥 ${player.displayName} bid [${bid}] in the Auction!`,
      },
    });
  });
}

export async function passBidSabahoAction({
  roomCode,
  actorUserId,
}: {
  roomCode: string;
  actorUserId: string;
}) {
  const room = await prisma.sabahoRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: { orderBy: { seatIndex: "asc" } } },
  });

  if (!room || room.status !== "PLAYING" || room.currentPhase !== "AUCTION_BIDDING") {
    throw new Error("Not in auction bidding phase.");
  }

  const player = room.players.find((p) => p.userId === actorUserId);
  if (!player) throw new Error("Player not found.");

  await prisma.sabahoRoomPlayer.update({
    where: { id: player.id },
    data: { hasPassedBid: true },
  });

  const updatedPlayers = await prisma.sabahoRoomPlayer.findMany({
    where: { roomId: room.id },
    orderBy: { seatIndex: "asc" },
  });

  const activeBidders = updatedPlayers.filter((p) => !p.hasPassedBid);

  // If only 1 bidder remains and has a bid -> Auction Won!
  if (activeBidders.length <= 1 && room.auctionHighBidderId) {
    const winner = updatedPlayers.find((p) => p.id === room.auctionHighBidderId)!;
    const timerSeconds = 30;
    const endsAt = new Date(Date.now() + timerSeconds * 1000);

    await prisma.$transaction(async (tx) => {
      await tx.sabahoRoom.update({
        where: { id: room.id },
        data: {
          currentPhase: "AUCTION_EXECUTION",
          currentTurnPlayerId: winner.id,
          timerSeconds,
          timerEndsAt: endsAt,
        },
      });

      await tx.sabahoRoomAction.create({
        data: {
          roomId: room.id,
          type: "PASS_BID",
          details: `🏁 The Auction closed at [${room.auctionHighBid}]! ${winner.displayName} has 30s to name them!`,
        },
      });
    });
  } else {
    // Advance turn to next active bidder
    const currentIndex = room.players.findIndex((p) => p.id === player.id);
    let nextPlayer = player;
    for (let i = 1; i <= room.players.length; i++) {
      const candidate = updatedPlayers[(currentIndex + i) % updatedPlayers.length];
      if (!candidate.hasPassedBid) {
        nextPlayer = candidate;
        break;
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.sabahoRoom.update({
        where: { id: room.id },
        data: { currentTurnPlayerId: nextPlayer.id },
      });

      await tx.sabahoRoomAction.create({
        data: {
          roomId: room.id,
          actorId: player.id,
          type: "PASS_BID",
          details: `${player.displayName} passed the bid.`,
        },
      });
    });
  }
}

export async function nextCareerStepSabahoAction({
  roomCode,
  hostUserId,
}: {
  roomCode: string;
  hostUserId: string;
}) {
  const room = await prisma.sabahoRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
  });

  if (!room || room.currentPhase !== "CAREER_REVEAL") {
    throw new Error("Cannot reveal next step right now.");
  }
  if (room.createdById !== hostUserId) {
    throw new Error("Only the host can reveal the next club.");
  }

  let q: ActiveSabahoQuestion | null = null;
  try {
    q = JSON.parse(room.activeQuestionJson || "null");
  } catch {
    q = null;
  }

  const maxClubs = q?.career?.clubs.length || 6;
  const newIndex = Math.min(maxClubs, room.careerRevealedIndex + 1);

  await prisma.$transaction(async (tx) => {
    await tx.sabahoRoom.update({
      where: { id: room.id },
      data: { careerRevealedIndex: newIndex },
    });

    await tx.sabahoRoomAction.create({
      data: {
        roomId: room.id,
        type: "NEXT_STEP",
        details: `Next club revealed (Step ${newIndex}/${maxClubs})!`,
      },
    });
  });
}

export async function buzzSabahoAction({
  roomCode,
  actorUserId,
}: {
  roomCode: string;
  actorUserId: string;
}) {
  const room = await prisma.sabahoRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: true },
  });

  if (!room || (room.currentPhase !== "CAREER_REVEAL" && room.currentPhase !== "SPEED_CHALLENGE")) {
    throw new Error("Buzzer cannot be pressed right now.");
  }

  const player = room.players.find((p) => p.userId === actorUserId);
  if (!player) throw new Error("Player not found.");

  const timerSeconds = 30;
  const endsAt = new Date(Date.now() + timerSeconds * 1000);

  await prisma.$transaction(async (tx) => {
    await tx.sabahoRoom.update({
      where: { id: room.id },
      data: {
        currentPhase: "CAREER_GUESS",
        activeBuzzerPlayerId: player.id,
        timerEndsAt: endsAt,
        timerSeconds,
      },
    });

    await tx.sabahoRoomAction.create({
      data: {
        roomId: room.id,
        actorId: player.id,
        type: "BUZZ",
        details: `🚨 ${player.displayName} pressed the BUZZER! 30 seconds to answer!`,
      },
    });
  });
}

export async function submitGuessSabahoAction({
  roomCode,
  actorUserId,
  guess,
}: {
  roomCode: string;
  actorUserId: string;
  guess: string;
}) {
  const room = await prisma.sabahoRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: true },
  });

  if (!room || room.status !== "PLAYING") {
    throw new Error("Match is not in progress.");
  }

  const player = room.players.find((p) => p.userId === actorUserId);
  if (!player) throw new Error("Player not found.");

  let q: ActiveSabahoQuestion | null = null;
  try {
    q = JSON.parse(room.activeQuestionJson || "null");
  } catch {
    q = null;
  }

  if (q?.type !== "CAREER_PATH" || !q.career) {
    throw new Error("Not in Career Path challenge.");
  }

  const targetAr = q.career.playerNameAr;
  const targetEn = q.career.playerNameEn;

  // Use Gemini to validate the user's typed guess
  const result = await validatePlayerGuessWithGemini({
    targetPlayerNameAr: targetAr,
    targetPlayerNameEn: targetEn,
    guess,
  });

  const points = 10;
  const t1Delta = player.team === 1 ? points : 0;
  const t2Delta = player.team === 2 ? points : 0;

  if (result.valid) {
    const newT1 = room.team1Score + t1Delta;
    const newT2 = room.team2Score + t2Delta;
    const isMatchOver = room.roundNumber >= room.roundsTotal;
    let winningTeam: number | null = null;
    if (isMatchOver && room.isTeamPlay) {
      winningTeam = newT1 > newT2 ? 1 : newT2 > newT1 ? 2 : 0;
    }

    await prisma.$transaction(async (tx) => {
      await tx.sabahoRoomPlayer.update({
        where: { id: player.id },
        data: {
          score: player.score + points,
          roundPoints: points,
        },
      });

      await tx.sabahoRoom.update({
        where: { id: room.id },
        data: {
          team1Score: newT1,
          team2Score: newT2,
          currentPhase: isMatchOver ? "FINISHED" : "ROUND_OVER",
          status: isMatchOver ? "FINISHED" : "PLAYING",
          roundWinnerId: player.id,
          winnerTeam: winningTeam,
          activeBuzzerPlayerId: null,
          timerEndsAt: null,
        },
      });

      await tx.sabahoRoomAction.create({
        data: {
          roomId: room.id,
          actorId: player.id,
          type: "SUBMIT_GUESS",
          details: `🎯 ${player.displayName} guessed [ ${guess} ] -> ✅ CORRECT! (${targetAr}) +${points} pts! ${result.explanation}`,
        },
      });
    });

    return { valid: true, explanation: result.explanation, playerName: targetAr };
  } else {
    // Guessed wrong -> unlock buzzer and return to CAREER_REVEAL so other players can buzz or next club can be revealed!
    await prisma.$transaction(async (tx) => {
      await tx.sabahoRoom.update({
        where: { id: room.id },
        data: {
          currentPhase: "CAREER_REVEAL",
          activeBuzzerPlayerId: null,
          timerEndsAt: null,
        },
      });

      await tx.sabahoRoomAction.create({
        data: {
          roomId: room.id,
          actorId: player.id,
          type: "SUBMIT_GUESS",
          details: `❌ ${player.displayName} guessed [ ${guess} ] -> Incorrect! ${result.explanation}`,
        },
      });
    });

    return { valid: false, explanation: result.explanation, playerName: targetAr };
  }
}

export async function passwordCorrectSabahoAction({
  roomCode,
  actorUserId,
}: {
  roomCode: string;
  actorUserId: string;
}) {
  const room = await prisma.sabahoRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: true },
  });

  if (!room || room.status !== "PLAYING" || room.currentPhase !== "PASSWORD_ROUND") {
    throw new Error("Not in password round.");
  }

  const player = room.players.find((p) => p.userId === actorUserId);
  if (!player) throw new Error("Player not found.");

  let q: ActiveSabahoQuestion | null = null;
  try {
    q = JSON.parse(room.activeQuestionJson || "null");
  } catch {
    q = null;
  }

  const list = q?.passwordList || [];
  const curIdx = q?.currentPasswordIndex || 0;
  const nextIdx = curIdx + 1;
  const newScore = room.passwordScore + 1;
  const points = 10;

  const t1Delta = player.team === 1 ? points : 0;
  const t2Delta = player.team === 2 ? points : 0;

  if (nextIdx >= list.length) {
    await prisma.$transaction(async (tx) => {
      await tx.sabahoRoomPlayer.update({
        where: { id: player.id },
        data: {
          score: player.score + points,
          roundPoints: player.roundPoints + points,
        },
      });

      await tx.sabahoRoom.update({
        where: { id: room.id },
        data: {
          team1Score: room.team1Score + t1Delta,
          team2Score: room.team2Score + t2Delta,
          passwordScore: newScore,
          currentPhase: "ROUND_OVER",
          roundWinnerId: player.id,
        },
      });

      await tx.sabahoRoomAction.create({
        data: {
          roomId: room.id,
          actorId: player.id,
          type: "PASSWORD_CORRECT",
          details: `🎉 ${player.displayName} correctly guessed all words! (${newScore * 10} pts total)!`,
        },
      });
    });
  } else {
    q!.currentPasswordIndex = nextIdx;

    await prisma.$transaction(async (tx) => {
      await tx.sabahoRoomPlayer.update({
        where: { id: player.id },
        data: {
          score: player.score + points,
          roundPoints: player.roundPoints + points,
        },
      });

      await tx.sabahoRoom.update({
        where: { id: room.id },
        data: {
          team1Score: room.team1Score + t1Delta,
          team2Score: room.team2Score + t2Delta,
          passwordScore: newScore,
          activeQuestionJson: JSON.stringify(q),
        },
      });

      await tx.sabahoRoomAction.create({
        data: {
          roomId: room.id,
          actorId: player.id,
          type: "PASSWORD_CORRECT",
          details: `✅ Correct password! (+10 pts) -> Word #${nextIdx + 1}!`,
        },
      });
    });
  }
}

export async function passwordPassSabahoAction({
  roomCode,
  actorUserId,
}: {
  roomCode: string;
  actorUserId: string;
}) {
  const room = await prisma.sabahoRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: true },
  });

  if (!room || room.status !== "PLAYING" || room.currentPhase !== "PASSWORD_ROUND") {
    throw new Error("Not in password round.");
  }

  const player = room.players.find((p) => p.userId === actorUserId);
  if (!player) throw new Error("Player not found.");

  let q: ActiveSabahoQuestion | null = null;
  try {
    q = JSON.parse(room.activeQuestionJson || "null");
  } catch {
    q = null;
  }

  const list = q?.passwordList || [];
  const curIdx = q?.currentPasswordIndex || 0;
  const nextIdx = curIdx + 1;

  if (nextIdx >= list.length) {
    await prisma.sabahoRoom.update({
      where: { id: room.id },
      data: { currentPhase: "ROUND_OVER" },
    });
  } else {
    q!.currentPasswordIndex = nextIdx;
    await prisma.sabahoRoom.update({
      where: { id: room.id },
      data: { activeQuestionJson: JSON.stringify(q) },
    });
  }
}

export async function judgeSabahoAnswerAction({
  roomCode,
  hostUserId,
  isCorrect,
  awardedPlayerId,
  points = 10,
}: {
  roomCode: string;
  hostUserId: string;
  isCorrect: boolean;
  awardedPlayerId?: string;
  points?: number;
}) {
  const room = await prisma.sabahoRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: true },
  });

  if (!room) throw new Error("Room not found.");
  if (room.createdById !== hostUserId) {
    throw new Error("Only the host can judge answers.");
  }

  const targetPlayer = room.players.find(
    (p) => p.id === (awardedPlayerId || room.activeBuzzerPlayerId || room.auctionHighBidderId),
  );

  await prisma.$transaction(async (tx) => {
    let t1Delta = 0;
    let t2Delta = 0;

    if (targetPlayer && isCorrect) {
      await tx.sabahoRoomPlayer.update({
        where: { id: targetPlayer.id },
        data: {
          score: targetPlayer.score + points,
          roundPoints: points,
        },
      });

      if (targetPlayer.team === 1) t1Delta += points;
      else if (targetPlayer.team === 2) t2Delta += points;
    }

    const newT1 = room.team1Score + t1Delta;
    const newT2 = room.team2Score + t2Delta;

    const isMatchOver = room.roundNumber >= room.roundsTotal;
    let winningTeam: number | null = null;
    if (isMatchOver && room.isTeamPlay) {
      winningTeam = newT1 > newT2 ? 1 : newT2 > newT1 ? 2 : 0;
    }

    await tx.sabahoRoom.update({
      where: { id: room.id },
      data: {
        team1Score: newT1,
        team2Score: newT2,
        currentPhase: isMatchOver ? "FINISHED" : "ROUND_OVER",
        status: isMatchOver ? "FINISHED" : "PLAYING",
        roundWinnerId: targetPlayer?.id || null,
        winnerTeam: winningTeam,
      },
    });

    await tx.sabahoRoomAction.create({
      data: {
        roomId: room.id,
        type: "JUDGE_ANSWER",
        details: isCorrect
          ? `✅ Answer approved! +${points} points awarded to ${targetPlayer?.displayName || "player"}!`
          : `❌ Answer rejected! No points awarded.`,
      },
    });
  });
}

export async function nextRoundSabahoAction({
  roomCode,
  hostUserId,
}: {
  roomCode: string;
  hostUserId: string;
}) {
  const room = await prisma.sabahoRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: { orderBy: { seatIndex: "asc" } } },
  });

  if (!room || room.currentPhase !== "ROUND_OVER") {
    throw new Error("Round is not over.");
  }
  if (room.createdById !== hostUserId) {
    throw new Error("Only the host can advance to the next round.");
  }

  const nextRoundNum = room.roundNumber + 1;
  const nextQuestion = await generateSabahoChallenge(room.gameMode, nextRoundNum);

  let initialPhase: "AUCTION_BIDDING" | "CAREER_REVEAL" | "SPEED_CHALLENGE" | "PASSWORD_ROUND" = "AUCTION_BIDDING";
  let timerSeconds = 30;
  let timerEndsAt: Date | null = null;

  if (nextQuestion.type === "CAREER_PATH") {
    initialPhase = "CAREER_REVEAL";
  } else if (nextQuestion.type === "SPEED") {
    initialPhase = "SPEED_CHALLENGE";
  } else if (nextQuestion.type === "PASSWORD") {
    initialPhase = "PASSWORD_ROUND";
    timerSeconds = 60;
    timerEndsAt = new Date(Date.now() + 60 * 1000);
  }

  const nextStarter = room.players[(nextRoundNum - 1) % room.players.length];

  await prisma.$transaction(async (tx) => {
    await tx.sabahoRoomPlayer.updateMany({
      where: { roomId: room.id },
      data: {
        roundPoints: 0,
        hasPassedBid: false,
      },
    });

    await tx.sabahoRoom.update({
      where: { id: room.id },
      data: {
        roundNumber: nextRoundNum,
        currentPhase: initialPhase,
        activeQuestionJson: JSON.stringify(nextQuestion),
        currentTurnPlayerId: nextStarter.id,
        clueGiverPlayerId: nextStarter.id,
        passwordScore: 0,
        auctionHighBid: null,
        auctionHighBidderId: null,
        activeBuzzerPlayerId: null,
        careerRevealedIndex: 1,
        timerSeconds,
        timerEndsAt,
        roundWinnerId: null,
      },
    });

    await tx.sabahoRoomAction.create({
      data: {
        roomId: room.id,
        type: "NEXT_ROUND",
        details: `Round ${nextRoundNum} started: [ ${nextQuestion.type} ]!`,
      },
    });
  });
}

export async function replaySabahoGameAction({
  roomCode,
  hostUserId,
}: {
  roomCode: string;
  hostUserId: string;
}) {
  const room = await prisma.sabahoRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: { orderBy: { seatIndex: "asc" } } },
  });

  if (!room || room.status !== "FINISHED") {
    throw new Error("Match is not finished.");
  }
  if (room.createdById !== hostUserId) {
    throw new Error("Only the host can restart match.");
  }

  const firstQuestion = await generateSabahoChallenge(room.gameMode, 1);
  let initialPhase: "AUCTION_BIDDING" | "CAREER_REVEAL" | "SPEED_CHALLENGE" | "PASSWORD_ROUND" = "AUCTION_BIDDING";
  let timerSeconds = 30;
  let timerEndsAt: Date | null = null;

  if (firstQuestion.type === "CAREER_PATH") {
    initialPhase = "CAREER_REVEAL";
  } else if (firstQuestion.type === "SPEED") {
    initialPhase = "SPEED_CHALLENGE";
  } else if (firstQuestion.type === "PASSWORD") {
    initialPhase = "PASSWORD_ROUND";
    timerSeconds = 60;
    timerEndsAt = new Date(Date.now() + 60 * 1000);
  }

  await prisma.$transaction(async (tx) => {
    await tx.sabahoRoomPlayer.updateMany({
      where: { roomId: room.id },
      data: {
        score: 0,
        roundPoints: 0,
        hasPassedBid: false,
      },
    });

    await tx.sabahoRoom.update({
      where: { id: room.id },
      data: {
        status: "PLAYING",
        roundNumber: 1,
        team1Score: 0,
        team2Score: 0,
        winnerTeam: null,
        winnerId: null,
        roundWinnerId: null,
        currentPhase: initialPhase,
        activeQuestionJson: JSON.stringify(firstQuestion),
        currentTurnPlayerId: room.players[0].id,
        auctionHighBid: null,
        auctionHighBidderId: null,
        activeBuzzerPlayerId: null,
        careerRevealedIndex: 1,
        timerEndsAt: null,
      },
    });

    await tx.sabahoRoomAction.create({
      data: {
        roomId: room.id,
        type: "REPLAY",
        details: "Match scores reset! New match starting.",
      },
    });
  });
}

export async function leaveSabahoRoomAction({
  roomCode,
  userId,
}: {
  roomCode: string;
  userId: string;
}) {
  const room = await prisma.sabahoRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: true },
  });

  if (!room) throw new Error("Room not found.");

  const player = room.players.find((p) => p.userId === userId);
  if (!player) return { deleted: false };

  if (player.isHost || room.players.length <= 1) {
    await prisma.sabahoRoom.delete({ where: { id: room.id } });
    return { deleted: true };
  }

  await prisma.$transaction(async (tx) => {
    await tx.sabahoRoomPlayer.delete({ where: { id: player.id } });
    await tx.sabahoRoomAction.create({
      data: {
        roomId: room.id,
        type: "LEAVE",
        details: `${player.displayName} left the room.`,
      },
    });
  });

  return { deleted: false };
}
