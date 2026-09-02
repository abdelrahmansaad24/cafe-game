import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import {
  calculateUnoHandPoints,
  isCardPlayable,
  UnoCard,
  UnoColor,
  UnoValue,
  UNO_COLORS,
} from "./uno-types";

export const UNO_ROOM_CODE_REGEX = /^[A-Z0-9]{6}$/;

export {
  calculateUnoHandPoints,
  isCardPlayable,
  type UnoCard,
  type UnoColor,
  type UnoValue,
};

// Generate 108 Uno Cards
export function generateFullUnoDeck(): UnoCard[] {
  const deck: UnoCard[] = [];
  let cardId = 1;

  for (const color of UNO_COLORS) {
    // One '0' card per color
    deck.push({ id: `c-${cardId++}`, color, value: "0" });

    // Two '1'-'9' cards per color
    for (let num = 1; num <= 9; num++) {
      const valStr = String(num) as UnoValue;
      deck.push({ id: `c-${cardId++}`, color, value: valStr });
      deck.push({ id: `c-${cardId++}`, color, value: valStr });
    }

    // Two of each action card per color
    const actionCards: UnoValue[] = ["SKIP", "REVERSE", "DRAW_TWO"];
    for (const act of actionCards) {
      deck.push({ id: `c-${cardId++}`, color, value: act });
      deck.push({ id: `c-${cardId++}`, color, value: act });
    }
  }

  // 4 Wild cards
  for (let i = 0; i < 4; i++) {
    deck.push({ id: `c-${cardId++}`, color: "WILD", value: "WILD" });
  }

  // 4 Wild Draw Four cards
  for (let i = 0; i < 4; i++) {
    deck.push({ id: `c-${cardId++}`, color: "WILD", value: "WILD_DRAW_FOUR" });
  }

  return deck;
}

function shuffleCards<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function generateRoomCode(): string {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    const randomIndex = crypto.randomInt(0, characters.length);
    code += characters[randomIndex];
  }
  return code;
}

