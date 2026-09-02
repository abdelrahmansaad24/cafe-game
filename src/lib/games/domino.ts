import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export const DOMINO_ROOM_CODE_REGEX = /^[A-Z0-9]{6}$/;

import {
  DominoTile,
  BoardTile,
  roundCafeScore,
  isTilePlayable,
  calculateHandPips,
} from "./domino-types";

export {
  type DominoTile,
  type BoardTile,
  roundCafeScore,
  isTilePlayable,
  calculateHandPips,
};

// Generate the 28 Double-6 domino tiles
export function generateFullDominoSet(): DominoTile[] {
  const tiles: DominoTile[] = [];
  for (let i = 0; i <= 6; i++) {
    for (let j = i; j <= 6; j++) {
      tiles.push([i, j]);
    }
  }
  return tiles;
}

function shuffleTiles<T>(array: T[]): T[] {
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


export async function listPublicDominoRooms() {
  return prisma.dominoRoom.findMany({
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
          team: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
}

export async function createDominoRoom({
  userId,
  displayName,
  title,
  visibility,
  password,
  scoreLimit = 100,
  mode = "SOLO",
}: {
  userId: string;
  displayName: string;
  title: string;
  visibility: "PUBLIC" | "PRIVATE";
  password?: string;
  scoreLimit?: number;
  mode?: "SOLO" | "TEAMS";
}) {
  const trimmedTitle = title.trim();
  if (trimmedTitle.length < 2 || trimmedTitle.length > 80) {
    throw new Error("Room title must be between 2 and 80 characters.");
  }

  const limit = Math.min(Math.max(scoreLimit, 10), 500);
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
      const room = await prisma.dominoRoom.create({
        data: {
          roomCode,
          title: trimmedTitle,
          visibility,
          passwordHash,
          scoreLimit: limit,
          mode,
          status: "WAITING",
          currentPhase: "PLAYING",
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
              details: `${displayName.trim() || "Host"} created the room.`,
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

  throw new Error("Failed to generate a unique room code. Please try again.");
}

export async function joinDominoRoom({
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
  const room = await prisma.dominoRoom.findUnique({
    where: { roomCode: normalizedCode },
    include: { players: { orderBy: { seatIndex: "asc" } } },
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
    throw new Error("Game is already in progress.");
  }

  if (room.players.length >= 4) {
    throw new Error("Room is full (max 4 players).");
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

  const nextSeat = room.players.length;
  // In Teams mode: Seats 0 & 2 are TEAM_A, Seats 1 & 3 are TEAM_B
  const assignedTeam =
    room.mode === "TEAMS"
      ? nextSeat % 2 === 0
        ? "TEAM_A"
        : "TEAM_B"
      : null;

  const newPlayer = await prisma.dominoRoomPlayer.create({
    data: {
      roomId: room.id,
      userId,
      displayName: displayName.trim() || "Player",
      seatIndex: nextSeat,
      team: assignedTeam,
      isHost: false,
    },
  });

  await prisma.dominoRoomAction.create({
    data: {
      roomId: room.id,
      actorId: newPlayer.id,
      type: "JOIN",
      details: `${newPlayer.displayName} joined the table (Seat ${nextSeat + 1}${
        assignedTeam ? ` - ${assignedTeam === "TEAM_A" ? "Team 1" : "Team 2"}` : ""
      }).`,
    },
  });

  return { room, player: newPlayer };
}

export async function getDominoRoomState(roomCode: string, currentUserId: string) {
  const normalizedCode = roomCode.toUpperCase().trim();
  const room = await prisma.dominoRoom.findUnique({
    where: { roomCode: normalizedCode },
    include: {
      players: { orderBy: { seatIndex: "asc" } },
      actions: { orderBy: { createdAt: "desc" }, take: 25 },
    },
  });

  if (!room) {
    throw new Error("Room not found.");
  }

  const selfPlayer = room.players.find((p) => p.userId === currentUserId);
  if (!selfPlayer) {
    throw new Error("Join the room first.");
  }

  const isRoundOver = room.currentPhase === "ROUND_OVER" || room.status === "FINISHED";

  let parsedBoard: BoardTile[] = [];
  try {
    parsedBoard = JSON.parse(room.boardTilesJson || "[]");
  } catch {
    parsedBoard = [];
  }

  let boneyardCount = 0;
  try {
    const boneyard = JSON.parse(room.boneyardJson || "[]") as DominoTile[];
    boneyardCount = boneyard.length;
  } catch {
    boneyardCount = 0;
  }

  // Sanitize player hands: only reveal own tiles unless round is over
  const sanitizedPlayers = room.players.map((p) => {
    let hand: DominoTile[] = [];
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
      team: p.team,
      score: p.score,
      tilesCount: hand.length,
      hand: showFullHand ? hand : null,
      pipSum: isRoundOver ? calculateHandPips(hand) : null,
      isHost: p.isHost,
    };
  });

  let selfHand: DominoTile[] = [];
  try {
    selfHand = JSON.parse(selfPlayer.handJson || "[]");
  } catch {
    selfHand = [];
  }

  // Calculate team total scores if TEAMS mode
  let teamAScore = 0;
  let teamBScore = 0;
  if (room.mode === "TEAMS") {
    room.players.forEach((p) => {
      if (p.team === "TEAM_A") teamAScore += p.score;
      if (p.team === "TEAM_B") teamBScore += p.score;
    });
  }

  return {
    room: {
      id: room.id,
      roomCode: room.roomCode,
      title: room.title,
      visibility: room.visibility,
      scoreLimit: room.scoreLimit,
      mode: room.mode,
      status: room.status,
      currentPhase: room.currentPhase,
      roundNumber: room.roundNumber,
      currentTurnPlayerId: room.currentTurnPlayerId,
      leftEnd: room.leftEnd,
      rightEnd: room.rightEnd,
      boardTiles: parsedBoard,
      boneyardCount,
      roundWinnerId: room.roundWinnerId,
      winningTeam: room.winningTeam,
      roundResultSummary: room.roundResultSummary,
      createdById: room.createdById,
      winnerId: room.winnerId,
      teamAScore,
      teamBScore,
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
      hand: selfHand,
      isHost: selfPlayer.isHost,
      isMyTurn: room.currentTurnPlayerId === selfPlayer.id && room.status === "PLAYING" && room.currentPhase === "PLAYING",
    },
  };
}

export async function startDominoRoom({
  roomCode,
  userId,
}: {
  roomCode: string;
  userId: string;
}) {
  const normalizedCode = roomCode.toUpperCase().trim();
  const room = await prisma.dominoRoom.findUnique({
    where: { roomCode: normalizedCode },
    include: { players: { orderBy: { seatIndex: "asc" } } },
  });

  if (!room) {
    throw new Error("Room not found.");
  }

  const hostPlayer = room.players.find((p) => p.userId === userId && p.isHost);
  if (!hostPlayer) {
    throw new Error("Only the host can start the game.");
  }

  const playerCount = room.players.length;
  if (playerCount < 2 || playerCount > 4) {
    throw new Error("Domino requires 2, 3, or 4 players.");
  }

  if (room.mode === "TEAMS" && playerCount !== 4) {
    throw new Error("Teams (2v2) mode requires exactly 4 players.");
  }

  await dealAndStartRound(room.id, 1, room.players, true);
}

async function dealAndStartRound(
  roomId: string,
  roundNumber: number,
  players: Array<{ id: string; userId: string; displayName: string; seatIndex: number }>,
  isNewMatch = false,
) {
  const playerCount = players.length;
  let fullSet = generateFullDominoSet();

  // Custom Arab Cafe Rule for 3 Players:
  // "when 3 players r playing each player take 9 cards and the card 0 0 is eliminated"
  if (playerCount === 3) {
    fullSet = fullSet.filter(([a, b]) => !(a === 0 && b === 0)); // Remove [0,0]
  }

  const shuffled = shuffleTiles(fullSet);

  let handSize = 7;
  if (playerCount === 3) {
    handSize = 9; // 3 players x 9 = 27 tiles (all tiles dealt, 0 in boneyard)
  } else if (playerCount === 2) {
    handSize = 7; // 2 players x 7 = 14 tiles (14 in boneyard)
  } else if (playerCount === 4) {
    handSize = 7; // 4 players x 7 = 28 tiles (all dealt)
  }

  const playerHands: Record<string, DominoTile[]> = {};
  for (let i = 0; i < playerCount; i++) {
    const startIdx = i * handSize;
    playerHands[players[i].id] = shuffled.slice(startIdx, startIdx + handSize);
  }

  const boneyard = shuffled.slice(playerCount * handSize);

  // Determine who opens the round:
  // Find the player holding the highest double tile [6,6], [5,5], [4,4], etc.
  let starterPlayerId = players[0].id;
  let highestDouble = -1;

  for (let d = 6; d >= 0; d--) {
    const targetDouble: DominoTile = [d, d];
    const foundPlayer = players.find((p) => {
      const hand = playerHands[p.id] || [];
      return hand.some(([a, b]) => (a === d && b === d));
    });
    if (foundPlayer) {
      starterPlayerId = foundPlayer.id;
      highestDouble = d;
      break;
    }
  }

  await prisma.$transaction(async (tx) => {
    for (const player of players) {
      await tx.dominoRoomPlayer.update({
        where: { id: player.id },
        data: {
          handJson: JSON.stringify(playerHands[player.id]),
          tilesCount: playerHands[player.id].length,
          ...(isNewMatch ? { score: 0 } : {}),
        },
      });
    }

    await tx.dominoRoom.update({
      where: { id: roomId },
      data: {
        status: "PLAYING",
        currentPhase: "PLAYING",
        roundNumber,
        currentTurnPlayerId: starterPlayerId,
        firstTurnPlayerId: starterPlayerId,
        leftEnd: null,
        rightEnd: null,
        boardTilesJson: "[]",
        boneyardJson: JSON.stringify(boneyard),
        consecutivePasses: 0,
        roundWinnerId: null,
        winningTeam: null,
        roundResultSummary: null,
        ...(isNewMatch ? { winnerId: null, startedAt: new Date(), finishedAt: null } : {}),
      },
    });

    const starter = players.find((p) => p.id === starterPlayerId);
    await tx.dominoRoomAction.create({
      data: {
        roomId,
        actorId: starterPlayerId,
        type: "START_ROUND",
        details: `Round ${roundNumber} started! ${starter?.displayName ?? "Player"} opens the game${
          highestDouble >= 0 ? ` with double [${highestDouble}|${highestDouble}]` : ""
        }.`,
      },
    });
  });
}

export async function playTileAction({
  roomCode,
  actorUserId,
  tile,
  side,
}: {
  roomCode: string;
  actorUserId: string;
  tile: DominoTile;
  side: "LEFT" | "RIGHT";
}) {
  const room = await prisma.dominoRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: { orderBy: { seatIndex: "asc" } } },
  });

  if (!room || room.status !== "PLAYING" || room.currentPhase !== "PLAYING") {
    throw new Error("Game is not actively in progress.");
  }

  const player = room.players.find((p) => p.userId === actorUserId);
  if (!player) {
    throw new Error("Player not found in room.");
  }

  if (room.currentTurnPlayerId !== player.id) {
    throw new Error("Not your turn!");
  }

  let hand: DominoTile[] = [];
  try {
    hand = JSON.parse(player.handJson || "[]");
  } catch {
    hand = [];
  }

  // Verify tile is in hand
  const tileIndex = hand.findIndex(
    ([a, b]) => (a === tile[0] && b === tile[1]) || (a === tile[1] && b === tile[0]),
  );
  if (tileIndex === -1) {
    throw new Error("You do not have this tile in your hand.");
  }

  let board: BoardTile[] = [];
  try {
    board = JSON.parse(room.boardTilesJson || "[]");
  } catch {
    board = [];
  }

  let newLeft = room.leftEnd;
  let newRight = room.rightEnd;
  const [t1, t2] = tile;

  if (board.length === 0) {
    // First tile played on empty board
    newLeft = t1;
    newRight = t2;
    board.push({ tile, side: "START", openVal: t2 });
  } else {
    // Validate connection
    if (side === "LEFT") {
      if (t1 === newLeft) {
        newLeft = t2;
        board.unshift({ tile: [t2, t1], side: "LEFT", openVal: t2 });
      } else if (t2 === newLeft) {
        newLeft = t1;
        board.unshift({ tile: [t1, t2], side: "LEFT", openVal: t1 });
      } else {
        throw new Error(`Tile [${t1}|${t2}] cannot connect to left end (${newLeft}).`);
      }
    } else {
      if (t1 === newRight) {
        newRight = t2;
        board.push({ tile: [t1, t2], side: "RIGHT", openVal: t2 });
      } else if (t2 === newRight) {
        newRight = t1;
        board.push({ tile: [t2, t1], side: "RIGHT", openVal: t1 });
      } else {
        throw new Error(`Tile [${t1}|${t2}] cannot connect to right end (${newRight}).`);
      }
    }
  }

  // Remove tile from hand
  hand.splice(tileIndex, 1);

  // Check if player won by playing last tile (Domino!)
  if (hand.length === 0) {
    await handleDominoRoundWin({
      roomId: room.id,
      room,
      winnerPlayer: player,
      isBlocked: false,
      updatedBoard: board,
      updatedLeft: newLeft,
      updatedRight: newRight,
      lastPlayedTile: tile,
    });
    return;
  }

  // Move to next player's turn clockwise
  const currentSeat = player.seatIndex;
  const nextSeat = (currentSeat + 1) % room.players.length;
  const nextPlayer = room.players.find((p) => p.seatIndex === nextSeat)!;

  await prisma.$transaction(async (tx) => {
    await tx.dominoRoomPlayer.update({
      where: { id: player.id },
      data: {
        handJson: JSON.stringify(hand),
        tilesCount: hand.length,
      },
    });

    await tx.dominoRoom.update({
      where: { id: room.id },
      data: {
        leftEnd: newLeft,
        rightEnd: newRight,
        boardTilesJson: JSON.stringify(board),
        currentTurnPlayerId: nextPlayer.id,
        consecutivePasses: 0, // Reset passes on valid play
      },
    });

    await tx.dominoRoomAction.create({
      data: {
        roomId: room.id,
        actorId: player.id,
        type: "PLAY_TILE",
        value: `[${t1}|${t2}]`,
        details: `${player.displayName} played [${t1}|${t2}] on ${side.toLowerCase()} end.`,
      },
    });
  });
}

export async function drawTileAction({
  roomCode,
  actorUserId,
}: {
  roomCode: string;
  actorUserId: string;
}) {
  const room = await prisma.dominoRoom.findUnique({
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

  let boneyard: DominoTile[] = [];
  try {
    boneyard = JSON.parse(room.boneyardJson || "[]");
  } catch {
    boneyard = [];
  }

  if (boneyard.length === 0) {
    throw new Error("Boneyard is empty! You must pass your turn.");
  }

  // Draw 1 tile from boneyard
  const drawnTile = boneyard.pop()!;

  let hand: DominoTile[] = [];
  try {
    hand = JSON.parse(player.handJson || "[]");
  } catch {
    hand = [];
  }
  hand.push(drawnTile);

  await prisma.$transaction(async (tx) => {
    await tx.dominoRoomPlayer.update({
      where: { id: player.id },
      data: {
        handJson: JSON.stringify(hand),
        tilesCount: hand.length,
      },
    });

    await tx.dominoRoom.update({
      where: { id: room.id },
      data: {
        boneyardJson: JSON.stringify(boneyard),
      },
    });

    await tx.dominoRoomAction.create({
      data: {
        roomId: room.id,
        actorId: player.id,
        type: "DRAW_TILE",
        details: `${player.displayName} drew a tile from the boneyard (${boneyard.length} remaining).`,
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
  const room = await prisma.dominoRoom.findUnique({
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

  // Ensure boneyard is empty before allowing a pass
  let boneyard: DominoTile[] = [];
  try {
    boneyard = JSON.parse(room.boneyardJson || "[]");
  } catch {
    boneyard = [];
  }

  if (boneyard.length > 0) {
    throw new Error("You must draw from the boneyard before passing!");
  }

  const newPassCount = room.consecutivePasses + 1;
  const isBlocked = newPassCount >= room.players.length;

  if (isBlocked) {
    // The game is blocked (القفلة)!
    await handleBlockedGameResolution(room);
    return;
  }

  const currentSeat = player.seatIndex;
  const nextSeat = (currentSeat + 1) % room.players.length;
  const nextPlayer = room.players.find((p) => p.seatIndex === nextSeat)!;

  await prisma.$transaction(async (tx) => {
    await tx.dominoRoom.update({
      where: { id: room.id },
      data: {
        currentTurnPlayerId: nextPlayer.id,
        consecutivePasses: newPassCount,
      },
    });

    await tx.dominoRoomAction.create({
      data: {
        roomId: room.id,
        actorId: player.id,
        type: "PASS_TURN",
        details: `${player.displayName} passed their turn.`,
      },
    });
  });
}

// Domino Round Win (Player emptied their hand)
async function handleDominoRoundWin({
  roomId,
  room,
  winnerPlayer,
  updatedBoard,
  updatedLeft,
  updatedRight,
  lastPlayedTile,
}: {
  roomId: string;
  room: {
    id: string;
    mode: "SOLO" | "TEAMS";
    scoreLimit: number;
    roundNumber: number;
    players: Array<{
      id: string;
      userId: string;
      displayName: string;
      team: "TEAM_A" | "TEAM_B" | null;
      score: number;
      handJson: string;
    }>;
  };
  winnerPlayer: {
    id: string;
    userId: string;
    displayName: string;
    team: "TEAM_A" | "TEAM_B" | null;
  };
  isBlocked: boolean;
  updatedBoard: BoardTile[];
  updatedLeft: number | null;
  updatedRight: number | null;
  lastPlayedTile: DominoTile;
}) {
  let rawScore = 0;

  if (room.mode === "TEAMS") {
    // In teams, winner gets sum of opposing team's remaining hand pips
    const opponentTeam = winnerPlayer.team === "TEAM_A" ? "TEAM_B" : "TEAM_A";
    room.players.forEach((p) => {
      if (p.team === opponentTeam) {
        let hand: DominoTile[] = [];
        try {
          hand = JSON.parse(p.handJson || "[]");
        } catch {
          hand = [];
        }
        rawScore += calculateHandPips(hand);
      }
    });
  } else {
    // In solo, winner gets sum of all other players' remaining hand pips
    room.players.forEach((p) => {
      if (p.id !== winnerPlayer.id) {
        let hand: DominoTile[] = [];
        try {
          hand = JSON.parse(p.handJson || "[]");
        } catch {
          hand = [];
        }
        rawScore += calculateHandPips(hand);
      }
    });
  }

  const roundedPoints = roundCafeScore(rawScore);
  const summary = `🀄 DOMINO! ${winnerPlayer.displayName} played their last tile [${lastPlayedTile[0]}|${lastPlayedTile[1]}]! Raw pips: ${rawScore} $\\rightarrow$ Scored ${roundedPoints} points!`;

  await awardDominoPoints({
    roomId,
    room,
    winnerPlayerId: winnerPlayer.id,
    winningTeam: winnerPlayer.team,
    pointsWon: roundedPoints,
    summary,
    updatedBoard,
    updatedLeft,
    updatedRight,
  });
}

// Blocked Game Resolution (القفلة)
// User rule:
// "Blocked in team on the player with minimum value his team when if 2 players have same minimum pip in 2 differnet teams it`s draw also for score calc 6 is raised to 10 5 is 0 and so on 16 + = 20 15 - = 10"
async function handleBlockedGameResolution(room: {
  id: string;
  mode: "SOLO" | "TEAMS";
  scoreLimit: number;
  roundNumber: number;
  players: Array<{
    id: string;
    userId: string;
    displayName: string;
    team: "TEAM_A" | "TEAM_B" | null;
    score: number;
    handJson: string;
  }>;
}) {
  const playerPips = room.players.map((p) => {
    let hand: DominoTile[] = [];
    try {
      hand = JSON.parse(p.handJson || "[]");
    } catch {
      hand = [];
    }
    return {
      player: p,
      pips: calculateHandPips(hand),
    };
  });

  playerPips.sort((a, b) => a.pips - b.pips);
  const minPipValue = playerPips[0].pips;
  const lowestPlayers = playerPips.filter((item) => item.pips === minPipValue);

  if (room.mode === "TEAMS") {
    // Check if 2 players from different teams tied with lowest pips:
    const hasTeamA = lowestPlayers.some((item) => item.player.team === "TEAM_A");
    const hasTeamB = lowestPlayers.some((item) => item.player.team === "TEAM_B");

    if (hasTeamA && hasTeamB) {
      // It's a DRAW! No team scores.
      const summary = `🔒 BLOCKED (القفلة)! Both teams tied with the lowest pip count (${minPipValue} pips)! It is a DRAW (تعادل) - no points awarded!`;
      await prisma.$transaction(async (tx) => {
        await tx.dominoRoom.update({
          where: { id: room.id },
          data: {
            currentPhase: "ROUND_OVER",
            roundWinnerId: null,
            winningTeam: null,
            roundResultSummary: summary,
          },
        });
        await tx.dominoRoomAction.create({
          data: {
            roomId: room.id,
            type: "PASS_TURN",
            details: summary,
          },
        });
      });
      return;
    }

    // Otherwise, the team with the lowest pip player wins!
    const winningPlayer = lowestPlayers[0].player;
    const winningTeam = winningPlayer.team;
    const opponentTeam = winningTeam === "TEAM_A" ? "TEAM_B" : "TEAM_A";

    let rawScore = 0;
    playerPips.forEach((item) => {
      if (item.player.team === opponentTeam) {
        rawScore += item.pips;
      }
    });

    const roundedPoints = roundCafeScore(rawScore);
    const summary = `🔒 BLOCKED (القفلة)! ${winningPlayer.displayName} had the lowest pips (${minPipValue}). ${
      winningTeam === "TEAM_A" ? "Team 1" : "Team 2"
    } wins the round! Opponents' pips: ${rawScore} $\\rightarrow$ Scored ${roundedPoints} points!`;

    await awardDominoPoints({
      roomId: room.id,
      room,
      winnerPlayerId: winningPlayer.id,
      winningTeam,
      pointsWon: roundedPoints,
      summary,
    });
  } else {
    // SOLO mode
    if (lowestPlayers.length > 1) {
      // Tie in solo -> Draw
      const summary = `🔒 BLOCKED (القفلة)! Multiple players tied with lowest ${minPipValue} pips. It's a DRAW!`;
      await prisma.$transaction(async (tx) => {
        await tx.dominoRoom.update({
          where: { id: room.id },
          data: {
            currentPhase: "ROUND_OVER",
            roundWinnerId: null,
            roundResultSummary: summary,
          },
        });
        await tx.dominoRoomAction.create({
          data: {
            roomId: room.id,
            type: "PASS_TURN",
            details: summary,
          },
        });
      });
      return;
    }

    const winner = lowestPlayers[0].player;
    let rawScore = 0;
    playerPips.forEach((item) => {
      if (item.player.id !== winner.id) {
        rawScore += item.pips;
      }
    });

    const roundedPoints = roundCafeScore(rawScore);
    const summary = `🔒 BLOCKED (القفلة)! ${winner.displayName} had the lowest pips (${minPipValue}) and wins the round! Total other pips: ${rawScore} $\\rightarrow$ Scored ${roundedPoints} points!`;

    await awardDominoPoints({
      roomId: room.id,
      room,
      winnerPlayerId: winner.id,
      winningTeam: null,
      pointsWon: roundedPoints,
      summary,
    });
  }
}

async function awardDominoPoints({
  roomId,
  room,
  winnerPlayerId,
  winningTeam,
  pointsWon,
  summary,
  updatedBoard,
  updatedLeft,
  updatedRight,
}: {
  roomId: string;
  room: {
    id: string;
    mode: "SOLO" | "TEAMS";
    scoreLimit: number;
    players: Array<{
      id: string;
      userId: string;
      displayName: string;
      team: "TEAM_A" | "TEAM_B" | null;
      score: number;
    }>;
  };
  winnerPlayerId: string;
  winningTeam?: "TEAM_A" | "TEAM_B" | null;
  pointsWon: number;
  summary: string;
  updatedBoard?: BoardTile[];
  updatedLeft?: number | null;
  updatedRight?: number | null;
}) {
  await prisma.$transaction(async (tx) => {
    // If teams mode, add points to both teammates
    if (room.mode === "TEAMS" && winningTeam) {
      for (const p of room.players) {
        if (p.team === winningTeam) {
          await tx.dominoRoomPlayer.update({
            where: { id: p.id },
            data: { score: { increment: pointsWon } },
          });
        }
      }
    } else {
      await tx.dominoRoomPlayer.update({
        where: { id: winnerPlayerId },
        data: { score: { increment: pointsWon } },
      });
    }

    // Check if match is won
    const allPlayers = await tx.dominoRoomPlayer.findMany({
      where: { roomId },
    });

    let matchWon = false;
    let championUserId: string | null = null;

    if (room.mode === "TEAMS") {
      let scoreTeamA = 0;
      let scoreTeamB = 0;
      allPlayers.forEach((p) => {
        if (p.team === "TEAM_A") scoreTeamA = p.score; // (both teammates have same score)
        if (p.team === "TEAM_B") scoreTeamB = p.score;
      });

      if (scoreTeamA >= room.scoreLimit) {
        matchWon = true;
        const teamAPlayer = allPlayers.find((p) => p.team === "TEAM_A");
        championUserId = teamAPlayer?.userId ?? null;
      } else if (scoreTeamB >= room.scoreLimit) {
        matchWon = true;
        const teamBPlayer = allPlayers.find((p) => p.team === "TEAM_B");
        championUserId = teamBPlayer?.userId ?? null;
      }
    } else {
      const champion = allPlayers.find((p) => p.score >= room.scoreLimit);
      if (champion) {
        matchWon = true;
        championUserId = champion.userId;
      }
    }

    await tx.dominoRoom.update({
      where: { id: roomId },
      data: {
        currentPhase: matchWon ? "FINISHED" : "ROUND_OVER",
        status: matchWon ? "FINISHED" : "PLAYING",
        roundWinnerId: winnerPlayerId,
        winningTeam: winningTeam ?? null,
        roundResultSummary: summary,
        winnerId: championUserId,
        finishedAt: matchWon ? new Date() : null,
        ...(updatedBoard ? { boardTilesJson: JSON.stringify(updatedBoard) } : {}),
        ...(updatedLeft !== undefined ? { leftEnd: updatedLeft } : {}),
        ...(updatedRight !== undefined ? { rightEnd: updatedRight } : {}),
      },
    });

    await tx.dominoRoomAction.create({
      data: {
        roomId,
        actorId: winnerPlayerId,
        type: "START_ROUND",
        details: summary,
      },
    });
  });
}

export async function nextRoundDominoAction({
  roomCode,
  userId,
}: {
  roomCode: string;
  userId: string;
}) {
  const room = await prisma.dominoRoom.findUnique({
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

  await dealAndStartRound(room.id, room.roundNumber + 1, room.players, false);
}

export async function replayDominoGameAction({
  roomCode,
  userId,
}: {
  roomCode: string;
  userId: string;
}) {
  const room = await prisma.dominoRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: { orderBy: { seatIndex: "asc" } } },
  });

  if (!room) {
    throw new Error("Room not found.");
  }

  const hostPlayer = room.players.find((p) => p.userId === userId && p.isHost);
  if (!hostPlayer) {
    throw new Error("Only the host can replay the match.");
  }

  await dealAndStartRound(room.id, 1, room.players, true);
}

export async function leaveDominoRoomAction({
  roomCode,
  userId,
}: {
  roomCode: string;
  userId: string;
}) {
  const room = await prisma.dominoRoom.findUnique({
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
    await prisma.dominoRoom.delete({ where: { id: room.id } });
    return { ok: true, deleted: true };
  }

  if (leavingPlayer.isHost) {
    const nextHost = room.players.find((p) => p.id !== leavingPlayer.id);
    if (nextHost) {
      await prisma.dominoRoomPlayer.update({
        where: { id: nextHost.id },
        data: { isHost: true },
      });
    }
  }

  await prisma.dominoRoomPlayer.delete({
    where: { id: leavingPlayer.id },
  });

  await prisma.dominoRoomAction.create({
    data: {
      roomId: room.id,
      type: "LEAVE",
      details: `${leavingPlayer.displayName} left the table.`,
    },
  });

  return { ok: true, deleted: false };
}
