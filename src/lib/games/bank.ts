import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import {
  BANK_TILES,
  BoardTile,
  COLOR_GROUP_DETAILS,
  ColorGroup,
  LUCK_CARDS,
  PropertiesStateMap,
} from "./bank-types";

export const BANK_ROOM_CODE_REGEX = /^[A-Z0-9]{6}$/;

const AVATARS = ["🚗", "🎩", "🛳️", "✈️", "🐎", "👑", "🚀", "🛵"];
const PLAYER_COLORS = [
  "#ef4444", // Red
  "#3b82f6", // Blue
  "#22c55e", // Green
  "#eab308", // Yellow
  "#a855f7", // Purple
  "#ec4899", // Pink
  "#f97316", // Orange
  "#06b6d4", // Cyan
];

function generateRoomCode(): string {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    const randomIndex = crypto.randomInt(0, characters.length);
    code += characters[randomIndex];
  }
  return code;
}

/**
 * Calculates current rent for a property based on ownership and buildings
 */
export function calculateRent(
  tile: BoardTile,
  propState: { houses: number; isMortgaged: boolean },
  allProperties: PropertiesStateMap,
  ownerId: string,
  diceRoll = 7,
): number {
  if (propState.isMortgaged) return 0;

  if (tile.type === "PROPERTY") {
    // Check if owner holds monopoly of this color group
    const groupDetails = COLOR_GROUP_DETAILS[tile.colorGroup];
    const hasMonopoly = groupDetails.tileIndices.every(
      (idx) => allProperties[idx]?.ownerId === ownerId,
    );

    if (propState.houses > 0) {
      return tile.rentTiers[propState.houses];
    }
    // Double base rent on unimproved properties in a complete monopoly
    return hasMonopoly ? tile.baseRent * 2 : tile.baseRent;
  }

  if (tile.type === "RAILROAD") {
    // 25, 50, 100, 200 based on number of airports owned
    const transportIndices = COLOR_GROUP_DETAILS.TRANSPORT.tileIndices;
    const ownedCount = transportIndices.filter(
      (idx) => allProperties[idx]?.ownerId === ownerId,
    ).length;
    return 25 * Math.pow(2, Math.max(0, ownedCount - 1));
  }

  if (tile.type === "UTILITY") {
    // 4x dice if 1 utility owned, 10x dice if both utilities owned
    const utilityIndices = COLOR_GROUP_DETAILS.UTILITY.tileIndices;
    const ownedCount = utilityIndices.filter(
      (idx) => allProperties[idx]?.ownerId === ownerId,
    ).length;
    return ownedCount >= 2 ? diceRoll * 10 : diceRoll * 4;
  }

  return 0;
}

export async function createBankRoom({
  title,
  visibility,
  password,
  hostUserId,
  hostDisplayName,
}: {
  title: string;
  visibility: "PUBLIC" | "PRIVATE";
  password?: string;
  hostUserId: string;
  hostDisplayName: string;
}) {
  let roomCode = generateRoomCode();
  while (await prisma.bankRoom.findUnique({ where: { roomCode } })) {
    roomCode = generateRoomCode();
  }

  const room = await prisma.bankRoom.create({
    data: {
      roomCode,
      title: title.trim() || "بنك الحظ",
      visibility,
      passwordHash: password ? password.trim() : null,
      createdById: hostUserId,
      status: "WAITING",
      players: {
        create: {
          userId: hostUserId,
          displayName: hostDisplayName.trim(),
          seatIndex: 0,
          isHost: true,
          avatar: AVATARS[0],
          color: PLAYER_COLORS[0],
          money: 1500,
          position: 0,
        },
      },
    },
    include: { players: true },
  });

  await prisma.bankRoomAction.create({
    data: {
      roomId: room.id,
      actorId: room.players[0].id,
      type: "JOIN",
      details: `${hostDisplayName} created Bank El Hazz room [${roomCode}].`,
    },
  });

  return room;
}