export async function listPublicUnoRooms() {
  return prisma.unoRoom.findMany({
    where: {
      visibility: "PUBLIC",
      status: { in: ["WAITING", "PLAYING"] },
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
    orderBy: { createdAt: "desc" },
    take: 30,
  });
}

export async function createUnoRoom({
  userId,
  displayName,
  title,
  visibility,
  password,
  scoreLimit = 250,
}: {
  userId: string;
  displayName: string;
  title: string;
  visibility: "PUBLIC" | "PRIVATE";
  password?: string;
  scoreLimit?: number;
}) {
  const trimmedTitle = title.trim();
  if (trimmedTitle.length < 2 || trimmedTitle.length > 80) {
    throw new Error("Table title must be between 2 and 80 characters.");
  }

  const limit = Math.min(Math.max(scoreLimit, 50), 1000);
  let passwordHash: string | null = null;
  if (visibility === "PRIVATE") {
    if (!password || password.length < 4) {
      throw new Error("Private tables require a password with at least 4 characters.");
    }
    passwordHash = await hashPassword(password);
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const roomCode = generateRoomCode();
    try {
      const room = await prisma.unoRoom.create({
        data: {
          roomCode,
          title: trimmedTitle,
          visibility,
          passwordHash,
          scoreLimit: limit,
          status: "WAITING",
          currentPhase: "PLAYING",
          createdById: userId,
          players: {
            create: {
              userId,
              displayName: displayName.trim() || "Host",
              seatIndex: 0,
              isHost: true,
            },
          },
          actions: {
            create: {
              type: "JOIN",
              details: `${displayName.trim() || "Host"} created the table.`,
            },
          },
        },
        include: { players: true },
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

  throw new Error("Failed to generate a unique table code. Please try again.");
}

export async function joinUnoRoom({
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
  const room = await prisma.unoRoom.findUnique({
    where: { roomCode: normalizedCode },
    include: { players: { orderBy: { seatIndex: "asc" } } },
  });

  if (!room) {
    throw new Error("Table not found.");
  }

  if (room.status === "FINISHED") {
    throw new Error("This game match is already finished.");
  }

  const existingPlayer = room.players.find((p) => p.userId === userId);
  if (existingPlayer) {
    return { room, player: existingPlayer };
  }

  if (room.status === "PLAYING") {
    throw new Error("Game is already in progress.");
  }

  if (room.players.length >= 8) {
    throw new Error("Table is full (maximum 8 players).");
  }

  if (room.visibility === "PRIVATE") {
    if (!password) {
      throw new Error("Password required for private tables.");
    }
    const valid = await verifyPassword(password, room.passwordHash ?? "");
    if (!valid) {
      throw new Error("Incorrect table password.");
    }
  }

  const nextSeat = room.players.length;
  const newPlayer = await prisma.unoRoomPlayer.create({
    data: {
      roomId: room.id,
      userId,
      displayName: displayName.trim() || "Player",
      seatIndex: nextSeat,
      isHost: false,
    },
  });

  await prisma.unoRoomAction.create({
    data: {
      roomId: room.id,
      actorId: newPlayer.id,
      type: "JOIN",
      details: `${newPlayer.displayName} took Seat ${nextSeat + 1}.`,
    },
  });

  return { room, player: newPlayer };
}

export async function getUnoRoomState(roomCode: string, currentUserId: string) {
  const normalizedCode = roomCode.toUpperCase().trim();
  const room = await prisma.unoRoom.findUnique({
    where: { roomCode: normalizedCode },
    include: {
      players: { orderBy: { seatIndex: "asc" } },
      actions: { orderBy: { createdAt: "desc" }, take: 25 },
    },
  });

  if (!room) {
    throw new Error("Table not found.");
  }

  const selfPlayer = room.players.find((p) => p.userId === currentUserId);
  if (!selfPlayer) {
    throw new Error("Join the table first.");
  }

  const isRoundOver = room.currentPhase === "ROUND_OVER" || room.status === "FINISHED";

  let topCard: UnoCard | null = null;
  try {
    topCard = JSON.parse(room.topCardJson || "null");
  } catch {
    topCard = null;
  }

  let drawDeckCount = 0;
  try {
    const deck = JSON.parse(room.drawDeckJson || "[]") as UnoCard[];
    drawDeckCount = deck.length;
  } catch {
    drawDeckCount = 0;
  }

  let discardPileCount = 0;
  try {
    const pile = JSON.parse(room.discardPileJson || "[]") as UnoCard[];
    discardPileCount = pile.length;
  } catch {
    discardPileCount = 0;
  }

  const sanitizedPlayers = room.players.map((p) => {
    let hand: UnoCard[] = [];
    try {
      hand = JSON.parse(p.handJson || "[]");
    } catch {
      hand = [];
    }

    const showFullHand = isRoundOver || p.userId === currentUserId;

    return {
      id: p.id,
      userId: p.userId,
      displayName: p.displayName,
      seatIndex: p.seatIndex,
      score: p.score,
      cardsCount: hand.length,
      hand: showFullHand ? hand : null,
      handPoints: isRoundOver ? calculateUnoHandPoints(hand) : null,
      hasCalledUno: p.hasCalledUno,
      isHost: p.isHost,
    };
  });

  let selfHand: UnoCard[] = [];
  try {
    selfHand = JSON.parse(selfPlayer.handJson || "[]");
  } catch {
    selfHand = [];
  }

  const isMyTurn =
    room.currentTurnPlayerId === selfPlayer.id &&
    room.status === "PLAYING" &&
    room.currentPhase === "PLAYING";

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
      currentTurnPlayerId: room.currentTurnPlayerId,
      direction: room.direction,
      activeColor: room.activeColor,
      topCard,
      drawDeckCount,
      discardPileCount,
      drawCardDrawnThisTurn: room.drawCardDrawnThisTurn,
      roundWinnerId: room.roundWinnerId,
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
      seatIndex: selfPlayer.seatIndex,
      score: selfPlayer.score,
      hand: selfHand,
      hasCalledUno: selfPlayer.hasCalledUno,
      isHost: selfPlayer.isHost,
      isMyTurn,
    },
  };
}

export async function startUnoRoom({
  roomCode,
  userId,
}: {
  roomCode: string;
  userId: string;
}) {
  const normalizedCode = roomCode.toUpperCase().trim();
  const room = await prisma.unoRoom.findUnique({
    where: { roomCode: normalizedCode },
    include: { players: { orderBy: { seatIndex: "asc" } } },
  });

  if (!room) {
    throw new Error("Table not found.");
  }

  const hostPlayer = room.players.find((p) => p.userId === userId && p.isHost);
  if (!hostPlayer) {
    throw new Error("Only the host can start the game.");
  }

  const playerCount = room.players.length;
  if (playerCount < 2) {
    throw new Error("UNO requires at least 2 players.");
  }

  await dealAndStartUnoRound(room.id, 1, room.players, true);
}

async function dealAndStartUnoRound(
  roomId: string,
  roundNumber: number,
  players: Array<{ id: string; userId: string; displayName: string; seatIndex: number }>,
  isNewMatch = false,
) {
  const playerCount = players.length;
  const fullDeck = shuffleCards(generateFullUnoDeck());

  const handSize = 7;
  const playerHands: Record<string, UnoCard[]> = {};

  for (let i = 0; i < playerCount; i++) {
    const startIdx = i * handSize;
    playerHands[players[i].id] = fullDeck.slice(startIdx, startIdx + handSize);
  }

  const remaining = fullDeck.slice(playerCount * handSize);

  // Find a valid starting top card (cannot be WILD_DRAW_FOUR)
  let topCardIdx = 0;
  while (topCardIdx < remaining.length && remaining[topCardIdx].value === "WILD_DRAW_FOUR") {
    topCardIdx++;
  }
  const topCard = remaining.splice(topCardIdx, 1)[0] || { id: "starter", color: "RED", value: "0" };

  let activeColor: UnoColor = topCard.color === "WILD" ? "RED" : topCard.color;
  let direction = 1; // 1: clockwise
  let starterSeat = 0;

  // Resolve starter card effects if action card
  if (topCard.value === "REVERSE") {
    if (playerCount === 2) {
      starterSeat = 1; // skip first player in 2-player game
    } else {
      direction = -1; // counter-clockwise
    }
  } else if (topCard.value === "SKIP") {
    starterSeat = 1 % playerCount;
  } else if (topCard.value === "DRAW_TWO") {
    const targetPlayer = players[0];
    const penaltyCards = remaining.splice(0, 2);
    playerHands[targetPlayer.id].push(...penaltyCards);
    starterSeat = 1 % playerCount;
  }

  const starterPlayer = players[starterSeat] || players[0];

  await prisma.$transaction(async (tx) => {
    for (const player of players) {
      await tx.unoRoomPlayer.update({
        where: { id: player.id },
        data: {
          handJson: JSON.stringify(playerHands[player.id]),
          cardsCount: playerHands[player.id].length,
          hasCalledUno: false,
          ...(isNewMatch ? { score: 0 } : {}),
        },
      });
    }

    await tx.unoRoom.update({
      where: { id: roomId },
      data: {
        status: "PLAYING",
        currentPhase: "PLAYING",
        roundNumber,
        currentTurnPlayerId: starterPlayer.id,
        direction,
        activeColor,
        topCardJson: JSON.stringify(topCard),
        drawDeckJson: JSON.stringify(remaining),
        discardPileJson: JSON.stringify([topCard]),
        drawCardDrawnThisTurn: false,
        roundWinnerId: null,
        roundResultSummary: null,
        ...(isNewMatch ? { winnerId: null, startedAt: new Date(), finishedAt: null } : {}),
      },
    });

    await tx.unoRoomAction.create({
      data: {
        roomId,
        actorId: starterPlayer.id,
        type: "START_ROUND",
        details: `Round ${roundNumber} started! Top card is ${topCard.color} [${topCard.value}]. ${starterPlayer.displayName}'s turn.`,
      },
    });
  });
}

function getNextPlayer<T extends { seatIndex: number }>(
  players: T[],
  currentSeatIndex: number,
  direction: number,
  steps = 1,
): T {
  const N = players.length;
  const nextSeat = (currentSeatIndex + direction * steps + N * 100) % N;
  return players.find((p) => p.seatIndex === nextSeat) || players[0];
}

export async function playCardAction({
  roomCode,
  actorUserId,
  cardId,
  chosenColor,
  calledUno,
}: {
  roomCode: string;
  actorUserId: string;
  cardId: string;
  chosenColor?: UnoColor;
  calledUno?: boolean;
}) {
  const room = await prisma.unoRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: { orderBy: { seatIndex: "asc" } } },
  });

  if (!room || room.status !== "PLAYING" || room.currentPhase !== "PLAYING") {
    throw new Error("Game is not active.");
  }

  const player = room.players.find((p) => p.userId === actorUserId);
  if (!player) {
    throw new Error("Player not found.");
  }

  if (room.currentTurnPlayerId !== player.id) {
    throw new Error("Not your turn!");
  }

  let hand: UnoCard[] = [];
  try {
    hand = JSON.parse(player.handJson || "[]");
  } catch {
    hand = [];
  }

  const cardIndex = hand.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) {
    throw new Error("Card not found in your hand.");
  }

  const card = hand[cardIndex];

  let topCard: UnoCard | null = null;
  try {
    topCard = JSON.parse(room.topCardJson || "null");
  } catch {
    topCard = null;
  }

  if (!isCardPlayable(card, room.activeColor, topCard)) {
    throw new Error("This card does not match the active color or top card symbol.");
  }

  const isWild = card.color === "WILD" || card.value === "WILD" || card.value === "WILD_DRAW_FOUR";
  if (isWild && (!chosenColor || chosenColor === "WILD")) {
    throw new Error("You must choose an active color (Red, Blue, Green, or Yellow) for Wild cards.");
  }

  const newActiveColor: UnoColor = isWild ? chosenColor! : card.color;

  let drawDeck: UnoCard[] = [];
  try {
    drawDeck = JSON.parse(room.drawDeckJson || "[]");
  } catch {
    drawDeck = [];
  }

  let discardPile: UnoCard[] = [];
  try {
    discardPile = JSON.parse(room.discardPileJson || "[]");
  } catch {
    discardPile = [];
  }

  // Remove card from hand and push to discard
  hand.splice(cardIndex, 1);
  discardPile.push(card);

  // Check if player called UNO
  const willHaveOneCard = hand.length === 1;
  const isUnoClaimed = willHaveOneCard ? (calledUno ?? player.hasCalledUno) : false;

  // Check if round won (hand emptied!)
  if (hand.length === 0) {
    await handleUnoRoundWin({
      roomId: room.id,
      room,
      winnerPlayer: player,
      lastCard: card,
      newTopCard: card,
      newActiveColor,
      discardPile,
      drawDeck,
    });
    return;
  }

  // Determine direction & next turn
  let direction = room.direction;
  let steps = 1;
  let penaltyCardsCount = 0;

  if (card.value === "REVERSE") {
    if (room.players.length === 2) {
      steps = 2; // In 2 players, reverse acts like a skip
    } else {
      direction = direction === 1 ? -1 : 1;
      steps = 1;
    }
  } else if (card.value === "SKIP") {
    steps = 2;
  } else if (card.value === "DRAW_TWO") {
    penaltyCardsCount = 2;
    steps = 2;
  } else if (card.value === "WILD_DRAW_FOUR") {
    penaltyCardsCount = 4;
    steps = 2;
  }

  // If next player receives penalty cards (+2 or +4)
  const targetPenaltyPlayer = getNextPlayer(room.players, player.seatIndex, direction, 1);
  const nextPlayer = getNextPlayer(room.players, player.seatIndex, direction, steps);

  if (penaltyCardsCount > 0) {
    // Ensure draw deck has enough cards
    if (drawDeck.length < penaltyCardsCount) {
      const recycled = shuffleCards(discardPile.slice(0, -1));
      drawDeck.push(...recycled);
      discardPile = [card];
    }
    const drawn = drawDeck.splice(0, penaltyCardsCount);

    let targetHand: UnoCard[] = [];
    try {
      targetHand = JSON.parse(targetPenaltyPlayer.handJson || "[]");
    } catch {
      targetHand = [];
    }
    targetHand.push(...drawn);

    await prisma.unoRoomPlayer.update({
      where: { id: targetPenaltyPlayer.id },
      data: {
        handJson: JSON.stringify(targetHand),
        cardsCount: targetHand.length,
        hasCalledUno: false,
      },
    });
  }

  await prisma.$transaction(async (tx) => {
    await tx.unoRoomPlayer.update({
      where: { id: player.id },
      data: {
        handJson: JSON.stringify(hand),
        cardsCount: hand.length,
        hasCalledUno: isUnoClaimed,
      },
    });

    await tx.unoRoom.update({
      where: { id: room.id },
      data: {
        topCardJson: JSON.stringify(card),
        activeColor: newActiveColor,
        direction,
        drawDeckJson: JSON.stringify(drawDeck),
        discardPileJson: JSON.stringify(discardPile),
        currentTurnPlayerId: nextPlayer.id,
        drawCardDrawnThisTurn: false,
      },
    });

    const unoMsg = willHaveOneCard && isUnoClaimed ? " shouts UNO! 🔥" : "";
    const penaltyMsg = penaltyCardsCount > 0 ? ` (+${penaltyCardsCount} to ${targetPenaltyPlayer.displayName})` : "";
    await tx.unoRoomAction.create({
      data: {
        roomId: room.id,
        actorId: player.id,
        type: "PLAY_CARD",
        value: `${card.color} ${card.value}`,
        details: `${player.displayName} played ${card.color} [${card.value}]${penaltyMsg}.${unoMsg}`,
      },
    });
  });
}

