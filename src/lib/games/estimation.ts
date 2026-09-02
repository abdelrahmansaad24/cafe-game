import crypto from "node:crypto";
import { EstimationTrumpSuit } from "@prisma/client";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import {
  calculateRoundScores,
  canPlayCard,
  deal52Cards,
  determineTrickWinner,
  EstimationCard,
  generate52Deck,
  SUIT_NAMES_AR,
  TrumpSuit,
} from "./estimation-types";

export const ESTIMATION_ROOM_CODE_REGEX = /^[A-Z0-9]{6}$/;

function generateRoomCode(): string {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    const randomIndex = crypto.randomInt(0, characters.length);
    code += characters[randomIndex];
  }
  return code;
}

export async function listPublicEstimationRooms() {
  return prisma.estimationRoom.findMany({
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
      roundsTotal: true,
      roundNumber: true,
      _count: { select: { players: true } },
    },
  });
}

export async function createEstimationRoom({
  userId,
  title,
  visibility,
  password,
  roundsTotal = 4,
}: {
  userId: string;
  title: string;
  visibility: "PUBLIC" | "PRIVATE";
  password?: string;
  roundsTotal?: number;
}) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found.");

  let roomCode = generateRoomCode();
  let exists = await prisma.estimationRoom.findUnique({ where: { roomCode } });
  while (exists) {
    roomCode = generateRoomCode();
    exists = await prisma.estimationRoom.findUnique({ where: { roomCode } });
  }

  const passwordHash =
    visibility === "PRIVATE" && password ? await hashPassword(password) : null;

  return prisma.estimationRoom.create({
    data: {
      roomCode,
      title: title.trim() || "طاولة استميشن الحريفة",
      visibility,
      passwordHash,
      roundsTotal: roundsTotal === 8 ? 8 : 4,
      createdById: userId,
      status: "WAITING",
      currentPhase: "BIDDING",
      players: {
        create: {
          userId,
          displayName: user.name || "Host",
          isHost: true,
          seatIndex: 0,
        },
      },
      actions: {
        create: {
          type: "JOIN",
          details: `${user.name || "Host"} opened the Estimation table.`,
        },
      },
    },
    select: { roomCode: true },
  });
}

export async function joinEstimationRoom({
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

  const room = await prisma.estimationRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: true },
  });

  if (!room) throw new Error("Table not found.");
  if (room.status === "FINISHED") throw new Error("This match has ended.");

  const existingPlayer = room.players.find((p) => p.userId === userId);
  if (existingPlayer) {
    return { roomCode: room.roomCode };
  }

  if (room.visibility === "PRIVATE" && room.passwordHash) {
    if (!password) throw new Error("Password required.");
    const valid = await verifyPassword(password, room.passwordHash);
    if (!valid) throw new Error("Incorrect table password.");
  }

  if (room.players.length >= 4) {
    throw new Error("Table is full (Estimation requires exactly 4 players).");
  }

  await prisma.$transaction(async (tx) => {
    const seatIndex = room.players.length;
    await tx.estimationRoomPlayer.create({
      data: {
        roomId: room.id,
        userId,
        displayName: user.name || `Player ${seatIndex + 1}`,
        seatIndex,
      },
    });

    await tx.estimationRoomAction.create({
      data: {
        roomId: room.id,
        type: "JOIN",
        details: `${user.name || "A player"} joined seat #${seatIndex + 1}.`,
      },
    });
  });

  return { roomCode: room.roomCode };
}

