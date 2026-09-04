"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { GameTableShell } from "@/components/game-table-shell";
import {
  BANK_TILES,
  BoardTile,
  COLOR_GROUP_DETAILS,
  ColorGroup,
  GO_TO_JAIL_TILE_INDEX,
  JAIL_TILE_INDEX,
  PropertiesStateMap,
  START_TILE_INDEX,
} from "@/lib/games/bank-types";

type RoomPayload = {
  room: {
    id: string;
    roomCode: string;
    title: string;
    visibility: "PUBLIC" | "PRIVATE";
    status: "WAITING" | "PLAYING" | "FINISHED";
    currentPhase: "WAITING_FOR_ROLL" | "TILE_ACTION" | "JAIL_DECISION" | "TURN_END" | "FINISHED";
    currentTurnPlayerId: string | null;
    dice1: number | null;
    dice2: number | null;
    doublesCount: number;
    lastRollWasDoubles: boolean;
    winnerPlayerId: string | null;
    roundNumber: number;
    turnTimerSeconds: number;
    turnStartedAt: string | null;
    properties: PropertiesStateMap;
  };
  players: {
    id: string;
    userId: string;
    displayName: string;
    seatIndex: number;
    money: number;
    position: number;
    inJail: boolean;
    jailTurns: number;
    jailFreeCards: number;
    isBankrupt: boolean;
    isHost: boolean;
    avatar: string;
    color: string;
    isMyTurn: boolean;
    ownedTileIndices: number[];
  }[];
  selfPlayer: {
    id: string;
    userId: string;
    displayName: string;
    isHost: boolean;
    isMyTurn: boolean;
    money: number;
    position: number;
    inJail: boolean;
    isBankrupt: boolean;
    avatar: string;
    color: string;
    jailFreeCards: number;
  } | null;
  actions: {
    id: string;
    type: string;
    details: string | null;
    createdAt: string;
  }[];
};

type Dictionary = {
  lobby: string;
  roomTitle: string;
  waitingForPlayers: string;
  needMinPlayers: string;
  startGame: string;
  copyCode: string;
  copied: string;
  turn: string;
  yourTurn: string;
  rollDice: string;
  buyProperty: string;
  pass: string;
  endTurn: string;
  payJailFine: string;
  useJailCard: string;
  buildHouse: string;
  mortgage: string;
  unmortgage: string;
  declareBankruptcy: string;
  replay: string;
  cash: string;
  inJail: string;
  bankrupt: string;
  actionLog: string;
  owner: string;
  rent: string;
  price: string;
  winnerTitle: string;
  monopolyTitle: string;
  buildingsTitle: string;
  deedTitle: string;
  baseRent: string;
  oneHouse: string;
  twoHouses: string;
  threeHouses: string;
  fourHouses: string;
  hotel: string;
  mortgageVal: string;
  houseCost: string;
  unowned: string;
  monopolyDouble: string;
};

const DICTIONARY: Record<"en" | "ar", Dictionary> = {
  en: {
    lobby: "Back to Lobby",
    roomTitle: "Bank El Hazz",
    waitingForPlayers: "Waiting for players to join...",
    needMinPlayers: "Need at least 2 players to start.",
    startGame: "Start Match",
    copyCode: "Copy Room Code",
    copied: "Copied!",
    turn: "Turn",
    yourTurn: "It's your turn!",
    rollDice: "Roll Dice 🎲",
    buyProperty: "Buy Property",
    pass: "Pass",
    endTurn: "End Turn →",
    payJailFine: "Pay 50 EGP Fine",
    useJailCard: "Use Free Jail Card",
    buildHouse: "Manage Buildings 🏗️",
    mortgage: "Mortgage",
    unmortgage: "Unmortgage",
    declareBankruptcy: "Declare Bankruptcy 💀",
    replay: "Play Again 🔄",
    cash: "Cash",
    inJail: "In Jail",
    bankrupt: "Bankrupt",
    actionLog: "Live Board Action Log",
    owner: "Owner",
    rent: "Rent",
    price: "Price",
    winnerTitle: "Bank El Hazz Champion! 🏆",
    monopolyTitle: "Manage Properties & Buildings",
    buildingsTitle: "Houses & Hotel",
    deedTitle: "Title Deed Card",
    baseRent: "Base Rent",
    oneHouse: "With 1 House",
    twoHouses: "With 2 Houses",
    threeHouses: "With 3 Houses",
    fourHouses: "With 4 Houses",
    hotel: "With Hotel 🏨",
    mortgageVal: "Mortgage Value",
    houseCost: "Building Cost",
    unowned: "Unowned (Available to Buy)",
    monopolyDouble: "Double rent with complete monopoly",
  },
  ar: {
    lobby: "العودة للصالة",
    roomTitle: "بنك الحظ",
    waitingForPlayers: "في انتظار انضمام اللاعبين...",
    needMinPlayers: "يلزم وجود لاعبين على الأقل لبدء المباراة.",
    startGame: "ابدأ المباراة الآن",
    copyCode: "نسخ كود الغرفة",
    copied: "تم النسخ!",
    turn: "الدور",
    yourTurn: "دورك الآن!",
    rollDice: "ارمي النرد 🎲",
    buyProperty: "شراء العقار",
    pass: "تخطي",
    endTurn: "إنهاء الدور →",
    payJailFine: "دفع كفالة ٥٠ ج",
    useJailCard: "استخدام كارت العفو",
    buildHouse: "إدارة وتطوير العقارات 🏗️",
    mortgage: "رهن العقار",
    unmortgage: "فك الرهن",
    declareBankruptcy: "إعلان الإفلاس 💀",
    replay: "مباراة جديدة 🔄",
    cash: "الرصيد",
    inJail: "في السجن",
    bankrupt: "مفلس",
    actionLog: "سجل أحداث الطاولة المباشر",
    owner: "المالك",
    rent: "الإيجار",
    price: "السعر",
    winnerTitle: "بطل وملياردير بنك الحظ! 🏆",
    monopolyTitle: "إدارة العقارات والعمارات",
    buildingsTitle: "العمارات والفنادق",
    deedTitle: "سند ملكية بنك الحظ",
    baseRent: "الإيجار بدون مباني",
    oneHouse: "مع عمارة واحدة",
    twoHouses: "مع عمارتين",
    threeHouses: "مع ٣ عمارات",
    fourHouses: "مع ٤ عمارات",
    hotel: "مع فندق سياحي 🏨",
    mortgageVal: "قيمة الرهن للبنك",
    houseCost: "تكلفة بناء العمارة",
    unowned: "غير مملوك (متاح للشراء)",
    monopolyDouble: "يتضاعف الإيجار عند احتكار المجموعة بالكامل",
  },
};