export async function drawCardAction({
  roomCode,
  actorUserId,
}: {
  roomCode: string;
  actorUserId: string;
}) {
  const room = await prisma.unoRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: true },
  });

  if (!room || room.status !== "PLAYING" || room.currentPhase !== "PLAYING") {
    throw new Error("Game is not active.");
  }

  const player = room.players.find((p) => p.userId === actorUserId);
  if (!player) {
    throw new Error("Player not found.");
  }

  if (room.currentTurnPlayerId !== player.id) {
    throw new Error("Not your turn!");
  }

  if (room.drawCardDrawnThisTurn) {
    throw new Error("You already drew a card this turn! Play a card or pass.");
  }

  let drawDeck: UnoCard[] = [];
  try {
    drawDeck = JSON.parse(room.drawDeckJson || "[]");
  } catch {
    drawDeck = [];
  }

  let discardPile: UnoCard[] = [];
  try {
    discardPile = JSON.parse(room.discardPileJson || "[]");
  } catch {
    discardPile = [];
  }

  // Recycle discard pile if deck is empty
  if (drawDeck.length === 0) {
    if (discardPile.length <= 1) {
      throw new Error("No cards left to draw!");
    }
    const recycled = shuffleCards(discardPile.slice(0, -1));
    drawDeck.push(...recycled);
    discardPile = discardPile.slice(-1);
  }

  const drawnCard = drawDeck.pop()!;

  let hand: UnoCard[] = [];
  try {
    hand = JSON.parse(player.handJson || "[]");
  } catch {
    hand = [];
  }
  hand.push(drawnCard);

  await prisma.$transaction(async (tx) => {
    await tx.unoRoomPlayer.update({
      where: { id: player.id },
      data: {
        handJson: JSON.stringify(hand),
        cardsCount: hand.length,
        hasCalledUno: false,
      },
    });

    await tx.unoRoom.update({
      where: { id: room.id },
      data: {
        drawDeckJson: JSON.stringify(drawDeck),
        discardPileJson: JSON.stringify(discardPile),
        drawCardDrawnThisTurn: true,
      },
    });

    await tx.unoRoomAction.create({
      data: {
        roomId: room.id,
        actorId: player.id,
        type: "DRAW_CARD",
        details: `${player.displayName} drew a card from the deck.`,
      },
    });
  });
}