export async function getEstimationRoomState({
  roomCode,
  currentUserId,
}: {
  roomCode: string;
  currentUserId: string;
}) {
  const room = await prisma.estimationRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: {
      players: { orderBy: { seatIndex: "asc" } },
      actions: { orderBy: { createdAt: "desc" }, take: 25 },
    },
  });

  if (!room) return null;

  const selfPlayer = room.players.find((p) => p.userId === currentUserId);
  if (!selfPlayer) return null;

  let currentTrick: Array<{ playerId: string; card: EstimationCard }> = [];
  try {
    currentTrick = JSON.parse(room.currentTrickJson || "[]");
  } catch {
    currentTrick = [];
  }

  const playersState = room.players.map((p) => {
    let handCards: EstimationCard[] = [];
    try {
      handCards = JSON.parse(p.handCardsJson || "[]");
    } catch {
      handCards = [];
    }

    let scoreHistory: number[] = [];
    try {
      scoreHistory = JSON.parse(p.scoreHistoryJson || "[]");
    } catch {
      scoreHistory = [];
    }

    const isSelf = p.userId === currentUserId;

    return {
      id: p.id,
      userId: p.userId,
      displayName: p.displayName,
      seatIndex: p.seatIndex,
      score: p.score,
      bid: p.bid,
      tricksWon: p.tricksWon,
      roundPoints: p.roundPoints,
      isHost: p.isHost,
      cardsCount: handCards.length,
      handCards: isSelf ? handCards : [], // Keep other players' cards hidden
      scoreHistory,
    };
  });

  const highBidder = room.players.find((p) => p.id === room.highBidderId);

  return {
    room: {
      id: room.id,
      roomCode: room.roomCode,
      title: room.title,
      visibility: room.visibility,
      status: room.status,
      currentPhase: room.currentPhase,
      roundsTotal: room.roundsTotal,
      roundNumber: room.roundNumber,
      currentTurnPlayerId: room.currentTurnPlayerId,
      trumpSuit: room.trumpSuit,
      highBidderName: highBidder?.displayName || null,
      highBid: room.highBid,
      leadSuit: room.leadSuit,
      currentTrick,
      trickNumber: room.trickNumber,
      roundWinnerId: room.roundWinnerId,
      winnerId: room.winnerId,
      createdById: room.createdById,
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
      bid: selfPlayer.bid,
      tricksWon: selfPlayer.tricksWon,
      isHost: selfPlayer.isHost,
      isMyTurn: room.currentTurnPlayerId === selfPlayer.id,
    },
  };
}

export async function startEstimationGame({
  roomCode,
  hostUserId,
}: {
  roomCode: string;
  hostUserId: string;
}) {
  const room = await prisma.estimationRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: { orderBy: { seatIndex: "asc" } } },
  });

  if (!room || room.status !== "WAITING") {
    throw new Error("Table is not in waiting status.");
  }
  if (room.createdById !== hostUserId) {
    throw new Error("Only the host can start the game.");
  }
  if (room.players.length !== 4) {
    throw new Error("Estimation requires exactly 4 players seated to start.");
  }

  const deck = generate52Deck();
  const hands = deal52Cards(deck);

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < 4; i++) {
      await tx.estimationRoomPlayer.update({
        where: { id: room.players[i].id },
        data: {
          handCardsJson: JSON.stringify(hands[i]),
          bid: null,
          tricksWon: 0,
          roundPoints: 0,
        },
      });
    }

    await tx.estimationRoom.update({
      where: { id: room.id },
      data: {
        status: "PLAYING",
        currentPhase: "BIDDING",
        roundNumber: 1,
        currentTurnPlayerId: room.players[0].id,
        trumpSuit: null,
        highBidderId: null,
        highBid: null,
        leadSuit: null,
        currentTrickJson: "[]",
        trickNumber: 1,
        roundWinnerId: null,
      },
    });

    await tx.estimationRoomAction.create({
      data: {
        roomId: room.id,
        type: "START",
        details: "Match started! 13 cards dealt to each player. Bidding phase is open!",
      },
    });
  });
}