// Web Audio API Sound Effects
function playBankSound(type: "dice" | "cash" | "build" | "jail" | "win") {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    if (type === "dice") {
      for (let i = 0; i < 4; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(140 + Math.random() * 80, now + i * 0.05);
        gain.gain.setValueAtTime(0.15, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.04);
      }
    } else if (type === "cash") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1600, now + 0.15);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === "build") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(440, now + 0.08);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === "jail") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.linearRampToValueAtTime(250, now + 0.3);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === "win") {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0.2, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.3);
      });
    }
  } catch {
    // Ignore audio error
  }
}

const DICE_UNICODE = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

// Grid coordinates for the 33 tiles on 11 cols x 8 rows
const TILE_GRID_POSITIONS: Record<number, { col: string; row: number }> = {
  // Left Edge (going up from Bottom-Left 0 to Top-Left 7)
  0: { col: "1", row: 8 }, // البداية (BL Corner)
  1: { col: "1", row: 7 }, // القدس
  2: { col: "1", row: 6 }, // غزة
  3: { col: "1", row: 5 }, // حظك
  4: { col: "1", row: 4 }, // بيروت
  5: { col: "1", row: 3 }, // الرياض
  6: { col: "1", row: 2 }, // بغداد
  7: { col: "1", row: 1 }, // نادي الصيد (TL Corner)
  // Top Edge (going right from TL to TR)
  8: { col: "2", row: 1 }, // بنغازي
  9: { col: "3", row: 1 }, // عمان
  10: { col: "4", row: 1 }, // محاكمة
  11: { col: "5", row: 1 }, // البحرين
  12: { col: "6", row: 1 }, // حظك
  13: { col: "7", row: 1 }, // محطة بنزين
  14: { col: "8", row: 1 }, // تونس
  15: { col: "9", row: 1 }, // الجزائر
  16: { col: "10 / span 2", row: 1 }, // الترامواي السريع (TR double-width corner)
  // Right Edge (going down from TR to BR)
  17: { col: "11", row: 2 }, // الإسكندرية
  18: { col: "11", row: 3 }, // حلب
  19: { col: "11", row: 4 }, // محاكمة
  20: { col: "11", row: 5 }, // أسوان
  21: { col: "11", row: 6 }, // دمشق
  22: { col: "11", row: 7 }, // القاهرة
  23: { col: "11", row: 8 }, // سجن القلعة (BR Corner)
  // Bottom Edge (going left from BR to BL)
  24: { col: "10", row: 8 }, // الخرطوم
  25: { col: "9", row: 8 }, // عُمان
  26: { col: "8", row: 8 }, // الأقصر
  27: { col: "7", row: 8 }, // بورسعيد
  28: { col: "6", row: 8 }, // حظك
  29: { col: "5", row: 8 }, // صنعاء
  30: { col: "4", row: 8 }, // محاكمة (إلى السجن!)
  31: { col: "3", row: 8 }, // الكويت
  32: { col: "2", row: 8 }, // قطر
};