export async function passTurnAction({
  roomCode,
  actorUserId,
}: {
  roomCode: string;
  actorUserId: string;
}) {
  const room = await prisma.unoRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: { orderBy: { seatIndex: "asc" } } },
  });

  if (!room || room.status !== "PLAYING" || room.currentPhase !== "PLAYING") {
    throw new Error("Game is not active.");
  }

  const player = room.players.find((p) => p.userId === actorUserId);
  if (!player) {
    throw new Error("Player not found.");
  }

  if (room.currentTurnPlayerId !== player.id) {
    throw new Error("Not your turn!");
  }

  if (!room.drawCardDrawnThisTurn) {
    throw new Error("You must draw a card from the deck before you can pass!");
  }

  const nextPlayer = getNextPlayer(room.players, player.seatIndex, room.direction, 1);

  await prisma.$transaction(async (tx) => {
    await tx.unoRoom.update({
      where: { id: room.id },
      data: {
        currentTurnPlayerId: nextPlayer.id,
        drawCardDrawnThisTurn: false,
      },
    });

    await tx.unoRoomAction.create({
      data: {
        roomId: room.id,
        actorId: player.id,
        type: "PASS_TURN",
        details: `${player.displayName} passed their turn.`,
      },
    });
  });
}

export async function callUnoAction({
  roomCode,
  actorUserId,
}: {
  roomCode: string;
  actorUserId: string;
}) {
  const room = await prisma.unoRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: true },
  });

  if (!room || room.status !== "PLAYING") {
    throw new Error("Game is not active.");
  }

  const player = room.players.find((p) => p.userId === actorUserId);
  if (!player) {
    throw new Error("Player not found.");
  }

  let hand: UnoCard[] = [];
  try {
    hand = JSON.parse(player.handJson || "[]");
  } catch {
    hand = [];
  }

  if (hand.length > 2) {
    throw new Error("You can only call UNO when you have 1 or 2 cards!");
  }

  await prisma.unoRoomPlayer.update({
    where: { id: player.id },
    data: { hasCalledUno: true },
  });

  await prisma.unoRoomAction.create({
    data: {
      roomId: room.id,
      actorId: player.id,
      type: "CALL_UNO",
      details: `🔥 ${player.displayName} called UNO! 🔥`,
    },
  });
}