export async function bidEstimationAction({
  roomCode,
  actorUserId,
  bid,
}: {
  roomCode: string;
  actorUserId: string;
  bid: number;
}) {
  if (bid < 0 || bid > 13) {
    throw new Error("Bid must be between 0 (Dash) and 13.");
  }

  const room = await prisma.estimationRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: { orderBy: { seatIndex: "asc" } } },
  });

  if (!room || room.status !== "PLAYING" || room.currentPhase !== "BIDDING") {
    throw new Error("Cannot place a bid right now.");
  }

  const activePlayer = room.players.find((p) => p.id === room.currentTurnPlayerId);
  if (!activePlayer || activePlayer.userId !== actorUserId) {
    throw new Error("It is not your turn to bid.");
  }

  // Update this player's bid
  await prisma.estimationRoomPlayer.update({
    where: { id: activePlayer.id },
    data: { bid },
  });

  // Check how many players have bid now
  const updatedPlayers = await prisma.estimationRoomPlayer.findMany({
    where: { roomId: room.id },
    orderBy: { seatIndex: "asc" },
  });

  const allBidded = updatedPlayers.every((p) => p.bid !== null);

  if (allBidded) {
    // Find player with highest bid
    let highestBid = -1;
    let highestBidder = updatedPlayers[0];

    for (const p of updatedPlayers) {
      if ((p.bid || 0) > highestBid) {
        highestBid = p.bid || 0;
        highestBidder = p;
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.estimationRoom.update({
        where: { id: room.id },
        data: {
          currentPhase: "SELECT_TRUMP",
          highBidderId: highestBidder.id,
          highBid: highestBid,
          currentTurnPlayerId: highestBidder.id,
        },
      });

      await tx.estimationRoomAction.create({
        data: {
          roomId: room.id,
          actorId: activePlayer.id,
          type: "BID",
          value: String(bid),
          details: `${activePlayer.displayName} bid [${bid}]. Bids complete! ${highestBidder.displayName} won bidding with [${highestBid}] and chooses Trump!`,
        },
      });
    });
  } else {
    // Advance to next bidder
    const currentIndex = room.players.findIndex((p) => p.id === activePlayer.id);
    const nextPlayer = room.players[(currentIndex + 1) % 4];

    await prisma.$transaction(async (tx) => {
      await tx.estimationRoom.update({
        where: { id: room.id },
        data: {
          currentTurnPlayerId: nextPlayer.id,
        },
      });

      await tx.estimationRoomAction.create({
        data: {
          roomId: room.id,
          actorId: activePlayer.id,
          type: "BID",
          value: String(bid),
          details: `${activePlayer.displayName} bid [${bid === 0 ? "Dash (0)" : bid}].`,
        },
      });
    });
  }
}

export async function selectEstimationTrumpAction({
  roomCode,
  actorUserId,
  trumpSuit,
}: {
  roomCode: string;
  actorUserId: string;
  trumpSuit: TrumpSuit;
}) {
  const room = await prisma.estimationRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: { orderBy: { seatIndex: "asc" } } },
  });

  if (!room || room.status !== "PLAYING" || room.currentPhase !== "SELECT_TRUMP") {
    throw new Error("Cannot select trump right now.");
  }

  const highBidder = room.players.find((p) => p.id === room.highBidderId);
  if (!highBidder || highBidder.userId !== actorUserId) {
    throw new Error("Only the highest bidder can select the Trump suit.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.estimationRoom.update({
      where: { id: room.id },
      data: {
        trumpSuit: trumpSuit as EstimationTrumpSuit,
        currentPhase: "TRICK_PLAYING",
        currentTurnPlayerId: highBidder.id, // High bidder leads first trick
        trickNumber: 1,
        currentTrickJson: "[]",
        leadSuit: null,
      },
    });

    await tx.estimationRoomAction.create({
      data: {
        roomId: room.id,
        actorId: highBidder.id,
        type: "SELECT_TRUMP",
        value: trumpSuit,
        details: `👑 ${highBidder.displayName} chose Trump: [ ${SUIT_NAMES_AR[trumpSuit]} ]! Trick #1 begins!`,
      },
    });
  });
}

