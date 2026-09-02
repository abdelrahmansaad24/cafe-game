import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import {
  calculateGridPoints,
  isBasraMatch,
  ScrewCard,
  ScrewCardSlot,
  ScrewCardType,
} from "./screw-types";

export const SCREW_ROOM_CODE_REGEX = /^[A-Z0-9]{6}$/;

export { calculateGridPoints, isBasraMatch, type ScrewCard, type ScrewCardSlot, type ScrewCardType };

export function generateScrewDeck(): ScrewCard[] {
  const deck: ScrewCard[] = [];
  let id = 1;

  // 0 cards (4 cards, value 0)
  for (let i = 0; i < 4; i++) {
    deck.push({
      id: `sc-${id++}`,
      value: 0,
      type: "NUMBER",
      label: "0",
      actionNameEn: "Zero",
      actionNameAr: "صفر",
      descriptionEn: "Zero points (Safe card)",
      descriptionAr: "صفر نقط (كرت ممتاز)",
      isAction: false,
    });
  }

  // 1 to 6 cards (4 of each)
  for (let num = 1; num <= 6; num++) {
    for (let i = 0; i < 4; i++) {
      deck.push({
        id: `sc-${id++}`,
        value: num,
        type: "NUMBER",
        label: String(num),
        actionNameEn: `Number ${num}`,
        actionNameAr: `رقم ${num}`,
        descriptionEn: `${num} points`,
        descriptionAr: `${num} نقط`,
        isAction: false,
      });
    }
  }

  // 7 & 8: بص في ورقتك (Peek Self) - 4 of each
  for (const num of [7, 8]) {
    for (let i = 0; i < 4; i++) {
      deck.push({
        id: `sc-${id++}`,
        value: num,
        type: "PEEK_SELF",
        label: String(num),
        actionNameEn: "Peek Self",
        actionNameAr: "بص في ورقتك",
        descriptionEn: "Peek privately at one of your own cards",
        descriptionAr: "شاهد أحد كروتك المغطاة في السر",
        isAction: true,
      });
    }
  }

  // 9 & 10: بص في ورقة غيرك (Peek Opponent) - 4 of each
  for (const num of [9, 10]) {
    for (let i = 0; i < 4; i++) {
      deck.push({
        id: `sc-${id++}`,
        value: num,
        type: "PEEK_OTHER",
        label: String(num),
        actionNameEn: "Peek Opponent",
        actionNameAr: "بص في ورقة غيرك",
        descriptionEn: "Peek privately at any opponent's card",
        descriptionAr: "شاهد أحد كروت أي خصم في السر",
        isAction: true,
      });
    }
  }

  // خد وهات (Blind Swap) - 4 cards, value 11
  for (let i = 0; i < 4; i++) {
    deck.push({
      id: `sc-${id++}`,
      value: 11,
      type: "SWAP",
      label: "خد وهات 🔁",
      actionNameEn: "Blind Swap",
      actionNameAr: "خد وهات (تبديل عشوائي)",
      descriptionEn: "Blindly swap one of your cards with an opponent's card",
      descriptionAr: "بدل أحد كروتك مع كرت خصم على عماك",
      isAction: true,
    });
  }

  // بينج بونج (Ping Pong) 🏓 - 4 cards, value 10
  for (let i = 0; i < 4; i++) {
    deck.push({
      id: `sc-${id++}`,
      value: 10,
      type: "PING_PONG",
      label: "بينج بونج 🏓",
      actionNameEn: "Ping Pong",
      actionNameAr: "بينج بونج (كشف واختيار التبديل)",
      descriptionEn: "Look at your card & opponent's card, then choose whether to swap them!",
      descriptionAr: "اكشف كرتك وكرت خصمك في السر وقرر هل تبدلهم أو تتركهم!",
      isAction: true,
    });
  }

  // الحرامي (The Thief) 🦹 - 4 cards, value 10
  for (let i = 0; i < 4; i++) {
    deck.push({
      id: `sc-${id++}`,
      value: 10,
      type: "THE_THIEF",
      label: "الحرامي 🦹",
      actionNameEn: "The Thief",
      actionNameAr: "الحرامي (اسرق كرت خصم)",
      descriptionEn: "Peek at an opponent's card, steal it into your grid, and give them your card!",
      descriptionAr: "اكشف كرت من عند أي خصم واسرقه لشبكتك واعطيه كرتك غير المرغوب فيه!",
      isAction: true,
    });
  }

  // كعب داير (Spy All) - 2 cards, value 12
  for (let i = 0; i < 2; i++) {
    deck.push({
      id: `sc-${id++}`,
      value: 12,
      type: "SPY_ALL",
      label: "كعب داير 🎡",
      actionNameEn: "Spy All",
      actionNameAr: "كعب داير (شوف كرت من الكل)",
      descriptionEn: "Look at one card from each opponent at the table",
      descriptionAr: "شاهد كرت واحد من كل لاعب على الطاولة",
      isAction: true,
    });
  }

  // Red Kings (♥, ♦) - 2 cards, value -1 (best card!)
  for (let i = 0; i < 2; i++) {
    deck.push({
      id: `sc-${id++}`,
      value: -1,
      type: "NUMBER",
      label: "K♥",
      suit: "HEARTS",
      actionNameEn: "Red King",
      actionNameAr: "شايب أحمر (-1 نقط)",
      descriptionEn: "-1 Point (Best card in the game!)",
      descriptionAr: "-1 نقطة (أفضل كرت في اللعبة)",
      isAction: false,
    });
  }

  // Black Kings (♠, ♣) - 2 cards, value 25 (hazard!)
  for (let i = 0; i < 2; i++) {
    deck.push({
      id: `sc-${id++}`,
      value: 25,
      type: "NUMBER",
      label: "K♠",
      suit: "SPADES",
      actionNameEn: "Black King",
      actionNameAr: "شايب أسود (25 نقطة)",
      descriptionEn: "25 Points penalty (Can Basra with 0!)",
      descriptionAr: "25 نقطة عقوبة (يبصر مع الصفر والعكس!)",
      isAction: false,
    });
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

export async function listPublicScrewRooms() {
  return prisma.screwRoom.findMany({
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

export async function createScrewRoom({
  userId,
  displayName,
  title,
  visibility,
  password,
  mode = "SOLO",
  cardsPerPlayer = 4,
  scoreLimit = 100,
  turnTimerSeconds = 30,
  doubleFinalRound = false,
  screwPenaltyType = "PLUS_30",
}: {
  userId: string;
  displayName: string;
  title: string;
  visibility: "PUBLIC" | "PRIVATE";
  password?: string;
  mode?: "SOLO" | "TEAMS";
  cardsPerPlayer?: number;
  scoreLimit?: number;
  turnTimerSeconds?: number;
  doubleFinalRound?: boolean;
  screwPenaltyType?: "PLUS_30" | "DOUBLE_SCORE";
}) {
  const trimmedTitle = title.trim();
  if (trimmedTitle.length < 2 || trimmedTitle.length > 80) {
    throw new Error("Table title must be between 2 and 80 characters.");
  }

  const validCards = cardsPerPlayer === 6 ? 6 : 4;
  const validLimit = Math.min(Math.max(scoreLimit, 50), 300);

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
      const room = await prisma.screwRoom.create({
        data: {
          roomCode,
          title: trimmedTitle,
          visibility,
          passwordHash,
          mode,
          cardsPerPlayer: validCards,
          scoreLimit: validLimit,
          turnTimerSeconds,
          doubleFinalRound,
          screwPenaltyType,
          status: "WAITING",
          currentPhase: "PEEKING",
          createdById: userId,
          players: {
            create: {
              userId,
              displayName: displayName.trim() || "Host",
              seatIndex: 0,
              team: mode === "TEAMS" ? "TEAM_A" : null,
              isHost: true,
            },
          },
          actions: {
            create: {
              type: "JOIN",
              details: `${displayName.trim() || "Host"} created the Screw table (${validCards} cards, ${mode === "TEAMS" ? "2v2 Teams" : "Solo"}).`,
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

export async function joinScrewRoom({
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
  const room = await prisma.screwRoom.findUnique({
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

  const maxPlayers = room.mode === "TEAMS" ? 4 : 8;
  if (room.players.length >= maxPlayers) {
    throw new Error(`Table is full (maximum ${maxPlayers} players).`);
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
  const assignedTeam =
    room.mode === "TEAMS"
      ? nextSeat % 2 === 0
        ? "TEAM_A"
        : "TEAM_B"
      : null;

  const newPlayer = await prisma.screwRoomPlayer.create({
    data: {
      roomId: room.id,
      userId,
      displayName: displayName.trim() || "Player",
      seatIndex: nextSeat,
      team: assignedTeam,
      isHost: false,
    },
  });

  await prisma.screwRoomAction.create({
    data: {
      roomId: room.id,
      actorId: newPlayer.id,
      type: "JOIN",
      details: `${newPlayer.displayName} took Seat ${nextSeat + 1}${
        assignedTeam ? ` (${assignedTeam === "TEAM_A" ? "Team 1" : "Team 2"})` : ""
      }.`,
    },
  });

  return { room, player: newPlayer };
}

export async function getScrewRoomState(roomCode: string, currentUserId: string) {
  const normalizedCode = roomCode.toUpperCase().trim();
  const room = await prisma.screwRoom.findUnique({
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

  let discardPile: ScrewCard[] = [];
  try {
    discardPile = JSON.parse(room.discardPileJson || "[]");
  } catch {
    discardPile = [];
  }
  const topDiscardCard = discardPile.length > 0 ? discardPile[discardPile.length - 1] : null;

  let drawDeckCount = 0;
  try {
    const deck = JSON.parse(room.drawDeckJson || "[]") as ScrewCard[];
    drawDeckCount = deck.length;
  } catch {
    drawDeckCount = 0;
  }

  let activeDrawnCard: ScrewCard | null = null;
  try {
    activeDrawnCard = room.activeDrawnCardJson ? JSON.parse(room.activeDrawnCardJson) : null;
  } catch {
    activeDrawnCard = null;
  }

  let pendingAction: { type: ScrewCardType; [key: string]: unknown } | null = null;
  try {
    pendingAction = room.pendingActionJson ? JSON.parse(room.pendingActionJson) : null;
  } catch {
    pendingAction = null;
  }

  const sanitizedPlayers = room.players.map((p) => {
    let rawGrid: ScrewCardSlot[] = [];
    try {
      rawGrid = JSON.parse(p.gridJson || "[]");
    } catch {
      rawGrid = [];
    }

    const grid = rawGrid.map((slot) => {
      const isKnownToMe = slot.revealedToUserIds?.includes(currentUserId) ?? false;
      const isInitialPeekingForMe =
        room.currentPhase === "PEEKING" &&
        p.userId === currentUserId &&
        !p.initialPeekDone &&
        (room.cardsPerPlayer === 6 ? slot.slotIndex >= 4 : slot.slotIndex >= 2);

      const showCardFace = isRoundOver || isInitialPeekingForMe;

      return {
        id: slot.id,
        slotIndex: slot.slotIndex,
        card: showCardFace ? slot.card : null,
        isKnownToMe,
      };
    });

    const totalPoints = isRoundOver ? calculateGridPoints(rawGrid) : null;

    return {
      id: p.id,
      userId: p.userId,
      displayName: p.displayName,
      seatIndex: p.seatIndex,
      team: p.team,
      score: p.score,
      initialPeekDone: p.initialPeekDone,
      grid,
      cardsCount: rawGrid.length,
      totalPoints,
      isHost: p.isHost,
    };
  });

  const isMyTurn =
    room.currentTurnPlayerId === selfPlayer.id &&
    (room.currentPhase === "PLAYING" || room.currentPhase === "FINAL_TURNS");

  return {
    room: {
      id: room.id,
      roomCode: room.roomCode,
      title: room.title,
      visibility: room.visibility,
      mode: room.mode,
      cardsPerPlayer: room.cardsPerPlayer,
      scoreLimit: room.scoreLimit,
      turnTimerSeconds: room.turnTimerSeconds,
      turnStartedAt: room.turnStartedAt,
      doubleFinalRound: room.doubleFinalRound,
      screwPenaltyType: room.screwPenaltyType,
      status: room.status,
      currentPhase: room.currentPhase,
      roundNumber: room.roundNumber,
      currentTurnPlayerId: room.currentTurnPlayerId,
      screwCallerId: room.screwCallerId,
      finalTurnsRemaining: room.finalTurnsRemaining,
      topDiscardCard,
      drawDeckCount,
      discardPileCount: discardPile.length,
      activeDrawnCard: isMyTurn ? activeDrawnCard : null,
      activeDrawnFrom: isMyTurn ? room.activeDrawnFrom : null,
      pendingAction: isMyTurn ? pendingAction : null,
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
      team: selfPlayer.team,
      score: selfPlayer.score,
      initialPeekDone: selfPlayer.initialPeekDone,
      isHost: selfPlayer.isHost,
      isMyTurn,
    },
  };
}

export async function startScrewRoom({
  roomCode,
  userId,
}: {
  roomCode: string;
  userId: string;
}) {
  const normalizedCode = roomCode.toUpperCase().trim();
  const room = await prisma.screwRoom.findUnique({
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
    throw new Error("Screw requires at least 2 players.");
  }

  await dealAndStartScrewRound(room.id, 1, room.players, room.cardsPerPlayer, true);
}

async function dealAndStartScrewRound(
  roomId: string,
  roundNumber: number,
  players: Array<{ id: string; userId: string; displayName: string; seatIndex: number }>,
  cardsPerPlayer: number,
  isNewMatch = false,
) {
  const playerCount = players.length;
  const fullDeck = shuffleCards(generateScrewDeck());

  const playerGrids: Record<string, ScrewCardSlot[]> = {};

  for (let i = 0; i < playerCount; i++) {
    const startIdx = i * cardsPerPlayer;
    const cards = fullDeck.slice(startIdx, startIdx + cardsPerPlayer);
    playerGrids[players[i].id] = cards.map((card, slotIndex) => ({
      id: `slot-${players[i].id}-${slotIndex}-${roundNumber}`,
      card,
      slotIndex,
      revealedToUserIds: [], // Hidden initially
    }));
  }

  const remainingDeck = fullDeck.slice(playerCount * cardsPerPlayer);
  const starterDiscardCard = remainingDeck.pop()!;

  const starterPlayer = players[0];

  await prisma.$transaction(async (tx) => {
    for (const player of players) {
      await tx.screwRoomPlayer.update({
        where: { id: player.id },
        data: {
          gridJson: JSON.stringify(playerGrids[player.id]),
          initialPeekDone: false,
          ...(isNewMatch ? { score: 0 } : {}),
        },
      });
    }

    await tx.screwRoom.update({
      where: { id: roomId },
      data: {
        status: "PLAYING",
        currentPhase: "PEEKING", // First peek phase
        roundNumber,
        currentTurnPlayerId: starterPlayer.id,
        screwCallerId: null,
        finalTurnsRemaining: 0,
        drawDeckJson: JSON.stringify(remainingDeck),
        discardPileJson: JSON.stringify([starterDiscardCard]),
        activeDrawnCardJson: null,
        activeDrawnFrom: null,
        pendingActionJson: null,
        roundWinnerId: null,
        roundResultSummary: null,
        ...(isNewMatch ? { winnerId: null, startedAt: new Date(), finishedAt: null } : {}),
      },
    });

    await tx.screwRoomAction.create({
      data: {
        roomId,
        actorId: starterPlayer.id,
        type: "START_ROUND",
        details: `Round ${roundNumber} started! Memorize your 2 cards, then begin play!`,
      },
    });
  });
}

export async function finishInitialPeekAction({
  roomCode,
  actorUserId,
}: {
  roomCode: string;
  actorUserId: string;
}) {
  const room = await prisma.screwRoom.findUnique({
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

  let grid: ScrewCardSlot[] = [];
  try {
    grid = JSON.parse(player.gridJson || "[]");
  } catch {
    grid = [];
  }

  // Mark bottom 2 cards as revealed to this player (e.g. slots 2 and 3 for 4-card grid, or 4 and 5 for 6-card)
  const peekIndices =
    grid.length === 6 ? [4, 5] : [grid.length - 2, grid.length - 1];

  for (const idx of peekIndices) {
    if (grid[idx]) {
      if (!grid[idx].revealedToUserIds.includes(actorUserId)) {
        grid[idx].revealedToUserIds.push(actorUserId);
      }
    }
  }

  await prisma.screwRoomPlayer.update({
    where: { id: player.id },
    data: {
      gridJson: JSON.stringify(grid),
      initialPeekDone: true,
    },
  });

  // Check if all players completed initial peek
  const refreshedRoom = await prisma.screwRoom.findUnique({
    where: { id: room.id },
    include: { players: true },
  });

  const allReady = refreshedRoom?.players.every((p) => p.initialPeekDone);
  if (allReady && room.currentPhase === "PEEKING") {
    await prisma.screwRoom.update({
      where: { id: room.id },
      data: {
        currentPhase: "PLAYING",
        turnStartedAt: new Date(),
      },
    });
  }
}

function getNextPlayer<T extends { seatIndex: number }>(
  players: T[],
  currentSeatIndex: number,
): T {
  const N = players.length;
  const nextSeat = (currentSeatIndex + 1) % N;
  return players.find((p) => p.seatIndex === nextSeat) || players[0];
}

export async function drawCardAction({
  roomCode,
  actorUserId,
  source,
}: {
  roomCode: string;
  actorUserId: string;
  source: "DECK" | "DISCARD";
}) {
  const room = await prisma.screwRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: true },
  });

  if (
    !room ||
    room.status !== "PLAYING" ||
    (room.currentPhase !== "PLAYING" && room.currentPhase !== "FINAL_TURNS")
  ) {
    throw new Error("Cannot draw right now.");
  }

  const player = room.players.find((p) => p.userId === actorUserId);
  if (!player) {
    throw new Error("Player not found.");
  }

  if (room.currentTurnPlayerId !== player.id) {
    throw new Error("Not your turn!");
  }

  if (room.activeDrawnCardJson) {
    throw new Error("You already drew a card! Replace a slot or discard it.");
  }

  let drawDeck: ScrewCard[] = [];
  try {
    drawDeck = JSON.parse(room.drawDeckJson || "[]");
  } catch {
    drawDeck = [];
  }

  let discardPile: ScrewCard[] = [];
  try {
    discardPile = JSON.parse(room.discardPileJson || "[]");
  } catch {
    discardPile = [];
  }

  let drawnCard: ScrewCard;

  if (source === "DISCARD") {
    if (discardPile.length === 0) {
      throw new Error("Discard pile is empty.");
    }
    drawnCard = discardPile.pop()!;
  } else {
    if (drawDeck.length === 0) {
      if (discardPile.length <= 1) {
        throw new Error("No cards left in deck or discard.");
      }
      const recycled = shuffleCards(discardPile.slice(0, -1));
      drawDeck.push(...recycled);
      discardPile = discardPile.slice(-1);
    }
    drawnCard = drawDeck.pop()!;
  }

  await prisma.$transaction(async (tx) => {
    await tx.screwRoom.update({
      where: { id: room.id },
      data: {
        drawDeckJson: JSON.stringify(drawDeck),
        discardPileJson: JSON.stringify(discardPile),
        activeDrawnCardJson: JSON.stringify(drawnCard),
        activeDrawnFrom: source,
      },
    });

    await tx.screwRoomAction.create({
      data: {
        roomId: room.id,
        actorId: player.id,
        type: source === "DECK" ? "DRAW_DECK" : "DRAW_DISCARD",
        details: `${player.displayName} drew a card from the ${source === "DECK" ? "draw deck" : "discard pile"}.`,
      },
    });
  });
}

export async function replaceSlotAction({
  roomCode,
  actorUserId,
  slotIndex,
}: {
  roomCode: string;
  actorUserId: string;
  slotIndex: number;
}) {
  const room = await prisma.screwRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: { orderBy: { seatIndex: "asc" } } },
  });

  if (!room || room.status !== "PLAYING") {
    throw new Error("Game is not active.");
  }

  const player = room.players.find((p) => p.userId === actorUserId);
  if (!player || room.currentTurnPlayerId !== player.id) {
    throw new Error("Not your turn!");
  }

  if (!room.activeDrawnCardJson) {
    throw new Error("Draw a card first before replacing.");
  }

  const drawnCard: ScrewCard = JSON.parse(room.activeDrawnCardJson);

  let grid: ScrewCardSlot[] = [];
  try {
    grid = JSON.parse(player.gridJson || "[]");
  } catch {
    grid = [];
  }

  if (slotIndex < 0 || slotIndex >= grid.length) {
    throw new Error("Invalid card slot index.");
  }

  const oldCard = grid[slotIndex].card;

  // Put drawn card in slot (known to this player)
  grid[slotIndex] = {
    id: `slot-${player.id}-${slotIndex}-${Date.now()}`,
    card: drawnCard,
    slotIndex,
    revealedToUserIds: [actorUserId],
  };

  let discardPile: ScrewCard[] = [];
  try {
    discardPile = JSON.parse(room.discardPileJson || "[]");
  } catch {
    discardPile = [];
  }
  discardPile.push(oldCard);

  await handleTurnEnd({
    room,
    player,
    updatedGrid: grid,
    updatedDiscard: discardPile,
    actionDetails: `${player.displayName} swapped a card into their grid (discarded [${oldCard.label}]).`,
  });
}

export async function discardDrawnCardAction({
  roomCode,
  actorUserId,
}: {
  roomCode: string;
  actorUserId: string;
}) {
  const room = await prisma.screwRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: { orderBy: { seatIndex: "asc" } } },
  });

  if (!room || room.status !== "PLAYING") {
    throw new Error("Game is not active.");
  }

  const player = room.players.find((p) => p.userId === actorUserId);
  if (!player || room.currentTurnPlayerId !== player.id) {
    throw new Error("Not your turn!");
  }

  if (!room.activeDrawnCardJson) {
    throw new Error("Draw a card first.");
  }

  if (room.activeDrawnFrom === "DISCARD") {
    throw new Error("Cards taken from discard pile MUST be swapped into your grid!");
  }

  const drawnCard: ScrewCard = JSON.parse(room.activeDrawnCardJson);

  let discardPile: ScrewCard[] = [];
  try {
    discardPile = JSON.parse(room.discardPileJson || "[]");
  } catch {
    discardPile = [];
  }
  discardPile.push(drawnCard);

  // If drawn card is an action card, set pending action for player to use
  if (drawnCard.isAction) {
    await prisma.$transaction(async (tx) => {
      await tx.screwRoom.update({
        where: { id: room.id },
        data: {
          discardPileJson: JSON.stringify(discardPile),
          activeDrawnCardJson: null,
          activeDrawnFrom: null,
          pendingActionJson: JSON.stringify({ type: drawnCard.type, cardId: drawnCard.id }),
        },
      });

      await tx.screwRoomAction.create({
        data: {
          roomId: room.id,
          actorId: player.id,
          type: "DISCARD_DRAWN",
          details: `${player.displayName} discarded [${drawnCard.label}] and triggered action: ${drawnCard.actionNameAr}!`,
        },
      });
    });
    return;
  }

  // Normal number card discarded, end turn
  let grid: ScrewCardSlot[] = [];
  try {
    grid = JSON.parse(player.gridJson || "[]");
  } catch {
    grid = [];
  }

  await handleTurnEnd({
    room,
    player,
    updatedGrid: grid,
    updatedDiscard: discardPile,
    actionDetails: `${player.displayName} discarded drawn card [${drawnCard.label}].`,
  });
}

export async function applyActionMove({
  roomCode,
  actorUserId,
  actionPayload,
}: {
  roomCode: string;
  actorUserId: string;
  actionPayload: {
    type: ScrewCardType;
    selfSlotIndex?: number;
    targetPlayerId?: string;
    targetSlotIndex?: number;
    doSwap?: boolean; // For ping pong
  };
}) {
  const room = await prisma.screwRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: { orderBy: { seatIndex: "asc" } } },
  });

  if (!room || room.status !== "PLAYING") {
    throw new Error("Game is not active.");
  }

  const player = room.players.find((p) => p.userId === actorUserId);
  if (!player || room.currentTurnPlayerId !== player.id) {
    throw new Error("Not your turn!");
  }

  if (!room.pendingActionJson) {
    throw new Error("No action pending.");
  }

  const pending: { type: ScrewCardType } = JSON.parse(room.pendingActionJson);

  let grid: ScrewCardSlot[] = [];
  try {
    grid = JSON.parse(player.gridJson || "[]");
  } catch {
    grid = [];
  }

  let discardPile: ScrewCard[] = [];
  try {
    discardPile = JSON.parse(room.discardPileJson || "[]");
  } catch {
    discardPile = [];
  }

  let actionLog = "";

  if (pending.type === "PEEK_SELF") {
    const slotIdx = actionPayload.selfSlotIndex ?? 0;
    if (grid[slotIdx]) {
      if (!grid[slotIdx].revealedToUserIds.includes(actorUserId)) {
        grid[slotIdx].revealedToUserIds.push(actorUserId);
      }
      actionLog = `${player.displayName} peeked at their slot #${slotIdx + 1}.`;
    }
  } else if (pending.type === "PEEK_OTHER") {
    const targetPlayer = room.players.find((p) => p.id === actionPayload.targetPlayerId);
    if (!targetPlayer) throw new Error("Target player not found.");

    let targetGrid: ScrewCardSlot[] = [];
    try {
      targetGrid = JSON.parse(targetPlayer.gridJson || "[]");
    } catch {
      targetGrid = [];
    }

    const slotIdx = actionPayload.targetSlotIndex ?? 0;
    if (targetGrid[slotIdx]) {
      if (!targetGrid[slotIdx].revealedToUserIds.includes(actorUserId)) {
        targetGrid[slotIdx].revealedToUserIds.push(actorUserId);
      }
      await prisma.screwRoomPlayer.update({
        where: { id: targetPlayer.id },
        data: { gridJson: JSON.stringify(targetGrid) },
      });
      actionLog = `${player.displayName} peeked at ${targetPlayer.displayName}'s slot #${slotIdx + 1}.`;
    }
  } else if (pending.type === "SWAP") {
    const targetPlayer = room.players.find((p) => p.id === actionPayload.targetPlayerId);
    if (!targetPlayer || targetPlayer.id === player.id) throw new Error("Choose an opponent.");

    let targetGrid: ScrewCardSlot[] = [];
    try {
      targetGrid = JSON.parse(targetPlayer.gridJson || "[]");
    } catch {
      targetGrid = [];
    }

    const selfIdx = actionPayload.selfSlotIndex ?? 0;
    const oppIdx = actionPayload.targetSlotIndex ?? 0;

    const myOldCard = grid[selfIdx].card;
    const oppOldCard = targetGrid[oppIdx].card;

    grid[selfIdx].card = oppOldCard;
    grid[selfIdx].revealedToUserIds = []; // reset knowledge

    targetGrid[oppIdx].card = myOldCard;
    targetGrid[oppIdx].revealedToUserIds = []; // reset knowledge

    await prisma.screwRoomPlayer.update({
      where: { id: targetPlayer.id },
      data: { gridJson: JSON.stringify(targetGrid) },
    });

    actionLog = `${player.displayName} swapped a card with ${targetPlayer.displayName} (خد وهات)!`;
  } else if (pending.type === "PING_PONG") {
    const targetPlayer = room.players.find((p) => p.id === actionPayload.targetPlayerId);
    if (!targetPlayer || targetPlayer.id === player.id) throw new Error("Choose an opponent.");

    let targetGrid: ScrewCardSlot[] = [];
    try {
      targetGrid = JSON.parse(targetPlayer.gridJson || "[]");
    } catch {
      targetGrid = [];
    }

    const selfIdx = actionPayload.selfSlotIndex ?? 0;
    const oppIdx = actionPayload.targetSlotIndex ?? 0;

    // Both cards become known to actor
    if (!grid[selfIdx].revealedToUserIds.includes(actorUserId)) {
      grid[selfIdx].revealedToUserIds.push(actorUserId);
    }
    if (!targetGrid[oppIdx].revealedToUserIds.includes(actorUserId)) {
      targetGrid[oppIdx].revealedToUserIds.push(actorUserId);
    }

    if (actionPayload.doSwap) {
      const myCard = grid[selfIdx].card;
      grid[selfIdx].card = targetGrid[oppIdx].card;
      targetGrid[oppIdx].card = myCard;
      actionLog = `🏓 ${player.displayName} played Ping Pong and swapped cards with ${targetPlayer.displayName}!`;
    } else {
      actionLog = `🏓 ${player.displayName} played Ping Pong and kept cards without swapping.`;
    }

    await prisma.screwRoomPlayer.update({
      where: { id: targetPlayer.id },
      data: { gridJson: JSON.stringify(targetGrid) },
    });
  } else if (pending.type === "THE_THIEF") {
    const targetPlayer = room.players.find((p) => p.id === actionPayload.targetPlayerId);
    if (!targetPlayer || targetPlayer.id === player.id) throw new Error("Choose an opponent to steal from.");

    let targetGrid: ScrewCardSlot[] = [];
    try {
      targetGrid = JSON.parse(targetPlayer.gridJson || "[]");
    } catch {
      targetGrid = [];
    }

    const selfIdx = actionPayload.selfSlotIndex ?? 0;
    const oppIdx = actionPayload.targetSlotIndex ?? 0;

    const stolenCard = targetGrid[oppIdx].card;
    const myGivenCard = grid[selfIdx].card;

    grid[selfIdx].card = stolenCard;
    grid[selfIdx].revealedToUserIds = [actorUserId]; // Actor knows stolen card

    targetGrid[oppIdx].card = myGivenCard;
    targetGrid[oppIdx].revealedToUserIds = [actorUserId]; // Actor knows given card

    await prisma.screwRoomPlayer.update({
      where: { id: targetPlayer.id },
      data: { gridJson: JSON.stringify(targetGrid) },
    });

    actionLog = `🦹 ${player.displayName} played The Thief (الحرامي) and stole a card from ${targetPlayer.displayName}!`;
  }

  await handleTurnEnd({
    room,
    player,
    updatedGrid: grid,
    updatedDiscard: discardPile,
    actionDetails: actionLog || `${player.displayName} finished their action.`,
  });
}

export async function declareBasraAction({
  roomCode,
  actorUserId,
  slotIndex,
}: {
  roomCode: string;
  actorUserId: string;
  slotIndex: number;
}) {
  const room = await prisma.screwRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: { orderBy: { seatIndex: "asc" } } },
  });

  if (
    !room ||
    room.status !== "PLAYING" ||
    (room.currentPhase !== "PLAYING" && room.currentPhase !== "FINAL_TURNS")
  ) {
    throw new Error("Cannot declare Basra right now.");
  }

  const player = room.players.find((p) => p.userId === actorUserId);
  if (!player) {
    throw new Error("Player not found.");
  }

  let discardPile: ScrewCard[] = [];
  try {
    discardPile = JSON.parse(room.discardPileJson || "[]");
  } catch {
    discardPile = [];
  }

  if (discardPile.length === 0) {
    throw new Error("Cannot Basra: Discard pile is empty.");
  }

  const topDiscardCard = discardPile[discardPile.length - 1];

  let grid: ScrewCardSlot[] = [];
  try {
    grid = JSON.parse(player.gridJson || "[]");
  } catch {
    grid = [];
  }

  if (slotIndex < 0 || slotIndex >= grid.length) {
    throw new Error("Invalid card slot.");
  }

  const targetSlot = grid[slotIndex];
  const myCard = targetSlot.card;

  const isMatch = isBasraMatch(myCard, topDiscardCard);

  let drawDeck: ScrewCard[] = [];
  try {
    drawDeck = JSON.parse(room.drawDeckJson || "[]");
  } catch {
    drawDeck = [];
  }

  if (isMatch) {
    // SUCCESSFUL BASRA!
    grid.splice(slotIndex, 1);
    grid = grid.map((slot, i) => ({ ...slot, slotIndex: i }));
    discardPile.push(myCard);

    await prisma.$transaction(async (tx) => {
      await tx.screwRoomPlayer.update({
        where: { id: player.id },
        data: { gridJson: JSON.stringify(grid) },
      });

      await tx.screwRoom.update({
        where: { id: room.id },
        data: { discardPileJson: JSON.stringify(discardPile) },
      });

      await tx.screwRoomAction.create({
        data: {
          roomId: room.id,
          actorId: player.id,
          type: "BASRA",
          details: `💥 بصرة صحيحة! ${player.displayName} ألقى بصرة بكرت [${myCard.label}] على [${topDiscardCard.label}] وتخلص من كرت بنجاح!`,
        },
      });
    });

    return {
      success: true,
      isMatch: true,
      matchedCard: myCard,
      topDiscardCard,
      messageAr: `💥 بصرة صحيحة! كرتك [${myCard.label}] طابق [${topDiscardCard.label}] وتخلصت منه!`,
      messageEn: `💥 Successful Basra! Your card [${myCard.label}] matched [${topDiscardCard.label}]!`,
    };
  } else {
    // FAILED BASRA!
    if (!targetSlot.revealedToUserIds.includes(actorUserId)) {
      targetSlot.revealedToUserIds.push(actorUserId);
    }

    const tableCard = discardPile.pop()!;
    if (discardPile.length === 0 && drawDeck.length > 0) {
      discardPile.push(drawDeck.pop()!);
    }

    grid.push({
      id: `slot-${player.id}-${grid.length}-${Date.now()}`,
      card: tableCard,
      slotIndex: grid.length,
      revealedToUserIds: [actorUserId],
    });

    await prisma.$transaction(async (tx) => {
      await tx.screwRoomPlayer.update({
        where: { id: player.id },
        data: { gridJson: JSON.stringify(grid) },
      });

      await tx.screwRoom.update({
        where: { id: room.id },
        data: {
          discardPileJson: JSON.stringify(discardPile),
          drawDeckJson: JSON.stringify(drawDeck),
        },
      });

      await tx.screwRoomAction.create({
        data: {
          roomId: room.id,
          actorId: player.id,
          type: "BASRA",
          details: `❌ بصرة خاطئة! ${player.displayName} حاول البصرة بكرت [${myCard.label}] بدلاً من [${topDiscardCard.label}]، وأخذ الكرتين كعقوبة!`,
        },
      });
    });

    return {
      success: true,
      isMatch: false,
      myCard,
      topDiscardCard,
      messageAr: `❌ بصرة خاطئة! كرتك كان [${myCard.label}] وليس [${topDiscardCard.label}]. أخذت الكرتين كعقوبة!`,
      messageEn: `❌ Failed Basra! Your card was [${myCard.label}] not [${topDiscardCard.label}]. Penalty card added!`,
    };
  }
}

export async function callScrewAction({
  roomCode,
  actorUserId,
}: {
  roomCode: string;
  actorUserId: string;
}) {
  const room = await prisma.screwRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: { orderBy: { seatIndex: "asc" } } },
  });

  if (!room || room.status !== "PLAYING" || room.currentPhase !== "PLAYING") {
    throw new Error("Cannot call Screw right now.");
  }

  const player = room.players.find((p) => p.userId === actorUserId);
  if (!player || room.currentTurnPlayerId !== player.id) {
    throw new Error("Not your turn!");
  }

  if (room.screwCallerId) {
    throw new Error("Screw has already been called this round!");
  }

  const finalTurns = room.players.length - 1;
  const nextPlayer = getNextPlayer(room.players, player.seatIndex);

  await prisma.$transaction(async (tx) => {
    await tx.screwRoom.update({
      where: { id: room.id },
      data: {
        screwCallerId: player.id,
        currentPhase: "FINAL_TURNS",
        finalTurnsRemaining: finalTurns,
        currentTurnPlayerId: nextPlayer.id,
        turnStartedAt: new Date(),
      },
    });

    await tx.screwRoomAction.create({
      data: {
        roomId: room.id,
        actorId: player.id,
        type: "CALL_SCREW",
        details: `🚨 ${player.displayName} called "سكرو!" (SCREW!). Every player gets ONE final turn!`,
      },
    });
  });
}

async function handleTurnEnd({
  room,
  player,
  updatedGrid,
  updatedDiscard,
  actionDetails,
}: {
  room: {
    id: string;
    mode: string;
    scoreLimit: number;
    roundNumber: number;
    currentPhase: string;
    screwCallerId: string | null;
    finalTurnsRemaining: number;
    doubleFinalRound: boolean;
    screwPenaltyType: string;
    players: Array<{
      id: string;
      userId: string;
      displayName: string;
      seatIndex: number;
      team: string | null;
      score: number;
      gridJson: string;
    }>;
  };
  player: { id: string; seatIndex: number };
  updatedGrid: ScrewCardSlot[];
  updatedDiscard: ScrewCard[];
  actionDetails: string;
}) {
  let isRoundFinished = false;
  let remainingTurns = room.finalTurnsRemaining;

  if (room.currentPhase === "FINAL_TURNS") {
    remainingTurns -= 1;
    if (remainingTurns <= 0) {
      isRoundFinished = true;
    }
  }

  const nextPlayer = getNextPlayer(room.players, player.seatIndex);

  if (isRoundFinished) {
    await finalizeScrewRound({
      roomId: room.id,
      room,
      updatedPlayerId: player.id,
      updatedGrid,
      updatedDiscard,
    });
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.screwRoomPlayer.update({
      where: { id: player.id },
      data: { gridJson: JSON.stringify(updatedGrid) },
    });

    await tx.screwRoom.update({
      where: { id: room.id },
      data: {
        activeDrawnCardJson: null,
        activeDrawnFrom: null,
        pendingActionJson: null,
        currentTurnPlayerId: nextPlayer.id,
        turnStartedAt: new Date(),
        finalTurnsRemaining: remainingTurns,
        discardPileJson: JSON.stringify(updatedDiscard),
      },
    });

    await tx.screwRoomAction.create({
      data: {
        roomId: room.id,
        actorId: player.id,
        type: "DISCARD_DRAWN",
        details: actionDetails,
      },
    });
  });
}

async function finalizeScrewRound({
  roomId,
  room,
  updatedPlayerId,
  updatedGrid,
  updatedDiscard,
}: {
  roomId: string;
  room: {
    id: string;
    mode: string;
    scoreLimit: number;
    roundNumber: number;
    screwCallerId: string | null;
    doubleFinalRound: boolean;
    screwPenaltyType: string;
    players: Array<{
      id: string;
      userId: string;
      displayName: string;
      seatIndex: number;
      team: string | null;
      score: number;
      gridJson: string;
    }>;
  };
  updatedPlayerId: string;
  updatedGrid: ScrewCardSlot[];
  updatedDiscard: ScrewCard[];
}) {
  const playerScores: Record<string, number> = {};

  for (const p of room.players) {
    const grid: ScrewCardSlot[] =
      p.id === updatedPlayerId ? updatedGrid : JSON.parse(p.gridJson || "[]");
    playerScores[p.id] = calculateGridPoints(grid);
  }

  const callerId = room.screwCallerId;
  const callerPlayer = room.players.find((p) => p.id === callerId);

  let callerSuccess = false;
  if (room.mode === "TEAMS") {
    let teamAScore = 0;
    let teamBScore = 0;
    for (const p of room.players) {
      if (p.team === "TEAM_A") teamAScore += playerScores[p.id];
      else if (p.team === "TEAM_B") teamBScore += playerScores[p.id];
    }
    const callerTeam = callerPlayer?.team;
    callerSuccess =
      callerTeam === "TEAM_A" ? teamAScore <= teamBScore : teamBScore <= teamAScore;
  } else {
    let minScore = Infinity;
    for (const pid in playerScores) {
      if (playerScores[pid] < minScore) {
        minScore = playerScores[pid];
      }
    }
    callerSuccess = callerId ? playerScores[callerId] === minScore : false;
  }

  // Check if double points applies (near threshold or custom rule)
  const isDoubleRound =
    room.doubleFinalRound &&
    room.players.some((p) => p.score >= room.scoreLimit - 25);

  const multiplier = isDoubleRound ? 2 : 1;

  // Calculate points gained this round
  const pointsGained: Record<string, number> = {};
  for (const p of room.players) {
    if (p.id === callerId) {
      if (callerSuccess) {
        pointsGained[p.id] = 0;
      } else {
        const penalty =
          room.screwPenaltyType === "DOUBLE_SCORE"
            ? playerScores[p.id] * 2
            : playerScores[p.id] + 30;
        pointsGained[p.id] = penalty * multiplier;
      }
    } else if (
      room.mode === "TEAMS" &&
      callerSuccess &&
      p.team === callerPlayer?.team
    ) {
      // Winning team teammate also gets 0 points
      pointsGained[p.id] = 0;
    } else {
      pointsGained[p.id] = playerScores[p.id] * multiplier;
    }
  }

  // Find match champion
  let lowestTotalScore = Infinity;
  let matchChampionId: string | null = null;
  let hasLimitBurst = false;

  for (const p of room.players) {
    const newTotal = p.score + pointsGained[p.id];
    if (newTotal >= room.scoreLimit) {
      hasLimitBurst = true;
    }
    if (newTotal < lowestTotalScore) {
      lowestTotalScore = newTotal;
      matchChampionId = p.userId;
    }
  }

  const isMatchFinished = hasLimitBurst;

  const callerResultText = callerPlayer
    ? callerSuccess
      ? `🎉 ${callerPlayer.displayName} called Screw and won the round! (0 points awarded)`
      : `⚠️ ${callerPlayer.displayName} failed Screw call! (${
          room.screwPenaltyType === "DOUBLE_SCORE" ? "2x Double Score" : "+30 points"
        } penalty applied)`
    : "";

  const doubleNotice = isDoubleRound ? " 🔥 [DOUBLE POINTS APPLIED!]" : "";
  const summary = `Round ${room.roundNumber} ended! ${callerResultText}${doubleNotice}`;

  await prisma.$transaction(async (tx) => {
    for (const p of room.players) {
      const g: ScrewCardSlot[] =
        p.id === updatedPlayerId ? updatedGrid : JSON.parse(p.gridJson || "[]");

      // Reveal all cards
      const revealed = g.map((slot) => ({
        ...slot,
        revealedToUserIds: room.players.map((pl) => pl.userId),
      }));

      await tx.screwRoomPlayer.update({
        where: { id: p.id },
        data: {
          score: { increment: pointsGained[p.id] },
          gridJson: JSON.stringify(revealed),
        },
      });
    }

    await tx.screwRoom.update({
      where: { id: roomId },
      data: {
        currentPhase: isMatchFinished ? "FINISHED" : "ROUND_OVER",
        status: isMatchFinished ? "FINISHED" : "PLAYING",
        roundResultSummary: summary,
        winnerId: isMatchFinished ? matchChampionId : null,
        finishedAt: isMatchFinished ? new Date() : null,
        activeDrawnCardJson: null,
        activeDrawnFrom: null,
        pendingActionJson: null,
        discardPileJson: JSON.stringify(updatedDiscard),
      },
    });

    await tx.screwRoomAction.create({
      data: {
        roomId,
        type: "START_ROUND",
        details: summary,
      },
    });
  });
}

export async function nextRoundScrewAction({
  roomCode,
  userId,
}: {
  roomCode: string;
  userId: string;
}) {
  const room = await prisma.screwRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: { orderBy: { seatIndex: "asc" } } },
  });

  if (!room || room.status === "FINISHED") {
    throw new Error("Cannot start next round on finished match.");
  }

  const hostPlayer = room.players.find((p) => p.userId === userId && p.isHost);
  if (!hostPlayer) {
    throw new Error("Only the host can start the next round.");
  }

  await dealAndStartScrewRound(room.id, room.roundNumber + 1, room.players, room.cardsPerPlayer, false);
}

export async function replayScrewGameAction({
  roomCode,
  userId,
}: {
  roomCode: string;
  userId: string;
}) {
  const room = await prisma.screwRoom.findUnique({
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

  await dealAndStartScrewRound(room.id, 1, room.players, room.cardsPerPlayer, true);
}

export async function leaveScrewRoomAction({
  roomCode,
  userId,
}: {
  roomCode: string;
  userId: string;
}) {
  const room = await prisma.screwRoom.findUnique({
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
    await prisma.screwRoom.delete({ where: { id: room.id } });
    return { ok: true, deleted: true };
  }

  if (leavingPlayer.isHost) {
    const nextHost = room.players.find((p) => p.id !== leavingPlayer.id);
    if (nextHost) {
      await prisma.screwRoomPlayer.update({
        where: { id: nextHost.id },
        data: { isHost: true },
      });
    }
  }

  await prisma.screwRoomPlayer.delete({
    where: { id: leavingPlayer.id },
  });

  await prisma.screwRoomAction.create({
    data: {
      roomId: room.id,
      type: "LEAVE",
      details: `${leavingPlayer.displayName} left the table.`,
    },
  });

  return { ok: true, deleted: false };
}