export async function catchUnoAction({
  roomCode,
  actorUserId,
  targetPlayerId,
}: {
  roomCode: string;
  actorUserId: string;
  targetPlayerId: string;
}) {
  const room = await prisma.unoRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: true },
  });

  if (!room || room.status !== "PLAYING") {
    throw new Error("Game is not active.");
  }

  const catcher = room.players.find((p) => p.userId === actorUserId);
  const target = room.players.find((p) => p.id === targetPlayerId);

  if (!catcher || !target) {
    throw new Error("Player not found.");
  }

  if (catcher.id === target.id) {
    throw new Error("You cannot catch yourself!");
  }

  let targetHand: UnoCard[] = [];
  try {
    targetHand = JSON.parse(target.handJson || "[]");
  } catch {
    targetHand = [];
  }

  if (targetHand.length !== 1 || target.hasCalledUno) {
    throw new Error(`${target.displayName} is safe and cannot be caught!`);
  }

  // Draw 2 penalty cards for target
  let drawDeck: UnoCard[] = [];
  try {
    drawDeck = JSON.parse(room.drawDeckJson || "[]");
  } catch {
    drawDeck = [];
  }

  let discardPile: UnoCard[] = [];
  try {
    discardPile = JSON.parse(room.discardPileJson || "[]");
  } catch {
    discardPile = [];
  }

  if (drawDeck.length < 2) {
    const recycled = shuffleCards(discardPile.slice(0, -1));
    drawDeck.push(...recycled);
    discardPile = discardPile.slice(-1);
  }

  const penaltyCards = drawDeck.splice(0, 2);
  targetHand.push(...penaltyCards);

  await prisma.$transaction(async (tx) => {
    await tx.unoRoomPlayer.update({
      where: { id: target.id },
      data: {
        handJson: JSON.stringify(targetHand),
        cardsCount: targetHand.length,
        hasCalledUno: false,
      },
    });

    await tx.unoRoom.update({
      where: { id: room.id },
      data: {
        drawDeckJson: JSON.stringify(drawDeck),
        discardPileJson: JSON.stringify(discardPile),
      },
    });

    await tx.unoRoomAction.create({
      data: {
        roomId: room.id,
        actorId: catcher.id,
        type: "CATCH_UNO",
        details: `🚨 ${catcher.displayName} caught ${target.displayName} forgetting to say UNO! (+2 penalty cards)`,
      },
    });
  });
}