export async function listPublicBankRooms() {
  return prisma.bankRoom.findMany({
    where: {
      visibility: "PUBLIC",
      status: "WAITING",
    },
    include: {
      players: {
        select: {
          id: true,
          displayName: true,
          avatar: true,
          seatIndex: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function getBankRoomState(roomCode: string, currentUserId?: string) {
  const room = await prisma.bankRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: {
      players: { orderBy: { seatIndex: "asc" } },
      actions: { orderBy: { createdAt: "desc" }, take: 30 },
    },
  });

  if (!room) return null;

  let properties: PropertiesStateMap = {};
  try {
    properties = JSON.parse(room.propertiesStateJson || "{}");
  } catch {
    properties = {};
  }

  const selfPlayer = room.players.find((p) => p.userId === currentUserId);

  return {
    room: {
      id: room.id,
      roomCode: room.roomCode,
      title: room.title,
      visibility: room.visibility,
      status: room.status,
      currentPhase: room.currentPhase,
      currentTurnPlayerId: room.currentTurnPlayerId,
      dice1: room.dice1,
      dice2: room.dice2,
      doublesCount: room.doublesCount,
      lastRollWasDoubles: room.lastRollWasDoubles,
      winnerPlayerId: room.winnerPlayerId,
      roundNumber: room.roundNumber,
      properties,
    },
    players: room.players.map((p) => ({
      id: p.id,
      userId: p.userId,
      displayName: p.displayName,
      seatIndex: p.seatIndex,
      money: p.money,
      position: p.position,
      inJail: p.inJail,
      jailTurns: p.jailTurns,
      jailFreeCards: p.jailFreeCards,
      isBankrupt: p.isBankrupt,
      isHost: p.isHost,
      avatar: p.avatar,
      color: p.color,
      isMyTurn: p.id === room.currentTurnPlayerId,
      ownedTileIndices: Object.entries(properties)
        .filter(([, st]) => st.ownerId === p.id)
        .map(([idx]) => Number(idx)),
    })),
    selfPlayer: selfPlayer
      ? {
          id: selfPlayer.id,
          userId: selfPlayer.userId,
          displayName: selfPlayer.displayName,
          isHost: selfPlayer.isHost,
          isMyTurn: selfPlayer.id === room.currentTurnPlayerId,
          money: selfPlayer.money,
          position: selfPlayer.position,
          inJail: selfPlayer.inJail,
          isBankrupt: selfPlayer.isBankrupt,
          avatar: selfPlayer.avatar,
          color: selfPlayer.color,
          jailFreeCards: selfPlayer.jailFreeCards,
        }
      : null,
    actions: room.actions,
  };
}

export async function joinBankRoom({
  roomCode,
  userId,
  displayName,
}: {
  roomCode: string;
  userId: string;
  displayName: string;
}) {
  const room = await prisma.bankRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: true },
  });

  if (!room) throw new Error("Room not found.");
  if (room.status !== "WAITING") throw new Error("Match already started.");
  if (room.players.length >= 6) throw new Error("Room is full (max 6 players).");

  const existing = room.players.find((p) => p.userId === userId);
  if (existing) return existing;

  const seatIndex = room.players.length;
  const avatar = AVATARS[seatIndex % AVATARS.length];
  const color = PLAYER_COLORS[seatIndex % PLAYER_COLORS.length];

  const newPlayer = await prisma.bankRoomPlayer.create({
    data: {
      roomId: room.id,
      userId,
      displayName: displayName.trim(),
      seatIndex,
      avatar,
      color,
      money: 1500,
      position: 0,
    },
  });

  await prisma.bankRoomAction.create({
    data: {
      roomId: room.id,
      actorId: newPlayer.id,
      type: "JOIN",
      details: `${displayName} joined Bank El Hazz.`,
    },
  });

  return newPlayer;
}

export async function leaveBankRoom({
  roomCode,
  userId,
}: {
  roomCode: string;
  userId: string;
}) {
  const room = await prisma.bankRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: true },
  });

  if (!room) return;
  const player = room.players.find((p) => p.userId === userId);
  if (!player) return;

  if (room.players.length === 1) {
    await prisma.bankRoom.delete({ where: { id: room.id } });
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.bankRoomPlayer.delete({ where: { id: player.id } });

    if (player.isHost) {
      const nextHost = room.players.find((p) => p.id !== player.id);
      if (nextHost) {
        await tx.bankRoomPlayer.update({
          where: { id: nextHost.id },
          data: { isHost: true },
        });
      }
    }

    if (room.currentTurnPlayerId === player.id) {
      const remaining = room.players.filter((p) => p.id !== player.id && !p.isBankrupt);
      await tx.bankRoom.update({
        where: { id: room.id },
        data: {
          currentTurnPlayerId: remaining[0]?.id || null,
          currentPhase: "WAITING_FOR_ROLL",
        },
      });
    }
  });
}

export async function startBankGame({
  roomCode,
  hostUserId,
}: {
  roomCode: string;
  hostUserId: string;
}) {
  const room = await prisma.bankRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: { orderBy: { seatIndex: "asc" } } },
  });

  if (!room || room.status !== "WAITING") {
    throw new Error("Match cannot be started.");
  }
  if (room.createdById !== hostUserId) {
    throw new Error("Only the host can start the match.");
  }
  if (room.players.length < 2) {
    throw new Error("At least 2 players are required to start Bank El Hazz.");
  }

  const starter = room.players[0];

  await prisma.$transaction(async (tx) => {
    // Reset all players with fresh starting balance of 1500 EGP and position 0
    await tx.bankRoomPlayer.updateMany({
      where: { roomId: room.id },
      data: {
        money: 1500,
        position: 0,
        inJail: false,
        jailTurns: 0,
        jailFreeCards: 0,
        isBankrupt: false,
      },
    });

    await tx.bankRoom.update({
      where: { id: room.id },
      data: {
        status: "PLAYING",
        currentPhase: "WAITING_FOR_ROLL",
        currentTurnPlayerId: starter.id,
        propertiesStateJson: "{}",
        roundNumber: 1,
        startedAt: new Date(),
        dice1: null,
        dice2: null,
        doublesCount: 0,
        lastRollWasDoubles: false,
      },
    });

    await tx.bankRoomAction.create({
      data: {
        roomId: room.id,
        actorId: starter.id,
        type: "START",
        details: `Match started! Each player received 1500 EGP. It is ${starter.displayName}'s turn to roll the dice!`,
      },
    });
  });
}