export default function BankRoomClient({ roomCode }: { roomCode: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") === "ar" ? "ar" : "en";
  const t = DICTIONARY[lang];

  const [roomData, setRoomData] = useState<RoomPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [joinPassword, setJoinPassword] = useState("");
  const [joiningRoom, setJoiningRoom] = useState(false);
  const [hasAttemptedAutoJoin, setHasAttemptedAutoJoin] = useState(false);

  // Selected tile for Title Deed inspection
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null);

  // Building manager modal
  const [isBuildingModalOpen, setIsBuildingModalOpen] = useState(false);

  // Dice rolling visual animation state
  const [isRollingAnimation, setIsRollingAnimation] = useState(false);

  const links = useMemo(
    () => ({
      lobby: `/games/bank?lang=${lang}`,
      en: `/games/bank/${roomCode}?lang=en`,
      ar: `/games/bank/${roomCode}?lang=ar`,
    }),
    [lang, roomCode],
  );

  // Auto-action timer effect
  useEffect(() => {
    if (
      !roomData?.room ||
      roomData.room.status !== "PLAYING" ||
      !roomData.room.turnTimerSeconds ||
      roomData.room.turnTimerSeconds <= 0
    ) {
      setTimeLeft(null);
      return;
    }

    const timerLimit = roomData.room.turnTimerSeconds;
    const turnStarted = roomData.room.turnStartedAt
      ? new Date(roomData.room.turnStartedAt).getTime()
      : Date.now();

    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - turnStarted) / 1000);
      const remaining = Math.max(0, timerLimit - elapsed);
      setTimeLeft(remaining);

      if (remaining > 0 && remaining <= 5 && roomData.selfPlayer?.isMyTurn) {
        playBankSound("dice");
      }

      // Auto-action on timeout if it's player's turn
      if (remaining === 0 && roomData.selfPlayer?.isMyTurn && !busy) {
        if (
          roomData.room.currentPhase === "WAITING_FOR_ROLL" ||
          roomData.room.currentPhase === "JAIL_DECISION"
        ) {
          sendAction("ROLL_DICE");
        } else if (roomData.room.currentPhase === "TILE_ACTION") {
          sendAction("PASS_PROPERTY");
        } else if (roomData.room.currentPhase === "TURN_END") {
          sendAction("END_TURN");
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [
    roomData?.room.turnStartedAt,
    roomData?.room.turnTimerSeconds,
    roomData?.room.status,
    roomData?.room.currentPhase,
    roomData?.selfPlayer?.isMyTurn,
    busy,
  ]);

  const joinThisRoom = async (pwd?: string) => {
    if (joiningRoom) return;
    setJoiningRoom(true);
    setError(null);
    try {
      const res = await fetch(`/api/games/bank/rooms/${roomCode}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwd ?? (joinPassword.trim() || undefined) }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to join room.");
      }
      playBankSound("cash");
      await fetchRoom();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error joining room.");
    } finally {
      setJoiningRoom(false);
    }
  };

  const fetchRoom = async () => {
    try {
      const res = await fetch(`/api/games/bank/rooms/${roomCode}`);
      if (!res.ok) {
        if (res.status === 404) {
          router.push(links.lobby);
          return;
        }
        throw new Error("Failed to load table.");
      }
      const data: RoomPayload = await res.json();
      setRoomData(data);

      if (!hasAttemptedAutoJoin && !data.selfPlayer && data.room.status === "WAITING") {
        setHasAttemptedAutoJoin(true);
        if (data.room.visibility === "PUBLIC") {
          joinThisRoom();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoom();
    const interval = setInterval(fetchRoom, 2000);
    return () => clearInterval(interval);
  }, [roomCode]);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendAction = async (type: string, tileIndex?: number) => {
    if (busy) return;
    setBusy(true);
    setError(null);

    if (type === "ROLL_DICE") {
      setIsRollingAnimation(true);
      playBankSound("dice");
      setTimeout(() => setIsRollingAnimation(false), 600);
    } else if (type === "BUY_PROPERTY") {
      playBankSound("cash");
    } else if (type === "BUILD_HOUSE") {
      playBankSound("build");
    } else if (type === "PAY_JAIL_FINE" || type === "USE_JAIL_CARD") {
      playBankSound("cash");
    }

    try {
      const res = await fetch(`/api/games/bank/rooms/${roomCode}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, tileIndex }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Action failed.");
      }
      await fetchRoom();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  };

  const onStartMatch = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/games/bank/rooms/${roomCode}/start`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Cannot start match.");
      }
      playBankSound("cash");
      await fetchRoom();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Start failed.");
    } finally {
      setBusy(false);
    }
  };

  const onLeaveRoom = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await fetch(`/api/games/bank/rooms/${roomCode}/leave`, { method: "POST" });
    } catch {
      // Ignore
    } finally {
      router.push(links.lobby);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          <span className="text-sm font-bold text-zinc-400">
            {lang === "ar" ? "جاري تحميل طاولة بنك الحظ..." : "Loading Bank El Hazz table..."}
          </span>
        </div>
      </div>
    );
  }

  if (!roomData) {
    return (
      <div className="mx-auto max-w-md p-6 text-center space-y-4">
        <p className="text-sm text-red-500 font-bold">{error || "Room not found."}</p>
        <Link href={links.lobby} className="inline-block rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white">
          ← {t.lobby}
        </Link>
      </div>
    );
  }

  const { room, players, selfPlayer, actions } = roomData;
  const currentTurnPlayer = players.find((p) => p.id === room.currentTurnPlayerId);
  const isMyTurn = !!selfPlayer?.isMyTurn;
  const currentLandingTile = selfPlayer ? BANK_TILES[selfPlayer.position] : null;

  // Selected tile for title deed card modal
  const inspectedTile = selectedTileIndex !== null ? BANK_TILES[selectedTileIndex] : null;
  const inspectedProperty = selectedTileIndex !== null ? room.properties[selectedTileIndex] : null;
  const inspectedOwner = inspectedProperty ? players.find((p) => p.id === inspectedProperty.ownerId) : null;

  // Calculate self player net worth (cash + unimproved value + houses + mortgaged value)
  const selfNetWorth = selfPlayer
    ? selfPlayer.money +
      Object.entries(room.properties).reduce((acc, [tileIdx, prop]) => {
        if (prop.ownerId !== selfPlayer.id) return acc;
        const tile = BANK_TILES[Number(tileIdx)];
        if (!tile) return acc;
        if (prop.isMortgaged) return acc + tile.mortgageValue;
        return acc + tile.price + prop.houses * tile.houseCost;
      }, 0)
    : 0;

  const selfOwnedCount = selfPlayer
    ? Object.values(room.properties).filter((p) => p.ownerId === selfPlayer.id).length
    : 0;

  // Render pawns for a specific tile
  const renderTilePawns = (tileIndex: number) => {
    const playersHere = players.filter((p) => !p.isBankrupt && p.position === tileIndex);
    if (playersHere.length === 0) return null;

    return (
      <div className="absolute inset-0 flex items-center justify-center flex-wrap gap-0.5 pointer-events-none z-20 p-0.5">
        {playersHere.map((p) => (
          <span
            key={p.id}
            className="inline-flex items-center justify-center h-4 w-4 sm:h-5 sm:w-5 rounded-full text-[9px] sm:text-[11px] shadow-lg border border-white font-bold animate-in zoom-in-75 duration-200"
            style={{ backgroundColor: p.color }}
            title={`${p.displayName} (💰 ${p.money} ج)`}
          >
            {p.avatar}
          </span>
        ))}
      </div>
    );
  };

  // Render a single tile on the 11x8 perimeter
  const renderTile = (tile: BoardTile) => {
    const pos = TILE_GRID_POSITIONS[tile.index];
    if (!pos) return null;

    const prop = room.properties[tile.index];
    const owner = prop ? players.find((p) => p.id === prop.ownerId) : null;
    const group = COLOR_GROUP_DETAILS[tile.colorGroup];
    const isCorner = tile.type === "CORNER";
    const isSpecial = tile.type === "SPECIAL" || tile.type === "TAX" || tile.type === "CHANCE";

    return (
      <div
        key={tile.id}
        onClick={() => setSelectedTileIndex(tile.index)}
        style={{ gridColumn: pos.col, gridRow: pos.row }}
        className={`relative flex flex-col justify-between overflow-hidden rounded-md border border-amber-950/60 transition-all duration-150 cursor-pointer select-none hover:ring-2 hover:ring-amber-400/80 active:scale-95 ${
          isCorner
            ? "bg-gradient-to-br from-amber-950/90 to-zinc-950/90"
            : isSpecial
            ? "bg-zinc-900/90"
            : "bg-stone-900/90 hover:bg-stone-850/90"
        } ${prop?.isMortgaged ? "opacity-75" : ""}`}
      >
        {/* Color stripe on top */}
        {!isCorner && group && tile.colorGroup !== "SPECIAL" && (
          <div
            className="w-full h-1.5 sm:h-2 flex-shrink-0"
            style={{ backgroundColor: group.hex }}
          />
        )}

        {/* Tile Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-0.5 text-center min-w-0">
          {/* Tile Icon / Country Flag */}
          {tile.icon ? (
            <span className="text-xs sm:text-base leading-none drop-shadow">{tile.icon}</span>
          ) : tile.countryFlag ? (
            <span className="text-[10px] sm:text-xs leading-none">{tile.countryFlag}</span>
          ) : null}

          {/* City / Tile Name */}
          <span className="font-black text-[8px] sm:text-[10px] leading-tight text-white line-clamp-1 truncate w-full px-0.5">
            {lang === "ar" ? tile.nameAr : tile.nameEn}
          </span>

          {/* Price / Subtext */}
          {tile.price > 0 && (
            <span className="font-mono text-[7px] sm:text-[9px] font-bold text-amber-400 leading-none mt-0.5">
              {tile.price} ج
            </span>
          )}

          {/* Buildings Badge (Houses / Hotel) */}
          {prop && prop.houses > 0 && (
            <div className="absolute top-1 right-1 flex items-center gap-0.5 bg-black/80 px-1 rounded text-[8px] font-black text-amber-300">
              {prop.houses === 5 ? "🏨" : `🏡${prop.houses}`}
            </div>
          )}

          {/* Mortgaged Badge */}
          {prop?.isMortgaged && (
            <div className="absolute inset-0 bg-red-950/80 flex items-center justify-center text-[8px] font-bold text-red-300">
              مرهن 📜
            </div>
          )}
        </div>

        {/* Owner Indicator Bar */}
        {owner && (
          <div
            className="w-full h-1 sm:h-1.5 flex-shrink-0"
            style={{ backgroundColor: owner.color }}
            title={`المالك: ${owner.displayName}`}
          />
        )}

        {/* Player Pawns */}
        {renderTilePawns(tile.index)}
      </div>
    );
  };

  return (
    <GameTableShell
      theme="bank"
      isMyTurn={isMyTurn}
      lang={lang}
      lobbyHref={links.lobby}
      roomCode={roomCode}
      onLeave={onLeaveRoom}
      busy={busy}
      error={error}
      // Top Bar: Turn info & Player cash
      topBar={
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          {/* Turn Banner */}
          {room.status === "PLAYING" && currentTurnPlayer && (
            <div className="flex items-center gap-1.5 bg-black/40 border border-white/15 px-2.5 py-1 rounded-full text-xs font-bold min-w-0">
              <span className="text-zinc-400 text-[11px] hidden sm:inline">{t.turn}:</span>
              <span
                className="h-5 w-5 rounded-full flex items-center justify-center text-xs shadow"
                style={{ backgroundColor: currentTurnPlayer.color }}
              >
                {currentTurnPlayer.avatar}
              </span>
              <span className="text-white truncate max-w-[100px] sm:max-w-[140px]">
                {currentTurnPlayer.displayName}
              </span>

              {/* Turn Countdown Timer */}
              {room.turnTimerSeconds > 0 && (
                <span
                  className={`font-mono text-[11px] px-1.5 py-0.2 rounded font-black ${
                    timeLeft !== null && timeLeft <= 5
                      ? "bg-red-500/40 text-red-300 animate-pulse"
                      : "bg-white/10 text-amber-300"
                  }`}
                >
                  ⏱️{timeLeft !== null ? `${timeLeft}s` : `${room.turnTimerSeconds}s`}
                </span>
              )}
            </div>
          )}

          {/* Self Cash Badge */}
          {selfPlayer && (
            <div className="flex items-center gap-1 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-full text-xs font-black text-amber-300">
              <span>💰</span>
              <span>{selfPlayer.money} ج</span>
            </div>
          )}
        </div>
      }
      // Bottom Dock: Player Controls & Status
      dock={
        <div className="w-full flex flex-col items-center gap-2 max-w-3xl mx-auto px-2">
          {/* Main Action Buttons on Your Turn */}
          {room.status === "PLAYING" && isMyTurn ? (
            <div className="w-full flex flex-wrap items-center justify-center gap-2 animate-in fade-in">
              {/* Phase 1: WAITING FOR ROLL */}
              {room.currentPhase === "WAITING_FOR_ROLL" && (
                <>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => sendAction("ROLL_DICE")}
                    className="rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 px-6 sm:px-8 py-2.5 sm:py-3 text-xs sm:text-sm font-black text-black shadow-lg shadow-amber-500/30 hover:scale-105 active:scale-95 transition cursor-pointer disabled:opacity-50"
                  >
                    {busy ? "..." : t.rollDice}
                  </button>

                  {/* Jail options if currently locked in Citadel Prison */}
                  {selfPlayer?.inJail && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={busy || selfPlayer.money < 50}
                        onClick={() => sendAction("PAY_JAIL_FINE")}
                        className="rounded-xl bg-red-600/90 hover:bg-red-500 px-3 py-2 text-xs font-bold text-white transition disabled:opacity-50"
                      >
                        {t.payJailFine}
                      </button>
                      {selfPlayer.jailFreeCards > 0 && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => sendAction("USE_JAIL_CARD")}
                          className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-xs font-bold text-white transition"
                        >
                          {t.useJailCard} ({selfPlayer.jailFreeCards})
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Phase 2: TILE ACTION (Offer to Buy Property) */}
              {room.currentPhase === "TILE_ACTION" && currentLandingTile && (
                <div className="flex items-center gap-2 bg-amber-950/80 border border-amber-500/50 p-2 rounded-2xl">
                  <span className="text-xs font-bold text-white">
                    {currentLandingTile.countryFlag} {currentLandingTile.nameAr} ({currentLandingTile.price} ج)
                  </span>
                  <button
                    type="button"
                    disabled={busy || (selfPlayer ? selfPlayer.money < currentLandingTile.price : true)}
                    onClick={() => sendAction("BUY_PROPERTY")}
                    className="rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-2 text-xs font-black text-white hover:scale-105 transition disabled:opacity-50"
                  >
                    {t.buyProperty}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => sendAction("PASS_PROPERTY")}
                    className="rounded-xl bg-zinc-800 hover:bg-zinc-700 px-3 py-2 text-xs font-bold text-zinc-300 transition"
                  >
                    {t.pass}
                  </button>
                </div>
              )}

              {/* Phase 3: TURN END */}
              {room.currentPhase === "TURN_END" && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => sendAction("END_TURN")}
                  className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 sm:px-8 py-2.5 sm:py-3 text-xs sm:text-sm font-black text-white shadow-lg shadow-emerald-600/30 hover:scale-105 active:scale-95 transition cursor-pointer"
                >
                  {busy ? "..." : t.endTurn}
                </button>
              )}

              {/* Manage Buildings Button (Available anytime during player's turn) */}
              <button
                type="button"
                onClick={() => setIsBuildingModalOpen(true)}
                className="rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-3.5 py-2 text-xs font-bold text-white transition flex items-center gap-1.5"
              >
                <span>🏗️</span>
                <span className="hidden sm:inline">{t.buildHouse}</span>
              </button>
            </div>
          ) : room.status === "PLAYING" ? (
            /* Not My Turn Banner */
            <div className="text-xs font-semibold text-zinc-400 py-1 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-zinc-500 animate-pulse" />
              <span>في انتظار دور اللاعب الحالي ({currentTurnPlayer?.displayName || "..."})</span>
              <button
                type="button"
                onClick={() => setIsBuildingModalOpen(true)}
                className="ml-2 text-[11px] font-bold text-amber-400 underline cursor-pointer"
              >
                تصفح أملاكك 🏗️
              </button>
            </div>
          ) : null}

          {/* Financial Status Summary Strip */}
          {selfPlayer && (
            <div className="flex items-center justify-between w-full text-[11px] font-bold text-zinc-300 border-t border-white/10 pt-1.5">
              <div className="flex items-center gap-3">
                <span>💰 الكاش: {selfPlayer.money} ج</span>
                <span>🏠 العقارات: {selfOwnedCount}</span>
                <span className="hidden sm:inline">💵 الثروة: {selfNetWorth} ج</span>
              </div>
              {selfPlayer.inJail && (
                <span className="bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 rounded-full text-[10px] font-black">
                  ⛓️ في سجن القلعة
                </span>
              )}
            </div>
          )}
        </div>
      }
      // Slide-out Drawer Content: Scoreboard, Actions Log, Language
      drawerContent={
        <div className="space-y-4 text-white">
          {/* Players Scoreboard */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">
              👥 اللاعبون والأرصدة
            </h4>
            <div className="space-y-1.5">
              {players.map((p) => {
                const isCurrent = p.id === room.currentTurnPlayerId;
                const ownedProps = Object.entries(room.properties)
                  .filter(([, prop]) => prop.ownerId === p.id)
                  .map(([idx]) => BANK_TILES[Number(idx)])
                  .filter(Boolean);

                return (
                  <div
                    key={p.id}
                    className={`p-2 rounded-xl border transition ${
                      isCurrent
                        ? "border-amber-500/60 bg-amber-500/10"
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-6 w-6 rounded-full flex items-center justify-center text-xs shadow border border-white"
                          style={{ backgroundColor: p.color }}
                        >
                          {p.avatar}
                        </span>
                        <div>
                          <span className="text-xs font-bold block">{p.displayName}</span>
                          <span className="text-[10px] font-mono text-zinc-400">
                            {p.isBankrupt ? "💀 مفلس" : p.inJail ? "⛓️ بالسجن" : "طليق"}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-black text-amber-300">
                        {p.money} ج
                      </span>
                    </div>

                    {/* Owned properties mini pills */}
                    {ownedProps.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5 pt-1.5 border-t border-white/5">
                        {ownedProps.map((tile) => {
                          const grp = COLOR_GROUP_DETAILS[tile.colorGroup];
                          return (
                            <span
                              key={tile.id}
                              onClick={() => setSelectedTileIndex(tile.index)}
                              className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white cursor-pointer hover:opacity-80"
                              style={{ backgroundColor: grp?.hex || "#444" }}
                              title={`${tile.nameAr} - ${tile.price} ج`}
                            >
                              {tile.nameAr}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Action Event Log */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">
              📜 {t.actionLog}
            </h4>
            <div className="space-y-1 max-h-56 overflow-y-auto no-scrollbar rounded-xl bg-black/40 p-2 border border-white/10 text-[11px]">
              {actions.map((act) => (
                <div key={act.id} className="p-1 rounded bg-white/5 text-zinc-300 leading-tight">
                  <span>{act.details || act.type}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Language Switch */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-bold">
            <span className="text-zinc-400">اللغة / Language</span>
            <div className="flex gap-2">
              <Link
                href={links.ar}
                className={`px-2.5 py-1 rounded-lg ${
                  lang === "ar" ? "bg-amber-500 text-black font-black" : "text-zinc-400 hover:text-white"
                }`}
              >
                العربية
              </Link>
              <Link
                href={links.en}
                className={`px-2.5 py-1 rounded-lg ${
                  lang === "en" ? "bg-amber-500 text-black font-black" : "text-zinc-400 hover:text-white"
                }`}
              >
                English
              </Link>
            </div>
          </div>
        </div>
      }
      // Floating Modals: Title Deed Modal & Buildings Management Modal
      modals={
        <>
          {/* TITLE DEED INSPECTION MODAL */}
          {inspectedTile && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in"
              onClick={() => setSelectedTileIndex(null)}
            >
              <div
                className="w-full max-w-sm rounded-3xl border-2 border-amber-500/40 bg-zinc-950 p-5 shadow-2xl space-y-4 text-white animate-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Deed Header Card */}
                <div
                  className="rounded-2xl p-4 text-center space-y-1 shadow-lg border border-white/20"
                  style={{
                    backgroundColor:
                      COLOR_GROUP_DETAILS[inspectedTile.colorGroup]?.hex || "#222",
                  }}
                >
                  <span className="text-[10px] uppercase tracking-widest text-white/80 font-bold block">
                    {t.deedTitle}
                  </span>
                  <h3 className="text-xl font-black text-white flex items-center justify-center gap-2">
                    <span>{inspectedTile.countryFlag}</span>
                    <span>{inspectedTile.nameAr}</span>
                  </h3>
                  {inspectedTile.price > 0 && (
                    <span className="text-xs font-bold text-white/90 font-mono block">
                      سعر الشراء: {inspectedTile.price} جنيه
                    </span>
                  )}
                </div>

                {/* Rent Tiers Table */}
                {inspectedTile.type === "PROPERTY" ? (
                  <div className="space-y-1.5 text-xs bg-black/40 p-3 rounded-2xl border border-white/10">
                    <div className="flex justify-between py-0.5 border-b border-white/10 font-bold">
                      <span className="text-zinc-400">{t.baseRent}</span>
                      <span className="font-mono text-amber-300">{inspectedTile.baseRent} ج</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-white/10">
                      <span className="text-zinc-400">{t.oneHouse}</span>
                      <span className="font-mono text-amber-300">{inspectedTile.rentTiers[1]} ج</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-white/10">
                      <span className="text-zinc-400">{t.twoHouses}</span>
                      <span className="font-mono text-amber-300">{inspectedTile.rentTiers[2]} ج</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-white/10">
                      <span className="text-zinc-400">{t.threeHouses}</span>
                      <span className="font-mono text-amber-300">{inspectedTile.rentTiers[3]} ج</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-white/10">
                      <span className="text-zinc-400">{t.fourHouses}</span>
                      <span className="font-mono text-amber-300">{inspectedTile.rentTiers[4]} ج</span>
                    </div>
                    <div className="flex justify-between py-0.5 font-bold">
                      <span className="text-emerald-400">{t.hotel}</span>
                      <span className="font-mono text-emerald-300">{inspectedTile.rentTiers[5]} ج</span>
                    </div>

                    <div className="pt-2 border-t border-white/10 text-[10px] text-zinc-400 space-y-0.5">
                      <p>• {t.monopolyDouble}</p>
                      <p>• {t.houseCost}: {inspectedTile.houseCost} جنيه</p>
                      <p>• {t.mortgageVal}: {inspectedTile.mortgageValue} جنيه</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs bg-black/40 p-3 rounded-2xl border border-white/10 text-center text-zinc-300">
                    {inspectedTile.type === "UTILITY"
                      ? "إيجار محطة البنزين: ٤ أضعاف ناتج رمي النرد (أو ١٠ أضعاف عند امتلاك كل المرافق)."
                      : "محطة خاصة على لوحة بنك الحظ."}
                  </div>
                )}

                {/* Owner Status */}
                <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-zinc-400">{t.owner}:</span>
                  {inspectedOwner ? (
                    <span
                      className="font-bold px-2 py-0.5 rounded text-white flex items-center gap-1.5"
                      style={{ backgroundColor: inspectedOwner.color }}
                    >
                      <span>{inspectedOwner.avatar}</span>
                      <span>{inspectedOwner.displayName}</span>
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-bold">{t.unowned}</span>
                  )}
                </div>

                {/* Quick Owner Actions if current player owns this property */}
                {selfPlayer && inspectedProperty?.ownerId === selfPlayer.id && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {inspectedProperty.houses < 5 && (
                      <button
                        type="button"
                        disabled={busy || selfPlayer.money < inspectedTile.houseCost}
                        onClick={() => sendAction("BUILD_HOUSE", inspectedTile.index)}
                        className="rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2 text-xs font-bold text-white transition disabled:opacity-50"
                      >
                        + بناء عمارة ({inspectedTile.houseCost} ج)
                      </button>
                    )}
                    {inspectedProperty.houses > 0 && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => sendAction("SELL_HOUSE", inspectedTile.index)}
                        className="rounded-xl bg-red-600/80 hover:bg-red-500 py-2 text-xs font-bold text-white transition"
                      >
                        - بيع عمارة
                      </button>
                    )}
                    {!inspectedProperty.isMortgaged && inspectedProperty.houses === 0 && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => sendAction("MORTGAGE_PROPERTY", inspectedTile.index)}
                        className="rounded-xl bg-amber-600/80 hover:bg-amber-500 py-2 text-xs font-bold text-white transition"
                      >
                        📜 {t.mortgage} (+{inspectedTile.mortgageValue} ج)
                      </button>
                    )}
                    {inspectedProperty.isMortgaged && (
                      <button
                        type="button"
                        disabled={busy || selfPlayer.money < Math.floor(inspectedTile.mortgageValue * 1.1)}
                        onClick={() => sendAction("UNMORTGAGE_PROPERTY", inspectedTile.index)}
                        className="rounded-xl bg-sky-600 hover:bg-sky-500 py-2 text-xs font-bold text-white transition disabled:opacity-50"
                      >
                        🔓 {t.unmortgage} ({Math.floor(inspectedTile.mortgageValue * 1.1)} ج)
                      </button>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedTileIndex(null)}
                  className="w-full rounded-xl bg-white/10 hover:bg-white/20 py-2 text-xs font-bold text-white transition"
                >
                  إغلاق
                </button>
              </div>
            </div>
          )}

          {/* BUILDINGS & MONOPOLY MANAGEMENT MODAL */}
          {isBuildingModalOpen && selfPlayer && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in"
              onClick={() => setIsBuildingModalOpen(false)}
            >
              <div
                className="w-full max-w-lg rounded-3xl border border-white/20 bg-zinc-950 p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar text-white"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-base font-black flex items-center gap-2 text-amber-400">
                    <span>🏗️</span>
                    <span>{t.monopolyTitle}</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsBuildingModalOpen(false)}
                    className="text-zinc-400 hover:text-white text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  قم ببناء العمارات (حتى ٤ عمارات) وفندق سياحي على المدن التي تمتلك احتكار دولتها بالكامل لمضاعفة الأرباح والإيجارات!
                </p>

                <div className="space-y-3">
                  {Object.entries(COLOR_GROUP_DETAILS)
                    .filter(([grp]) => grp !== "SPECIAL" && grp !== "TRANSPORT" && grp !== "UTILITY")
                    .map(([grpKey, grpInfo]) => {
                      const myTilesInGrp = grpInfo.tileIndices.filter(
                        (idx) => room.properties[idx]?.ownerId === selfPlayer.id,
                      );
                      const hasMonopoly = myTilesInGrp.length === grpInfo.tileIndices.length;

                      return (
                        <div
                          key={grpKey}
                          className="rounded-2xl border border-white/10 bg-black/40 p-3 space-y-2"
                          style={{ borderRightColor: grpInfo.hex, borderRightWidth: "4px" }}
                        >
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span style={{ color: grpInfo.lightHex }}>{grpInfo.nameAr}</span>
                            <span className="text-[10px] text-zinc-400 font-mono">
                              {myTilesInGrp.length}/{grpInfo.tileIndices.length} مملوكة
                            </span>
                          </div>

                          {grpInfo.tileIndices.map((tileIdx) => {
                            const tile = BANK_TILES[tileIdx];
                            const prop = room.properties[tileIdx];
                            const isMine = prop?.ownerId === selfPlayer.id;

                            if (!isMine) return null;

                            return (
                              <div
                                key={tile.id}
                                className="flex items-center justify-between rounded-xl bg-zinc-900/80 px-3 py-2 text-xs"
                              >
                                <div>
                                  <span className="font-bold text-white block">
                                    {tile.countryFlag} {tile.nameAr}
                                  </span>
                                  <span className="text-[10px] text-zinc-400 font-mono">
                                    المباني: {prop.houses === 5 ? "🏨 فندق" : `${prop.houses} عمارات`} • تكلفة البناء: {tile.houseCost} ج
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  {hasMonopoly && prop.houses < 5 && (
                                    <button
                                      type="button"
                                      disabled={busy || selfPlayer.money < tile.houseCost}
                                      onClick={() => sendAction("BUILD_HOUSE", tileIdx)}
                                      className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-500 transition disabled:opacity-40"
                                    >
                                      + بناء ({tile.houseCost} ج)
                                    </button>
                                  )}
                                  {prop.houses > 0 && (
                                    <button
                                      type="button"
                                      disabled={busy}
                                      onClick={() => sendAction("SELL_HOUSE", tileIdx)}
                                      className="rounded-lg bg-red-600/80 px-2 py-1 text-[11px] font-bold text-white hover:bg-red-500 transition"
                                    >
                                      - بيع
                                    </button>
                                  )}
                                  {prop.houses === 0 && !prop.isMortgaged && (
                                    <button
                                      type="button"
                                      disabled={busy}
                                      onClick={() => sendAction("MORTGAGE_PROPERTY", tileIdx)}
                                      className="rounded-lg bg-amber-600/80 px-2 py-1 text-[11px] font-bold text-white hover:bg-amber-500 transition"
                                    >
                                      رهن (+{tile.mortgageValue} ج)
                                    </button>
                                  )}
                                  {prop.isMortgaged && (
                                    <button
                                      type="button"
                                      disabled={busy || selfPlayer.money < Math.floor(tile.mortgageValue * 1.1)}
                                      onClick={() => sendAction("UNMORTGAGE_PROPERTY", tileIdx)}
                                      className="rounded-lg bg-sky-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-sky-500 transition"
                                    >
                                      فك الرهن
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}
        </>
      }
    >
      {/* CENTER ARENA: BANK EL HAZZ 11x8 BOARD */}
      {room.status === "WAITING" ? (
        /* Waiting Room in Arena */
        <div className="w-full max-w-lg rounded-3xl border border-white/15 bg-zinc-950/90 p-6 text-center space-y-6 shadow-2xl backdrop-blur-md">
          <div className="space-y-2">
            <span className="text-5xl drop-shadow">🎲</span>
            <h2 className="text-xl font-black text-white">{t.waitingForPlayers}</h2>
            <p className="text-xs text-zinc-400">
              {players.length < 2 ? t.needMinPlayers : `(${players.length}/6) لاعبين جاهزين للطاولة!`}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {players.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2"
              >
                <span
                  className="h-7 w-7 rounded-full flex items-center justify-center text-sm shadow border border-white"
                  style={{ backgroundColor: p.color }}
                >
                  {p.avatar}
                </span>
                <span className="font-bold text-xs text-white">{p.displayName}</span>
                {p.isHost && (
                  <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
                    Host
                  </span>
                )}
              </div>
            ))}
          </div>

          {!selfPlayer && (
            <div className="space-y-3 pt-2">
              {room.visibility === "PRIVATE" && (
                <input
                  type="password"
                  placeholder={lang === "ar" ? "كلمة سر الطاولة" : "Table password"}
                  value={joinPassword}
                  onChange={(e) => setJoinPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/20 bg-zinc-800 px-4 py-2 text-xs text-white placeholder-zinc-500"
                />
              )}
              <button
                type="button"
                disabled={joiningRoom}
                onClick={() => joinThisRoom()}
                className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 px-6 py-3 text-sm font-black text-black shadow-lg hover:scale-105 transition cursor-pointer"
              >
                {joiningRoom ? "..." : lang === "ar" ? "انضم للطاولة 🎲" : "Join Table 🎲"}
              </button>
            </div>
          )}

          {selfPlayer?.isHost && (
            <button
              type="button"
              disabled={busy || players.length < 2}
              onClick={onStartMatch}
              className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-3 text-sm font-black text-white shadow-xl hover:scale-105 transition disabled:opacity-50 cursor-pointer"
            >
              {busy ? "..." : t.startGame}
            </button>
          )}
        </div>
      ) : (
        /* PLAYING STATE: 11x8 BOARD */
        <div className="w-full h-full max-w-[1020px] max-h-[720px] aspect-[11/8] mx-auto p-1 sm:p-2 flex items-center justify-center">
          <div className="w-full h-full grid grid-cols-11 grid-rows-8 gap-0.5 sm:gap-1 bg-[#03150c] border-2 sm:border-4 border-amber-600/40 rounded-2xl p-1 shadow-2xl relative select-none">
            {/* 33 PERIMETER TILES */}
            {BANK_TILES.map((tile) => renderTile(tile))}

            {/* CENTER HUB (Cols 2 to 10, Rows 2 to 7) */}
            <div
              style={{ gridColumn: "2 / span 9", gridRow: "2 / span 6" }}
              className="relative rounded-xl bg-gradient-to-br from-[#062014] via-[#04160d] to-[#020d07] border border-amber-500/20 p-2 sm:p-4 flex flex-col justify-between items-center text-center shadow-inner overflow-hidden"
            >
              {/* Retro Gold Star Bank Center Illustration & Logo */}
              <div className="flex-1 flex flex-col items-center justify-center z-10 space-y-1">
                <div className="text-3xl sm:text-5xl font-black text-red-600 drop-shadow-[0_4px_12px_rgba(220,38,38,0.5)] tracking-wide select-none font-serif">
                  بنك الحظ
                </div>
                <div className="text-[10px] sm:text-xs font-bold text-sky-400 tracking-widest font-mono select-none">
                  جولد ستار • GOLD STAR
                </div>
              </div>

              {/* 3D Dice Center Display */}
              <div className="z-10 py-1 flex items-center gap-3 sm:gap-4">
                <div
                  className={`h-11 w-11 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-white to-zinc-200 text-zinc-950 text-3xl sm:text-4xl font-mono font-black flex items-center justify-center shadow-2xl border border-zinc-400 ${
                    isRollingAnimation ? "animate-spin" : ""
                  }`}
                >
                  {room.dice1 ? DICE_UNICODE[room.dice1] : "🎲"}
                </div>
                <div
                  className={`h-11 w-11 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-white to-zinc-200 text-zinc-950 text-3xl sm:text-4xl font-mono font-black flex items-center justify-center shadow-2xl border border-zinc-400 ${
                    isRollingAnimation ? "animate-spin" : ""
                  }`}
                >
                  {room.dice2 ? DICE_UNICODE[room.dice2] : "🎲"}
                </div>
              </div>

              {/* Latest Action Ticker */}
              <div className="w-full z-10 text-[10px] sm:text-xs text-zinc-300 font-medium truncate px-2 py-1 bg-black/40 rounded-full border border-white/10">
                {actions[0]?.details || "طاولة بنك الحظ جارية..."}
              </div>
            </div>
          </div>
        </div>
      )}
    </GameTableShell>
  );
}