async function handleUnoRoundWin({
  roomId,
  room,
  winnerPlayer,
  lastCard,
  newTopCard,
  newActiveColor,
  discardPile,
  drawDeck,
}: {
  roomId: string;
  room: {
    id: string;
    scoreLimit: number;
    roundNumber: number;
    players: Array<{
      id: string;
      userId: string;
      displayName: string;
      score: number;
      handJson: string;
    }>;
  };
  winnerPlayer: {
    id: string;
    userId: string;
    displayName: string;
    score: number;
  };
  lastCard: UnoCard;
  newTopCard: UnoCard;
  newActiveColor: UnoColor;
  discardPile: UnoCard[];
  drawDeck: UnoCard[];
}) {
  let roundPoints = 0;
  for (const p of room.players) {
    if (p.id !== winnerPlayer.id) {
      let hand: UnoCard[] = [];
      try {
        hand = JSON.parse(p.handJson || "[]");
      } catch {
        hand = [];
      }
      roundPoints += calculateUnoHandPoints(hand);
    }
  }

  const newTotalScore = winnerPlayer.score + roundPoints;
  const isMatchWon = newTotalScore >= room.scoreLimit;

  const summary = `🎉 ${winnerPlayer.displayName} played their final card [${lastCard.color} ${lastCard.value}] and won the round! Scored +${roundPoints} points!`;

  await prisma.$transaction(async (tx) => {
    await tx.unoRoomPlayer.update({
      where: { id: winnerPlayer.id },
      data: {
        score: { increment: roundPoints },
        handJson: "[]",
        cardsCount: 0,
      },
    });

    await tx.unoRoom.update({
      where: { id: roomId },
      data: {
        currentPhase: isMatchWon ? "FINISHED" : "ROUND_OVER",
        status: isMatchWon ? "FINISHED" : "PLAYING",
        roundWinnerId: winnerPlayer.id,
        roundResultSummary: summary,
        winnerId: isMatchWon ? winnerPlayer.userId : null,
        finishedAt: isMatchWon ? new Date() : null,
        topCardJson: JSON.stringify(newTopCard),
        activeColor: newActiveColor,
        discardPileJson: JSON.stringify(discardPile),
        drawDeckJson: JSON.stringify(drawDeck),
      },
    });

    await tx.unoRoomAction.create({
      data: {
        roomId,
        actorId: winnerPlayer.id,
        type: "START_ROUND",
        details: summary,
      },
    });
  });
}