export async function rollDiceBankAction({
  roomCode,
  actorUserId,
}: {
  roomCode: string;
  actorUserId: string;
}) {
  const room = await prisma.bankRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: true },
  });

  if (!room || room.status !== "PLAYING") throw new Error("Match not in progress.");

  const player = room.players.find((p) => p.userId === actorUserId);
  if (!player || player.id !== room.currentTurnPlayerId) {
    throw new Error("It is not your turn.");
  }

  if (room.currentPhase !== "WAITING_FOR_ROLL" && room.currentPhase !== "JAIL_DECISION") {
    throw new Error("Cannot roll dice in current phase.");
  }

  const d1 = crypto.randomInt(1, 7);
  const d2 = crypto.randomInt(1, 7);
  const totalRoll = d1 + d2;
  const isDoubles = d1 === d2;

  let properties: PropertiesStateMap = {};
  try {
    properties = JSON.parse(room.propertiesStateJson || "{}");
  } catch {
    properties = {};
  }

  // 1. IF PLAYER IS IN JAIL
  if (player.inJail) {
    if (isDoubles) {
      // Escaped with doubles!
      const newPos = (player.position + totalRoll) % 40;
      await prisma.$transaction(async (tx) => {
        await tx.bankRoomPlayer.update({
          where: { id: player.id },
          data: { inJail: false, jailTurns: 0, position: newPos },
        });

        await tx.bankRoom.update({
          where: { id: room.id },
          data: {
            dice1: d1,
            dice2: d2,
            lastRollWasDoubles: false,
            doublesCount: 0,
            currentPhase: "TURN_END",
          },
        });

        await tx.bankRoomAction.create({
          data: {
            roomId: room.id,
            actorId: player.id,
            type: "ROLL_DICE",
            details: `🎲 Rolled doubles [${d1}, ${d2}]! ${player.displayName} escaped from Jail and moved to ${BANK_TILES[newPos].nameAr}!`,
          },
        });
      });
      return;
    } else {
      // Failed to roll doubles in jail
      const nextJailTurns = player.jailTurns + 1;
      if (nextJailTurns >= 3) {
        // Must pay 50 and exit
        const fine = 50;
        const newMoney = Math.max(0, player.money - fine);
        const newPos = (player.position + totalRoll) % 40;

        await prisma.$transaction(async (tx) => {
          await tx.bankRoomPlayer.update({
            where: { id: player.id },
            data: {
              inJail: false,
              jailTurns: 0,
              money: newMoney,
              position: newPos,
            },
          });

          await tx.bankRoom.update({
            where: { id: room.id },
            data: {
              dice1: d1,
              dice2: d2,
              lastRollWasDoubles: false,
              doublesCount: 0,
              currentPhase: "TURN_END",
            },
          });

          await tx.bankRoomAction.create({
            data: {
              roomId: room.id,
              actorId: player.id,
              type: "PAY_JAIL_FINE",
              details: `⏰ ${player.displayName} served 3 turns in Jail, paid 50 EGP fine and advanced to ${BANK_TILES[newPos].nameAr}.`,
            },
          });
        });
        return;
      } else {
        await prisma.$transaction(async (tx) => {
          await tx.bankRoomPlayer.update({
            where: { id: player.id },
            data: { jailTurns: nextJailTurns },
          });

          await tx.bankRoom.update({
            where: { id: room.id },
            data: {
              dice1: d1,
              dice2: d2,
              lastRollWasDoubles: false,
              doublesCount: 0,
              currentPhase: "TURN_END",
            },
          });

          await tx.bankRoomAction.create({
            data: {
              roomId: room.id,
              actorId: player.id,
              type: "ROLL_DICE",
              details: `🎲 Rolled [${d1}, ${d2}] (No doubles). ${player.displayName} remains in Jail (${nextJailTurns}/3).`,
            },
          });
        });
        return;
      }
    }
  }

  // 2. REGULAR ROLL (NOT IN JAIL)
  const newDoublesCount = isDoubles ? room.doublesCount + 1 : 0;

  // 3 Consecutive doubles = Go to Jail!
  if (newDoublesCount === 3) {
    await prisma.$transaction(async (tx) => {
      await tx.bankRoomPlayer.update({
        where: { id: player.id },
        data: { position: 10, inJail: true, jailTurns: 0 },
      });

      await tx.bankRoom.update({
        where: { id: room.id },
        data: {
          dice1: d1,
          dice2: d2,
          doublesCount: 0,
          lastRollWasDoubles: false,
          currentPhase: "TURN_END",
        },
      });

      await tx.bankRoomAction.create({
        data: {
          roomId: room.id,
          actorId: player.id,
          type: "ROLL_DICE",
          details: `🚨 3 CONSECUTIVE DOUBLES! ${player.displayName} speeding violation, sent directly to Jail!`,
        },
      });
    });
    return;
  }

  // Calculate new tile position
  const currentPos = player.position;
  const newPos = (currentPos + totalRoll) % 40;
  const passedGo = newPos < currentPos || newPos === 0;
  const salaryMoney = passedGo ? 200 : 0;
  let updatedMoney = player.money + salaryMoney;

  const targetTile = BANK_TILES[newPos];
  let nextPhase: "TILE_ACTION" | "TURN_END" = "TURN_END";
  let actionDetails = `🎲 ${player.displayName} rolled [${d1}, ${d2}] (Total ${totalRoll}) and landed on [${targetTile.nameAr}]${targetTile.countryFlag}.`;
  if (passedGo) {
    actionDetails += ` 🟢 Passed GO (+200 EGP)!`;
  }

  // 3. LANDING TILE LOGIC
  if (newPos === 30) {
    // Tile 30: Go to Jail!
    await prisma.$transaction(async (tx) => {
      await tx.bankRoomPlayer.update({
        where: { id: player.id },
        data: {
          position: 10,
          inJail: true,
          jailTurns: 0,
          money: updatedMoney,
        },
      });

      await tx.bankRoom.update({
        where: { id: room.id },
        data: {
          dice1: d1,
          dice2: d2,
          doublesCount: 0,
          lastRollWasDoubles: false,
          currentPhase: "TURN_END",
        },
      });

      await tx.bankRoomAction.create({
        data: {
          roomId: room.id,
          actorId: player.id,
          type: "ROLL_DICE",
          details: `${actionDetails} 🚨 Landed on [اذهب إلى السجن], sent directly to Jail!`,
        },
      });
    });
    return;
  }

  if (targetTile.type === "TAX") {
    // Pay Income Tax or Luxury Tax
    const taxAmount = targetTile.price;
    updatedMoney = Math.max(0, updatedMoney - taxAmount);
    actionDetails += ` 💸 Paid ${taxAmount} EGP ${targetTile.nameAr}.`;
  } else if (targetTile.type === "CHANCE" || targetTile.type === "COMMUNITY") {
    // Draw Random Luck Card
    const randomCard = LUCK_CARDS[crypto.randomInt(0, LUCK_CARDS.length)];
    actionDetails += ` ❓ Drew Luck Card: [${randomCard.titleAr}] - ${randomCard.descAr}`;

    if (randomCard.action === "COLLECT_MONEY") {
      updatedMoney += randomCard.amount || 0;
    } else if (randomCard.action === "PAY_MONEY") {
      updatedMoney = Math.max(0, updatedMoney - (randomCard.amount || 0));
    } else if (randomCard.action === "GET_OUT_OF_JAIL") {
      await prisma.bankRoomPlayer.update({
        where: { id: player.id },
        data: { jailFreeCards: player.jailFreeCards + 1 },
      });
    } else if (randomCard.action === "GO_TO_JAIL") {
      await prisma.$transaction(async (tx) => {
        await tx.bankRoomPlayer.update({
          where: { id: player.id },
          data: { position: 10, inJail: true, jailTurns: 0, money: updatedMoney },
        });
        await tx.bankRoom.update({
          where: { id: room.id },
          data: {
            dice1: d1,
            dice2: d2,
            doublesCount: 0,
            lastRollWasDoubles: false,
            currentPhase: "TURN_END",
          },
        });
        await tx.bankRoomAction.create({
          data: {
            roomId: room.id,
            actorId: player.id,
            type: "DRAW_LUCK_CARD",
            details: actionDetails,
          },
        });
      });
      return;
    }
  } else if (
    targetTile.type === "PROPERTY" ||
    targetTile.type === "RAILROAD" ||
    targetTile.type === "UTILITY"
  ) {
    const propState = properties[newPos];
    if (!propState) {
      // Unowned property -> player can choose to BUY
      nextPhase = "TILE_ACTION";
      actionDetails += ` 🏷️ Available for purchase (${targetTile.price} EGP)!`;
    } else if (propState.ownerId !== player.id && !propState.isMortgaged) {
      // Owned by another player -> pay rent automatically!
      const rent = calculateRent(targetTile, propState, properties, propState.ownerId, totalRoll);
      const owner = room.players.find((p) => p.id === propState.ownerId);

      if (owner && !owner.isBankrupt && rent > 0) {
        const paidRent = Math.min(updatedMoney, rent);
        updatedMoney = Math.max(0, updatedMoney - paidRent);

        await prisma.bankRoomPlayer.update({
          where: { id: owner.id },
          data: { money: owner.money + paidRent },
        });

        actionDetails += ` 💰 Paid ${paidRent} EGP rent to ${owner.displayName}!`;
      }
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.bankRoomPlayer.update({
      where: { id: player.id },
      data: {
        position: newPos,
        money: updatedMoney,
      },
    });

    await tx.bankRoom.update({
      where: { id: room.id },
      data: {
        dice1: d1,
        dice2: d2,
        doublesCount: newDoublesCount,
        lastRollWasDoubles: isDoubles,
        currentPhase: nextPhase,
      },
    });

    await tx.bankRoomAction.create({
      data: {
        roomId: room.id,
        actorId: player.id,
        type: "ROLL_DICE",
        details: actionDetails,
      },
    });
  });
}