export async function playEstimationCardAction({
  roomCode,
  actorUserId,
  cardId,
}: {
  roomCode: string;
  actorUserId: string;
  cardId: string;
}) {
  const room = await prisma.estimationRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: { orderBy: { seatIndex: "asc" } } },
  });

  if (!room || room.status !== "PLAYING" || room.currentPhase !== "TRICK_PLAYING") {
    throw new Error("Cannot play card right now.");
  }

  const activePlayer = room.players.find((p) => p.id === room.currentTurnPlayerId);
  if (!activePlayer || activePlayer.userId !== actorUserId) {
    throw new Error("It is not your turn to play a card.");
  }

  let hand: EstimationCard[] = [];
  try {
    hand = JSON.parse(activePlayer.handCardsJson || "[]");
  } catch {
    hand = [];
  }

  const cardIndex = hand.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) {
    throw new Error("Card not found in your hand.");
  }

  const cardToPlay = hand[cardIndex];

  // Validate legal play: must follow suit if possible
  if (!canPlayCard(cardToPlay, hand, room.leadSuit)) {
    throw new Error(`You must follow the lead suit [ ${room.leadSuit} ]!`);
  }

  // Remove card from hand
  hand.splice(cardIndex, 1);

  let currentTrick: Array<{ playerId: string; card: EstimationCard }> = [];
  try {
    currentTrick = JSON.parse(room.currentTrickJson || "[]");
  } catch {
    currentTrick = [];
  }

  currentTrick.push({ playerId: activePlayer.id, card: cardToPlay });

  const isFirstCard = currentTrick.length === 1;
  const leadSuit = isFirstCard ? cardToPlay.suit : room.leadSuit!;

  if (currentTrick.length === 4) {
    // TRICK COMPLETE!
    const { winningPlayerId, winningCard } = determineTrickWinner(
      currentTrick,
      leadSuit,
      room.trumpSuit as unknown as TrumpSuit,
    );

    const trickWinner = room.players.find((p) => p.id === winningPlayerId)!;
    const newTricksWon = trickWinner.tricksWon + 1;

    // Check if round is over (13 tricks played)
    if (room.trickNumber === 13) {
      // ROUND COMPLETE! Calculate scores for each player
      const playersForScoring = room.players.map((p) => ({
        id: p.id,
        bid: p.bid ?? 0,
        tricksWon: p.id === trickWinner.id ? newTricksWon : p.tricksWon,
      }));

      const roundScores = calculateRoundScores(playersForScoring);

      let highestScore = -9999;
      let matchWinnerUserId: string | null = null;

      await prisma.$transaction(async (tx) => {
        // Update each player's points and score history
        for (const p of room.players) {
          const res = roundScores[p.id];
          const newTotal = p.score + res.roundPoints;

          let scoreHistory: number[] = [];
          try {
            scoreHistory = JSON.parse(p.scoreHistoryJson || "[]");
          } catch {
            scoreHistory = [];
          }
          scoreHistory.push(res.roundPoints);

          if (newTotal > highestScore) {
            highestScore = newTotal;
            matchWinnerUserId = p.userId;
          }

          await tx.estimationRoomPlayer.update({
            where: { id: p.id },
            data: {
              handCardsJson: p.id === activePlayer.id ? JSON.stringify(hand) : undefined,
              tricksWon: p.id === trickWinner.id ? newTricksWon : p.tricksWon,
              roundPoints: res.roundPoints,
              score: newTotal,
              scoreHistoryJson: JSON.stringify(scoreHistory),
            },
          });
        }

        const isMatchFinished = room.roundNumber >= room.roundsTotal;

        await tx.estimationRoom.update({
          where: { id: room.id },
          data: {
            currentTrickJson: JSON.stringify(currentTrick),
            currentPhase: isMatchFinished ? "FINISHED" : "ROUND_OVER",
            status: isMatchFinished ? "FINISHED" : "PLAYING",
            winnerId: isMatchFinished ? matchWinnerUserId : null,
            roundWinnerId: trickWinner.id,
            leadSuit: null,
          },
        });

        await tx.estimationRoomAction.create({
          data: {
            roomId: room.id,
            actorId: trickWinner.id,
            type: "PLAY_CARD",
            details: `🏆 ${trickWinner.displayName} won the final trick with ${winningCard.nameAr}! Round ${room.roundNumber} concluded!`,
          },
        });
      });
    } else {
      // Advance to next trick
      await prisma.$transaction(async (tx) => {
        await tx.estimationRoomPlayer.update({
          where: { id: activePlayer.id },
          data: { handCardsJson: JSON.stringify(hand) },
        });

        await tx.estimationRoomPlayer.update({
          where: { id: trickWinner.id },
          data: { tricksWon: newTricksWon },
        });

        await tx.estimationRoom.update({
          where: { id: room.id },
          data: {
            currentTrickJson: "[]",
            trickNumber: room.trickNumber + 1,
            currentTurnPlayerId: trickWinner.id, // Trick winner leads next trick
            leadSuit: null,
          },
        });

        await tx.estimationRoomAction.create({
          data: {
            roomId: room.id,
            actorId: trickWinner.id,
            type: "PLAY_CARD",
            details: `🏆 ${trickWinner.displayName} won Trick #${room.trickNumber} with ${winningCard.nameAr}!`,
          },
        });
      });
    }
  } else {
    // Trick still in progress: advance to next player
    const currentIndex = room.players.findIndex((p) => p.id === activePlayer.id);
    const nextPlayer = room.players[(currentIndex + 1) % 4];

    await prisma.$transaction(async (tx) => {
      await tx.estimationRoomPlayer.update({
        where: { id: activePlayer.id },
        data: { handCardsJson: JSON.stringify(hand) },
      });

      await tx.estimationRoom.update({
        where: { id: room.id },
        data: {
          currentTrickJson: JSON.stringify(currentTrick),
          leadSuit,
          currentTurnPlayerId: nextPlayer.id,
        },
      });

      await tx.estimationRoomAction.create({
        data: {
          roomId: room.id,
          actorId: activePlayer.id,
          type: "PLAY_CARD",
          details: `${activePlayer.displayName} played ${cardToPlay.nameAr}.`,
        },
      });
    });
  }
}