export async function nextRoundUnoAction({
  roomCode,
  userId,
}: {
  roomCode: string;
  userId: string;
}) {
  const room = await prisma.unoRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: { orderBy: { seatIndex: "asc" } } },
  });

  if (!room || room.status === "FINISHED") {
    throw new Error("Cannot start next round on a finished match.");
  }

  const hostPlayer = room.players.find((p) => p.userId === userId && p.isHost);
  if (!hostPlayer) {
    throw new Error("Only the host can start the next round.");
  }

  await dealAndStartUnoRound(room.id, room.roundNumber + 1, room.players, false);
}

export async function replayUnoGameAction({
  roomCode,
  userId,
}: {
  roomCode: string;
  userId: string;
}) {
  const room = await prisma.unoRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: { orderBy: { seatIndex: "asc" } } },
  });

  if (!room) {
    throw new Error("Table not found.");
  }

  const hostPlayer = room.players.find((p) => p.userId === userId && p.isHost);
  if (!hostPlayer) {
    throw new Error("Only the host can replay the match.");
  }

  await dealAndStartUnoRound(room.id, 1, room.players, true);
}

export async function leaveUnoRoomAction({
  roomCode,
  userId,
}: {
  roomCode: string;
  userId: string;
}) {
  const room = await prisma.unoRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: true },
  });

  if (!room) {
    throw new Error("Table not found.");
  }

  const leavingPlayer = room.players.find((p) => p.userId === userId);
  if (!leavingPlayer) {
    return { ok: true, deleted: false };
  }

  if (room.players.length <= 1) {
    await prisma.unoRoom.delete({ where: { id: room.id } });
    return { ok: true, deleted: true };
  }

  if (leavingPlayer.isHost) {
    const nextHost = room.players.find((p) => p.id !== leavingPlayer.id);
    if (nextHost) {
      await prisma.unoRoomPlayer.update({
        where: { id: nextHost.id },
        data: { isHost: true },
      });
    }
  }

  await prisma.unoRoomPlayer.delete({
    where: { id: leavingPlayer.id },
  });

  await prisma.unoRoomAction.create({
    data: {
      roomId: room.id,
      type: "LEAVE",
      details: `${leavingPlayer.displayName} left the table.`,
    },
  });

  return { ok: true, deleted: false };
}