export async function buyPropertyBankAction({
  roomCode,
  actorUserId,
}: {
  roomCode: string;
  actorUserId: string;
}) {
  const room = await prisma.bankRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: true },
  });

  if (!room || room.status !== "PLAYING" || room.currentPhase !== "TILE_ACTION") {
    throw new Error("Cannot purchase property right now.");
  }

  const player = room.players.find((p) => p.userId === actorUserId);
  if (!player || player.id !== room.currentTurnPlayerId) {
    throw new Error("Not your turn.");
  }

  const tile = BANK_TILES[player.position];
  if (
    tile.type !== "PROPERTY" &&
    tile.type !== "RAILROAD" &&
    tile.type !== "UTILITY"
  ) {
    throw new Error("Tile cannot be purchased.");
  }

  let properties: PropertiesStateMap = {};
  try {
    properties = JSON.parse(room.propertiesStateJson || "{}");
  } catch {
    properties = {};
  }

  if (properties[player.position]) {
    throw new Error("Property already owned.");
  }

  if (player.money < tile.price) {
    throw new Error("Insufficient funds to buy property.");
  }

  properties[player.position] = {
    ownerId: player.id,
    houses: 0,
    isMortgaged: false,
  };

  const newMoney = player.money - tile.price;

  await prisma.$transaction(async (tx) => {
    await tx.bankRoomPlayer.update({
      where: { id: player.id },
      data: { money: newMoney },
    });

    await tx.bankRoom.update({
      where: { id: room.id },
      data: {
        propertiesStateJson: JSON.stringify(properties),
        currentPhase: "TURN_END",
      },
    });

    await tx.bankRoomAction.create({
      data: {
        roomId: room.id,
        actorId: player.id,
        type: "BUY_PROPERTY",
        details: `🏠 ${player.displayName} bought [${tile.nameAr}]${tile.countryFlag} for ${tile.price} EGP!`,
      },
    });
  });
}