export async function nextRoundEstimationAction({
  roomCode,
  userId,
}: {
  roomCode: string;
  userId: string;
}) {
  const room = await prisma.estimationRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: { orderBy: { seatIndex: "asc" } } },
  });

  if (!room || room.currentPhase !== "ROUND_OVER") {
    throw new Error("Round is not over.");
  }
  if (room.createdById !== userId) {
    throw new Error("Only the host can advance to the next round.");
  }

  const deck = generate52Deck();
  const hands = deal52Cards(deck);

  const nextRoundFirstBidder = room.players[room.roundNumber % 4];

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < 4; i++) {
      await tx.estimationRoomPlayer.update({
        where: { id: room.players[i].id },
        data: {
          handCardsJson: JSON.stringify(hands[i]),
          bid: null,
          tricksWon: 0,
          roundPoints: 0,
        },
      });
    }

    await tx.estimationRoom.update({
      where: { id: room.id },
      data: {
        roundNumber: room.roundNumber + 1,
        currentPhase: "BIDDING",
        currentTurnPlayerId: nextRoundFirstBidder.id,
        trumpSuit: null,
        highBidderId: null,
        highBid: null,
        leadSuit: null,
        currentTrickJson: "[]",
        trickNumber: 1,
        roundWinnerId: null,
      },
    });

    await tx.estimationRoomAction.create({
      data: {
        roomId: room.id,
        type: "NEXT_ROUND",
        details: `Round ${room.roundNumber + 1} started! 13 cards dealt. Bidding is open!`,
      },
    });
  });
}

export async function replayEstimationGameAction({
  roomCode,
  userId,
}: {
  roomCode: string;
  userId: string;
}) {
  const room = await prisma.estimationRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: { orderBy: { seatIndex: "asc" } } },
  });

  if (!room || room.status !== "FINISHED") {
    throw new Error("Match is not finished.");
  }
  if (room.createdById !== userId) {
    throw new Error("Only the host can reset the match.");
  }

  const deck = generate52Deck();
  const hands = deal52Cards(deck);

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < 4; i++) {
      await tx.estimationRoomPlayer.update({
        where: { id: room.players[i].id },
        data: {
          score: 0,
          scoreHistoryJson: "[]",
          handCardsJson: JSON.stringify(hands[i]),
          bid: null,
          tricksWon: 0,
          roundPoints: 0,
        },
      });
    }

    await tx.estimationRoom.update({
      where: { id: room.id },
      data: {
        status: "PLAYING",
        currentPhase: "BIDDING",
        roundNumber: 1,
        currentTurnPlayerId: room.players[0].id,
        trumpSuit: null,
        highBidderId: null,
        highBid: null,
        leadSuit: null,
        currentTrickJson: "[]",
        trickNumber: 1,
        roundWinnerId: null,
        winnerId: null,
      },
    });

    await tx.estimationRoomAction.create({
      data: {
        roomId: room.id,
        type: "REPLAY",
        details: "Match scores reset! New match starting.",
      },
    });
  });
}

export async function leaveEstimationRoomAction({
  roomCode,
  userId,
}: {
  roomCode: string;
  userId: string;
}) {
  const room = await prisma.estimationRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: true },
  });

  if (!room) throw new Error("Table not found.");

  const player = room.players.find((p) => p.userId === userId);
  if (!player) return { deleted: false };

  if (player.isHost || room.players.length <= 1) {
    await prisma.estimationRoom.delete({ where: { id: room.id } });
    return { deleted: true };
  }

  await prisma.$transaction(async (tx) => {
    await tx.estimationRoomPlayer.delete({ where: { id: player.id } });
    await tx.estimationRoomAction.create({
      data: {
        roomId: room.id,
        type: "LEAVE",
        details: `${player.displayName} left the table.`,
      },
    });
  });

  return { deleted: false };
}