export async function passPropertyBankAction({
  roomCode,
  actorUserId,
}: {
  roomCode: string;
  actorUserId: string;
}) {
  const room = await prisma.bankRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: true },
  });

  if (!room || room.status !== "PLAYING" || room.currentPhase !== "TILE_ACTION") {
    throw new Error("Cannot pass action right now.");
  }

  const player = room.players.find((p) => p.userId === actorUserId);
  if (!player || player.id !== room.currentTurnPlayerId) {
    throw new Error("Not your turn.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.bankRoom.update({
      where: { id: room.id },
      data: { currentPhase: "TURN_END" },
    });

    await tx.bankRoomAction.create({
      data: {
        roomId: room.id,
        actorId: player.id,
        type: "PASS_PROPERTY",
        details: `${player.displayName} decided not to buy [${BANK_TILES[player.position].nameAr}].`,
      },
    });
  });
}

export async function buildHouseBankAction({
  roomCode,
  actorUserId,
  tileIndex,
}: {
  roomCode: string;
  actorUserId: string;
  tileIndex: number;
}) {
  const room = await prisma.bankRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: true },
  });

  if (!room || room.status !== "PLAYING") throw new Error("Match not in progress.");

  const player = room.players.find((p) => p.userId === actorUserId);
  if (!player) throw new Error("Player not found.");

  const tile = BANK_TILES[tileIndex];
  if (!tile || tile.type !== "PROPERTY") throw new Error("Can only build on city properties.");

  let properties: PropertiesStateMap = {};
  try {
    properties = JSON.parse(room.propertiesStateJson || "{}");
  } catch {
    properties = {};
  }

  const propState = properties[tileIndex];
  if (!propState || propState.ownerId !== player.id) {
    throw new Error("You do not own this property.");
  }

  if (propState.houses >= 5) {
    throw new Error("Maximum buildings reached (Hotel already built).");
  }

  // Check full monopoly in color group
  const group = COLOR_GROUP_DETAILS[tile.colorGroup];
  const hasMonopoly = group.tileIndices.every((idx) => properties[idx]?.ownerId === player.id);
  if (!hasMonopoly) {
    throw new Error("Must own all cities in the country/group to build houses.");
  }

  if (player.money < tile.houseCost) {
    throw new Error("Insufficient funds to build.");
  }

  propState.houses += 1;
  const isHotel = propState.houses === 5;
  const newMoney = player.money - tile.houseCost;

  await prisma.$transaction(async (tx) => {
    await tx.bankRoomPlayer.update({
      where: { id: player.id },
      data: { money: newMoney },
    });

    await tx.bankRoom.update({
      where: { id: room.id },
      data: { propertiesStateJson: JSON.stringify(properties) },
    });

    await tx.bankRoomAction.create({
      data: {
        roomId: room.id,
        actorId: player.id,
        type: "BUILD_HOUSE",
        details: isHotel
          ? `🏨 ${player.displayName} built a HOTEL in [${tile.nameAr}]${tile.countryFlag} for ${tile.houseCost} EGP!`
          : `🏡 ${player.displayName} built House #${propState.houses} in [${tile.nameAr}]${tile.countryFlag} for ${tile.houseCost} EGP!`,
      },
    });
  });
}

export async function sellHouseBankAction({
  roomCode,
  actorUserId,
  tileIndex,
}: {
  roomCode: string;
  actorUserId: string;
  tileIndex: number;
}) {
  const room = await prisma.bankRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: true },
  });

  if (!room || room.status !== "PLAYING") throw new Error("Match not in progress.");

  const player = room.players.find((p) => p.userId === actorUserId);
  if (!player) throw new Error("Player not found.");

  const tile = BANK_TILES[tileIndex];
  if (!tile || tile.type !== "PROPERTY") throw new Error("Invalid tile.");

  let properties: PropertiesStateMap = {};
  try {
    properties = JSON.parse(room.propertiesStateJson || "{}");
  } catch {
    properties = {};
  }

  const propState = properties[tileIndex];
  if (!propState || propState.ownerId !== player.id || propState.houses <= 0) {
    throw new Error("No houses to sell on this property.");
  }

  propState.houses -= 1;
  const refund = Math.floor(tile.houseCost / 2);
  const newMoney = player.money + refund;

  await prisma.$transaction(async (tx) => {
    await tx.bankRoomPlayer.update({
      where: { id: player.id },
      data: { money: newMoney },
    });

    await tx.bankRoom.update({
      where: { id: room.id },
      data: { propertiesStateJson: JSON.stringify(properties) },
    });

    await tx.bankRoomAction.create({
      data: {
        roomId: room.id,
        actorId: player.id,
        type: "SELL_HOUSE",
        details: `🏚️ ${player.displayName} sold a building in [${tile.nameAr}] for ${refund} EGP.`,
      },
    });
  });
}

export async function mortgagePropertyBankAction({
  roomCode,
  actorUserId,
  tileIndex,
}: {
  roomCode: string;
  actorUserId: string;
  tileIndex: number;
}) {
  const room = await prisma.bankRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: true },
  });

  if (!room || room.status !== "PLAYING") throw new Error("Match not in progress.");

  const player = room.players.find((p) => p.userId === actorUserId);
  if (!player) throw new Error("Player not found.");

  const tile = BANK_TILES[tileIndex];
  if (!tile) throw new Error("Invalid tile.");

  let properties: PropertiesStateMap = {};
  try {
    properties = JSON.parse(room.propertiesStateJson || "{}");
  } catch {
    properties = {};
  }

  const propState = properties[tileIndex];
  if (!propState || propState.ownerId !== player.id || propState.isMortgaged) {
    throw new Error("Cannot mortgage this property.");
  }
  if (propState.houses > 0) {
    throw new Error("Must sell all houses before mortgaging.");
  }

  propState.isMortgaged = true;
  const mortgageValue = tile.mortgageValue;
  const newMoney = player.money + mortgageValue;

  await prisma.$transaction(async (tx) => {
    await tx.bankRoomPlayer.update({
      where: { id: player.id },
      data: { money: newMoney },
    });

    await tx.bankRoom.update({
      where: { id: room.id },
      data: { propertiesStateJson: JSON.stringify(properties) },
    });

    await tx.bankRoomAction.create({
      data: {
        roomId: room.id,
        actorId: player.id,
        type: "MORTGAGE_PROPERTY",
        details: `📜 ${player.displayName} mortgaged [${tile.nameAr}] to the bank for ${mortgageValue} EGP.`,
      },
    });
  });
}

export async function unmortgagePropertyBankAction({
  roomCode,
  actorUserId,
  tileIndex,
}: {
  roomCode: string;
  actorUserId: string;
  tileIndex: number;
}) {
  const room = await prisma.bankRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: true },
  });

  if (!room || room.status !== "PLAYING") throw new Error("Match not in progress.");

  const player = room.players.find((p) => p.userId === actorUserId);
  if (!player) throw new Error("Player not found.");

  const tile = BANK_TILES[tileIndex];
  if (!tile) throw new Error("Invalid tile.");

  let properties: PropertiesStateMap = {};
  try {
    properties = JSON.parse(room.propertiesStateJson || "{}");
  } catch {
    properties = {};
  }

  const propState = properties[tileIndex];
  if (!propState || propState.ownerId !== player.id || !propState.isMortgaged) {
    throw new Error("Property is not mortgaged.");
  }

  const cost = Math.floor(tile.mortgageValue * 1.1); // 10% bank interest
  if (player.money < cost) {
    throw new Error("Insufficient funds to unmortgage.");
  }

  propState.isMortgaged = false;
  const newMoney = player.money - cost;

  await prisma.$transaction(async (tx) => {
    await tx.bankRoomPlayer.update({
      where: { id: player.id },
      data: { money: newMoney },
    });

    await tx.bankRoom.update({
      where: { id: room.id },
      data: { propertiesStateJson: JSON.stringify(properties) },
    });

    await tx.bankRoomAction.create({
      data: {
        roomId: room.id,
        actorId: player.id,
        type: "UNMORTGAGE_PROPERTY",
        details: `🔓 ${player.displayName} unmortgaged [${tile.nameAr}] for ${cost} EGP.`,
      },
    });
  });
}

export async function payJailFineBankAction({
  roomCode,
  actorUserId,
}: {
  roomCode: string;
  actorUserId: string;
}) {
  const room = await prisma.bankRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: true },
  });

  if (!room || room.status !== "PLAYING") throw new Error("Match not in progress.");

  const player = room.players.find((p) => p.userId === actorUserId);
  if (!player || player.id !== room.currentTurnPlayerId || !player.inJail) {
    throw new Error("Cannot pay jail fine right now.");
  }

  const fine = 50;
  if (player.money < fine) throw new Error("Insufficient funds for fine.");

  await prisma.$transaction(async (tx) => {
    await tx.bankRoomPlayer.update({
      where: { id: player.id },
      data: {
        inJail: false,
        jailTurns: 0,
        money: player.money - fine,
      },
    });

    await tx.bankRoom.update({
      where: { id: room.id },
      data: { currentPhase: "WAITING_FOR_ROLL" },
    });

    await tx.bankRoomAction.create({
      data: {
        roomId: room.id,
        actorId: player.id,
        type: "PAY_JAIL_FINE",
        details: `💸 ${player.displayName} paid 50 EGP bail fine and was released from Jail!`,
      },
    });
  });
}

export async function useJailCardBankAction({
  roomCode,
  actorUserId,
}: {
  roomCode: string;
  actorUserId: string;
}) {
  const room = await prisma.bankRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: true },
  });

  if (!room || room.status !== "PLAYING") throw new Error("Match not in progress.");

  const player = room.players.find((p) => p.userId === actorUserId);
  if (!player || player.id !== room.currentTurnPlayerId || !player.inJail) {
    throw new Error("Cannot use jail card right now.");
  }

  if (player.jailFreeCards <= 0) throw new Error("You don't have a Get Out of Jail Free card.");

  await prisma.$transaction(async (tx) => {
    await tx.bankRoomPlayer.update({
      where: { id: player.id },
      data: {
        inJail: false,
        jailTurns: 0,
        jailFreeCards: player.jailFreeCards - 1,
      },
    });

    await tx.bankRoom.update({
      where: { id: room.id },
      data: { currentPhase: "WAITING_FOR_ROLL" },
    });

    await tx.bankRoomAction.create({
      data: {
        roomId: room.id,
        actorId: player.id,
        type: "USE_JAIL_CARD",
        details: `🎫 ${player.displayName} used a Get Out of Jail Free card and was released!`,
      },
    });
  });
}

export async function endTurnBankAction({
  roomCode,
  actorUserId,
}: {
  roomCode: string;
  actorUserId: string;
}) {
  const room = await prisma.bankRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: { orderBy: { seatIndex: "asc" } } },
  });

  if (!room || room.status !== "PLAYING") throw new Error("Match not in progress.");

  const player = room.players.find((p) => p.userId === actorUserId);
  if (!player || player.id !== room.currentTurnPlayerId) {
    throw new Error("Not your turn.");
  }

  // If player rolled doubles and didn't go to jail, they get another roll!
  if (room.lastRollWasDoubles && !player.inJail && room.doublesCount > 0 && room.doublesCount < 3) {
    await prisma.$transaction(async (tx) => {
      await tx.bankRoom.update({
        where: { id: room.id },
        data: { currentPhase: "WAITING_FOR_ROLL" },
      });

      await tx.bankRoomAction.create({
        data: {
          roomId: room.id,
          actorId: player.id,
          type: "END_TURN",
          details: `🎲 Doubles! ${player.displayName} gets an extra roll!`,
        },
      });
    });
    return;
  }

  // Otherwise, advance to next non-bankrupt player
  const activePlayers = room.players.filter((p) => !p.isBankrupt);
  if (activePlayers.length <= 1) {
    // Game over!
    const winner = activePlayers[0] || player;
    await prisma.$transaction(async (tx) => {
      await tx.bankRoom.update({
        where: { id: room.id },
        data: {
          status: "FINISHED",
          currentPhase: "FINISHED",
          winnerPlayerId: winner.id,
          finishedAt: new Date(),
        },
      });

      await tx.bankRoomAction.create({
        data: {
          roomId: room.id,
          actorId: winner.id,
          type: "END_TURN",
          details: `🏆 MATCH OVER! ${winner.displayName} is the Bank El Hazz Champion!`,
        },
      });
    });
    return;
  }

  const currentIdx = activePlayers.findIndex((p) => p.id === player.id);
  const nextPlayer = activePlayers[(currentIdx + 1) % activePlayers.length];

  await prisma.$transaction(async (tx) => {
    await tx.bankRoom.update({
      where: { id: room.id },
      data: {
        currentTurnPlayerId: nextPlayer.id,
        currentPhase: "WAITING_FOR_ROLL",
        doublesCount: 0,
        lastRollWasDoubles: false,
        dice1: null,
        dice2: null,
      },
    });

    await tx.bankRoomAction.create({
      data: {
        roomId: room.id,
        actorId: nextPlayer.id,
        type: "END_TURN",
        details: `Turn passed to ${nextPlayer.displayName}.`,
      },
    });
  });
}

export async function declareBankruptcyBankAction({
  roomCode,
  actorUserId,
}: {
  roomCode: string;
  actorUserId: string;
}) {
  const room = await prisma.bankRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: true },
  });

  if (!room || room.status !== "PLAYING") throw new Error("Match not in progress.");

  const player = room.players.find((p) => p.userId === actorUserId);
  if (!player) throw new Error("Player not found.");

  let properties: PropertiesStateMap = {};
  try {
    properties = JSON.parse(room.propertiesStateJson || "{}");
  } catch {
    properties = {};
  }

  // Release all properties owned by this player
  Object.keys(properties).forEach((k) => {
    const idx = Number(k);
    if (properties[idx]?.ownerId === player.id) {
      delete properties[idx];
    }
  });

  const remaining = room.players.filter((p) => p.id !== player.id && !p.isBankrupt);
  const isMatchOver = remaining.length <= 1;
  const winner = isMatchOver ? remaining[0] : null;

  await prisma.$transaction(async (tx) => {
    await tx.bankRoomPlayer.update({
      where: { id: player.id },
      data: { isBankrupt: true, money: 0 },
    });

    await tx.bankRoom.update({
      where: { id: room.id },
      data: {
        propertiesStateJson: JSON.stringify(properties),
        currentPhase: isMatchOver ? "FINISHED" : "WAITING_FOR_ROLL",
        status: isMatchOver ? "FINISHED" : "PLAYING",
        currentTurnPlayerId: isMatchOver ? null : remaining[0]?.id,
        winnerPlayerId: winner?.id || null,
        finishedAt: isMatchOver ? new Date() : null,
      },
    });

    await tx.bankRoomAction.create({
      data: {
        roomId: room.id,
        actorId: player.id,
        type: "DECLARE_BANKRUPTCY",
        details: `💀 ${player.displayName} went BANKRUPT! All properties liquidated.`,
      },
    });
  });
}

export async function replayBankGameAction({
  roomCode,
  hostUserId,
}: {
  roomCode: string;
  hostUserId: string;
}) {
  const room = await prisma.bankRoom.findUnique({
    where: { roomCode: roomCode.toUpperCase().trim() },
    include: { players: { orderBy: { seatIndex: "asc" } } },
  });

  if (!room || room.status !== "FINISHED") throw new Error("Match not finished.");
  if (room.createdById !== hostUserId) throw new Error("Only the host can restart match.");

  const starter = room.players[0];

  await prisma.$transaction(async (tx) => {
    await tx.bankRoomPlayer.updateMany({
      where: { roomId: room.id },
      data: {
        money: 1500,
        position: 0,
        inJail: false,
        jailTurns: 0,
        jailFreeCards: 0,
        isBankrupt: false,
      },
    });

    await tx.bankRoom.update({
      where: { id: room.id },
      data: {
        status: "PLAYING",
        currentPhase: "WAITING_FOR_ROLL",
        currentTurnPlayerId: starter.id,
        propertiesStateJson: "{}",
        roundNumber: room.roundNumber + 1,
        startedAt: new Date(),
        finishedAt: null,
        winnerPlayerId: null,
        doublesCount: 0,
        lastRollWasDoubles: false,
        dice1: null,
        dice2: null,
      },
    });

    await tx.bankRoomAction.create({
      data: {
        roomId: room.id,
        actorId: starter.id,
        type: "REPLAY",
        details: `New Bank El Hazz match started!`,
      },
    });
  });
}
