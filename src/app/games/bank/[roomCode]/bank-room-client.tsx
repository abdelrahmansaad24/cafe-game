"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { MobileTableRotation } from "@/components/mobile-table-rotation";
import {
  BANK_TILES,
  BoardTile,
  COLOR_GROUP_DETAILS,
  ColorGroup,
  PropertiesStateMap,
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
    winnerTitle: "Bank El Hazz Tycoon Champion! 🏆",
    monopolyTitle: "Manage Properties & Buildings",
    buildingsTitle: "Houses & Hotel",
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
    buildHouse: "بناء وتطوير العقارات 🏗️",
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
    winnerTitle: "بطل ومليارادير بنك الحظ! 🏆",
    monopolyTitle: "إدارة العقارات والعمارات",
    buildingsTitle: "العمارات والفنادق",
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
        osc.frequency.setValueAtTime(140 + Math.random() * 200, now + i * 0.05);
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
      osc.type = "triangle";
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

  // Mobile screen rotation state
  const [isTableRotated, setIsTableRotated] = useState(false);

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

  // Tab close & leave beacon detection
  useEffect(() => {
    const handleTabClose = () => {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(`/api/games/bank/rooms/${roomCode}/leave`);
      } else {
        fetch(`/api/games/bank/rooms/${roomCode}/leave`, {
          method: "POST",
          keepalive: true,
        }).catch(() => undefined);
      }
    };

    window.addEventListener("pagehide", handleTabClose);
    window.addEventListener("beforeunload", handleTabClose);

    return () => {
      window.removeEventListener("pagehide", handleTabClose);
      window.removeEventListener("beforeunload", handleTabClose);
    };
  }, [roomCode]);

  useEffect(() => {
    let running = true;

    const load = async () => {
      const response = await fetch(`/api/games/bank/rooms/${roomCode}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as RoomPayload & { error?: string };
      if (!running) return;

      if (!response.ok || !data.room) {
        setError(data.error ?? "Could not load table.");
      } else {
        setRoomData(data);
        setError(null);
      }
      setLoading(false);
    };

    load().catch((err) => {
      if (running) {
        setError(err instanceof Error ? err.message : "Could not load table.");
        setLoading(false);
      }
    });

    const interval = setInterval(() => {
      load().catch(() => undefined);
    }, 1500);

    return () => {
      running = false;
      clearInterval(interval);
    };
  }, [roomCode]);

  const onLeaveRoom = async () => {
    if (confirm(lang === "ar" ? "هل أنت متأكد من مغادرة الطاولة؟" : "Leave this table?")) {
      await fetch(`/api/games/bank/rooms/${roomCode}/leave`, { method: "POST" }).catch(() => undefined);
      router.push(links.lobby);
    }
  };

  const sendAction = async (type: string, tileIndex?: number) => {
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      if (type === "ROLL_DICE") {
        playBankSound("dice");
        setIsRollingAnimation(true);
        setTimeout(() => setIsRollingAnimation(false), 600);
      } else if (type === "BUY_PROPERTY") {
        playBankSound("cash");
      } else if (type === "BUILD_HOUSE") {
        playBankSound("build");
      }

      const response = await fetch(`/api/games/bank/rooms/${roomCode}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, tileIndex }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Action failed.");
      }

      // Refresh state immediately
      const refreshed = await fetch(`/api/games/bank/rooms/${roomCode}`, { cache: "no-store" });
      if (refreshed.ok) {
        const newData = await refreshed.json();
        setRoomData(newData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  };

  const onStartMatch = async () => {
    setBusy(true);
    try {
      const response = await fetch(`/api/games/bank/rooms/${roomCode}/start`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to start match.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start match.");
    } finally {
      setBusy(false);
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-600 border-t-transparent" />
      </div>
    );
  }

  if (!roomData) {
    return (
      <div className="mx-auto max-w-lg p-6 text-center space-y-4">
        <p className="text-red-600 font-bold">{error || "Could not load room."}</p>
        <Link href={links.lobby} className="inline-block rounded-xl bg-amber-600 px-4 py-2 text-white text-xs font-bold">
          {t.lobby}
        </Link>
      </div>
    );
  }

  const { room, players, selfPlayer, actions } = roomData;
  const currentTurnPlayer = players.find((p) => p.id === room.currentTurnPlayerId);
  const isMyTurn = Boolean(selfPlayer?.isMyTurn);
  const currentLandedTile = selfPlayer ? BANK_TILES[selfPlayer.position] : null;
  const currentTileState = selfPlayer ? room.properties[selfPlayer.position] : undefined;

  // Build tile layout mapping (Perimeter 40 tiles):
  // Bottom: 0 to 10 (Right to Left in RTL or visual)
  // Left: 10 to 20 (Bottom to Top)
  // Top: 20 to 30 (Left to Right)
  // Right: 30 to 39 (Top to Bottom)
  const bottomTiles = BANK_TILES.slice(0, 11);
  const leftTiles = BANK_TILES.slice(11, 20);
  const topTiles = BANK_TILES.slice(20, 31);
  const rightTiles = BANK_TILES.slice(31, 40);

  // Helper to render players currently on a tile
  const renderTilePawns = (tileIndex: number) => {
    const occupants = players.filter((p) => p.position === tileIndex && !p.isBankrupt);
    if (occupants.length === 0) return null;

    return (
      <div className="flex flex-wrap items-center justify-center gap-1 z-20">
        {occupants.map((occ) => (
          <span
            key={occ.id}
            title={occ.displayName}
            className="inline-flex items-center justify-center h-5 w-5 sm:h-6 sm:w-6 rounded-full text-xs sm:text-sm shadow-md border-2 border-white ring-1 ring-black/40 animate-bounce"
            style={{ backgroundColor: occ.color }}
          >
            {occ.avatar}
          </span>
        ))}
      </div>
    );
  };

  // Helper to render tile view
  const renderTile = (tile: BoardTile, orientation: "bottom" | "top" | "left" | "right") => {
    const prop = room.properties[tile.index];
    const owner = prop ? players.find((p) => p.id === prop.ownerId) : null;
    const colorDetails = COLOR_GROUP_DETAILS[tile.colorGroup];

    return (
      <div
        key={tile.id}
        className={`relative flex flex-col justify-between border border-zinc-300/80 dark:border-zinc-700/80 bg-white/95 dark:bg-zinc-900/95 p-1 sm:p-1.5 transition select-none ${
          tile.type === "CORNER"
            ? "col-span-1 row-span-1 bg-amber-50 dark:bg-amber-950/40"
            : ""
        }`}
        style={{
          borderTopColor: orientation === "bottom" && colorDetails ? colorDetails.hex : undefined,
          borderBottomColor: orientation === "top" && colorDetails ? colorDetails.hex : undefined,
          borderRightColor: orientation === "left" && colorDetails ? colorDetails.hex : undefined,
          borderLeftColor: orientation === "right" && colorDetails ? colorDetails.hex : undefined,
          borderWidth: colorDetails && tile.type === "PROPERTY" ? "3px" : "1px",
        }}
      >
        {/* Buildings indicators */}
        {prop && prop.houses > 0 && (
          <div className="absolute top-0.5 inset-x-0 flex justify-center gap-0.5 z-10 text-[9px] font-black">
            {prop.houses === 5 ? (
              <span className="bg-red-600 text-white rounded px-1 shadow">🏨 فندق</span>
            ) : (
              Array.from({ length: prop.houses }).map((_, i) => (
                <span key={i} className="text-emerald-500">
                  🏡
                </span>
              ))
            )}
          </div>
        )}

        {/* Tile Content */}
        <div className="text-center my-auto flex flex-col items-center justify-center">
          <span className="text-[10px] sm:text-xs">{tile.countryFlag || tile.icon}</span>
          <span className="text-[9px] sm:text-[11px] font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">
            {tile.nameAr}
          </span>
          {tile.price > 0 && (
            <span className="font-mono text-[8px] sm:text-[10px] text-zinc-500 font-semibold">
              {tile.price} ج
            </span>
          )}
        </div>

        {/* Owner marker */}
        {owner && (
          <div
            className="h-1.5 w-full rounded-full shadow-sm mt-0.5"
            style={{ backgroundColor: owner.color }}
            title={`المالك: ${owner.displayName}`}
          />
        )}

        {/* Player pawns on tile */}
        {renderTilePawns(tile.index)}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-2 sm:px-4 py-4 space-y-4" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Top Header & Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div className="flex items-center gap-3">
          <Link href={links.lobby} className="text-xs font-bold text-zinc-500 hover:text-amber-600 transition">
            ← {t.lobby}
          </Link>
          <span className="text-zinc-300 dark:text-zinc-700">|</span>
          <h1 className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
            <span>🎲</span>
            <span>{room.title}</span>
          </h1>
          <button
            type="button"
            onClick={copyRoomCode}
            className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 transition"
          >
            {roomCode} {copied ? "✓" : "📋"}
          </button>
        </div>

        {/* Right Header Actions: Leave Table, Timer Indicator, Language */}
        <div className="flex items-center gap-2">
          {room.turnTimerSeconds && room.turnTimerSeconds > 0 ? (
            <span className="hidden sm:inline-flex items-center gap-1 font-mono text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 px-2.5 py-1 rounded-xl">
              ⏱️ {room.turnTimerSeconds}s
            </span>
          ) : (
            <span className="hidden sm:inline-flex items-center gap-1 font-mono text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1 rounded-xl">
              ⏱️ ♾️
            </span>
          )}

          <button
            type="button"
            onClick={onLeaveRoom}
            className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-3 py-1 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition cursor-pointer"
          >
            🚪 {lang === "ar" ? "مغادرة" : "Leave"}
          </button>

          {/* Language switch */}
          <Link
            href={links.ar}
            className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
              lang === "ar" ? "bg-amber-600 text-white" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            العربية
          </Link>
          <Link
            href={links.en}
            className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
              lang === "en" ? "bg-amber-600 text-white" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            English
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-3 text-xs font-semibold text-red-700 dark:text-red-300">
          ⚠️ {error}
        </div>
      )}

      {/* LOBBY / WAITING STATE */}
      {room.status === "WAITING" && (
        <section className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 text-center space-y-6 shadow-sm">
          <div className="space-y-2">
            <span className="text-4xl">🎩</span>
            <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
              {t.waitingForPlayers}
            </h2>
            <p className="text-xs text-zinc-500">
              {players.length < 2 ? t.needMinPlayers : `(${players.length}/6) لاعبين جاهزين!`}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 max-w-xl mx-auto">
            {players.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 px-4 py-2.5 shadow-sm"
              >
                <span
                  className="h-7 w-7 rounded-full flex items-center justify-center text-sm shadow border border-white"
                  style={{ backgroundColor: p.color }}
                >
                  {p.avatar}
                </span>
                <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                  {p.displayName}
                </span>
                {p.isHost && (
                  <span className="text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded">
                    Host
                  </span>
                )}
              </div>
            ))}
          </div>

          {selfPlayer?.isHost && (
            <button
              type="button"
              disabled={busy || players.length < 2}
              onClick={onStartMatch}
              className="rounded-2xl bg-gradient-to-r from-amber-600 to-yellow-600 px-8 py-3.5 text-sm font-black text-white shadow-xl shadow-amber-600/30 hover:scale-105 active:scale-95 transition disabled:opacity-50"
            >
              {busy ? "..." : t.startGame}
            </button>
          )}
        </section>
      )}

      {/* PLAYING STATE: BANK EL HAZZ TABLE BOARD */}
      {room.status !== "WAITING" && (
        <>
          {/* Mobile Screen Rotation Component */}
          <MobileTableRotation
            lang={lang}
            isRotated={isTableRotated}
            onToggleRotate={() => setIsTableRotated(!isTableRotated)}
            gameName="بنك الحظ"
          />

          <div className="grid lg:grid-cols-4 gap-4">
            {/* MAIN 40-TILE BOARD (3 Cols on Desktop) */}
            <section
              className={`lg:col-span-3 rounded-3xl border-4 border-amber-950/40 bg-gradient-to-br from-emerald-950 via-zinc-950 to-neutral-950 p-2 sm:p-4 shadow-2xl overflow-hidden transition-all duration-300 no-scrollbar ${
                isTableRotated ? "table-force-landscape" : ""
              }`}
            >
              {/* Classical Monopoly Perimeter Grid */}
              <div className="grid grid-cols-11 grid-rows-11 gap-0.5 aspect-square max-w-[800px] mx-auto bg-amber-950/20 border-2 border-amber-900/30 rounded-2xl p-1 shadow-inner">
                {/* TOP ROW: Tiles 20 to 30 (11 Tiles) */}
                <div className="col-span-11 row-span-1 grid grid-cols-11 gap-0.5">
                  {topTiles.map((tile) => renderTile(tile, "top"))}
                </div>

                {/* MIDDLE AREA: Left Column (9 tiles), Center Hub (9x9), Right Column (9 tiles) */}
                <div className="col-span-11 row-span-9 grid grid-cols-11 gap-0.5">
                  {/* Left Column (Tiles 19 down to 11) */}
                  <div className="col-span-1 grid grid-rows-9 gap-0.5">
                    {[...leftTiles].reverse().map((tile) => renderTile(tile, "left"))}
                  </div>

                  {/* CENTER ARENA (Hub for Dice, Actions, Cards, Status) */}
                  <div className="col-span-9 rounded-2xl bg-zinc-950/90 border border-white/10 p-3 sm:p-6 flex flex-col justify-between items-center text-center backdrop-blur-md shadow-2xl relative overflow-hidden">
                    {/* Background Logo */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none text-8xl sm:text-9xl font-black text-amber-500 select-none">
                      بنك الحظ
                    </div>

                    {/* Turn Announcement Banner */}
                    <div className="w-full flex items-center justify-between border-b border-white/10 pb-2 z-10 text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-400">{t.turn}:</span>
                        <span
                          className="px-2.5 py-1 rounded-full text-white font-extrabold flex items-center gap-1.5 shadow"
                          style={{ backgroundColor: currentTurnPlayer?.color || "#f59e0b" }}
                        >
                          <span>{currentTurnPlayer?.avatar}</span>
                          <span>{currentTurnPlayer?.displayName}</span>
                        </span>

                        {/* Turn Timer Badge */}
                        {room.turnTimerSeconds && room.turnTimerSeconds > 0 ? (
                          <span
                            className={`font-mono text-xs font-black px-2.5 py-0.5 rounded-full border transition-all ${
                              timeLeft !== null && timeLeft <= 5
                                ? "bg-red-500/30 text-red-300 border-red-500 animate-pulse font-extrabold"
                                : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                            }`}
                          >
                            ⏱️ {timeLeft !== null ? `${timeLeft}s` : `${room.turnTimerSeconds}s`}
                          </span>
                        ) : (
                          <span className="font-mono text-[10px] font-bold text-zinc-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                            ⏱️ ♾️
                          </span>
                        )}
                      </div>

                      {isMyTurn && (
                        <span className="animate-pulse bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30 text-xs font-black">
                          {t.yourTurn}
                        </span>
                      )}
                    </div>

                    {/* Interactive 3D Dice Display */}
                    <div className="my-auto py-2 z-10 flex flex-col items-center gap-3">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div
                          className={`h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br from-white to-zinc-200 text-zinc-950 text-4xl sm:text-5xl font-mono font-black flex items-center justify-center shadow-2xl border border-zinc-400 ${
                            isRollingAnimation ? "animate-spin" : ""
                          }`}
                        >
                          {room.dice1 ? DICE_UNICODE[room.dice1] : "🎲"}
                        </div>
                        <div
                          className={`h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br from-white to-zinc-200 text-zinc-950 text-4xl sm:text-5xl font-mono font-black flex items-center justify-center shadow-2xl border border-zinc-400 ${
                            isRollingAnimation ? "animate-spin" : ""
                          }`}
                        >
                          {room.dice2 ? DICE_UNICODE[room.dice2] : "🎲"}
                        </div>
                      </div>

                      {room.lastRollWasDoubles && (
                        <span className="text-xs font-black bg-amber-500 text-zinc-950 px-3 py-0.5 rounded-full shadow animate-bounce">
                          ✨ تطابق (Doubles)! رمية إضافية!
                        </span>
                      )}

                      {/* Current Action Prompt */}
                      {room.currentPhase === "TILE_ACTION" && currentLandedTile && (
                        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3 max-w-xs sm:max-w-sm text-center space-y-2">
                          <h3 className="text-xs sm:text-sm font-black text-amber-200">
                            {currentLandedTile.countryFlag} {currentLandedTile.nameAr}
                          </h3>
                          <p className="text-[11px] text-zinc-300">
                            سعر الشراء: <strong className="text-amber-400 font-mono">{currentLandedTile.price} ج</strong> • الإيجار الأساسي: <strong className="text-emerald-400 font-mono">{currentLandedTile.baseRent} ج</strong>
                          </p>
                        </div>
                      )}
                    </div>

                    {/* TURN ACTION BUTTONS TRAY */}
                    <div className="w-full z-10 pt-2 border-t border-white/10 flex flex-wrap items-center justify-center gap-2">
                      {isMyTurn && room.currentPhase === "WAITING_FOR_ROLL" && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => sendAction("ROLL_DICE")}
                          className="rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 px-6 py-2.5 text-xs sm:text-sm font-black text-zinc-950 shadow-lg shadow-amber-500/30 hover:scale-105 active:scale-95 transition cursor-pointer"
                        >
                          {busy ? "..." : t.rollDice}
                        </button>
                      )}

                      {isMyTurn && room.currentPhase === "TILE_ACTION" && (
                        <>
                          <button
                            type="button"
                            disabled={busy || (selfPlayer?.money ?? 0) < (currentLandedTile?.price ?? 0)}
                            onClick={() => sendAction("BUY_PROPERTY")}
                            className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 text-xs font-black text-white shadow-lg shadow-emerald-600/30 hover:scale-105 active:scale-95 transition disabled:opacity-40 cursor-pointer"
                          >
                            {t.buyProperty} ({currentLandedTile?.price} ج)
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => sendAction("PASS_PROPERTY")}
                            className="rounded-xl border border-zinc-600 bg-zinc-800 px-4 py-2 text-xs font-bold text-zinc-300 hover:bg-zinc-700 transition cursor-pointer"
                          >
                            {t.pass}
                          </button>
                        </>
                      )}

                      {isMyTurn && selfPlayer?.inJail && (
                        <>
                          <button
                            type="button"
                            disabled={busy || selfPlayer.money < 50}
                            onClick={() => sendAction("PAY_JAIL_FINE")}
                            className="rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-3.5 py-1.5 text-xs font-bold text-white shadow hover:scale-105 transition cursor-pointer"
                          >
                            {t.payJailFine}
                          </button>
                          {selfPlayer.jailFreeCards > 0 && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => sendAction("USE_JAIL_CARD")}
                              className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow hover:scale-105 transition cursor-pointer"
                            >
                              {t.useJailCard}
                            </button>
                          )}
                        </>
                      )}

                      {/* Manage buildings */}
                      {isMyTurn && (
                        <button
                          type="button"
                          onClick={() => setIsBuildingModalOpen(true)}
                          className="rounded-xl border border-amber-500/50 bg-amber-500/10 px-3.5 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition cursor-pointer"
                        >
                          {t.buildHouse}
                        </button>
                      )}

                      {/* End Turn */}
                      {isMyTurn && room.currentPhase === "TURN_END" && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => sendAction("END_TURN")}
                          className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2 text-xs sm:text-sm font-black text-white shadow-lg shadow-blue-600/30 hover:scale-105 active:scale-95 transition cursor-pointer"
                        >
                          {busy ? "..." : t.endTurn}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right Column (Tiles 31 to 39) */}
                  <div className="col-span-1 grid grid-rows-9 gap-0.5">
                    {rightTiles.map((tile) => renderTile(tile, "right"))}
                  </div>
                </div>

                {/* BOTTOM ROW: Tiles 10 down to 0 (11 Tiles) */}
                <div className="col-span-11 row-span-1 grid grid-cols-11 gap-0.5">
                  {[...bottomTiles].reverse().map((tile) => renderTile(tile, "bottom"))}
                </div>
              </div>
            </section>

            {/* SIDEBAR: PLAYERS LEADERBOARD & LIVE ACTION LOG */}
            <aside className="lg:col-span-1 space-y-4">
              {/* PLAYERS CARDS */}
              <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 p-4 shadow-sm space-y-3">
                <h2 className="text-sm font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <span>👥</span>
                  <span>اللاعبون وأرصدتهم</span>
                </h2>

                <div className="space-y-2">
                  {players.map((p) => {
                    const isTurn = p.id === room.currentTurnPlayerId;
                    return (
                      <div
                        key={p.id}
                        className={`rounded-2xl border p-2.5 transition flex items-center justify-between ${
                          p.isBankrupt
                            ? "border-red-900/40 bg-red-950/20 opacity-50"
                            : isTurn
                            ? "border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/20"
                            : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="h-7 w-7 rounded-full flex items-center justify-center text-xs shadow border border-white"
                            style={{ backgroundColor: p.color }}
                          >
                            {p.avatar}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                              <span>{p.displayName}</span>
                              {p.inJail && (
                                <span className="text-[10px] bg-red-500/20 text-red-400 px-1 rounded">
                                  سجن 👮
                                </span>
                              )}
                              {p.isBankrupt && (
                                <span className="text-[10px] bg-red-600 text-white px-1 rounded">
                                  مفلس 💀
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              موقع: {BANK_TILES[p.position].nameAr}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-mono font-black text-xs text-amber-600 dark:text-amber-400 block">
                            {p.money} ج
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            {p.ownedTileIndices.length} عقارات
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* LIVE ACTION LOG */}
              <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 p-4 shadow-sm space-y-2">
                <h2 className="text-xs font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <span>📜</span>
                  <span>{t.actionLog}</span>
                </h2>

                <div className="space-y-1.5 max-h-56 overflow-y-auto no-scrollbar text-[11px]">
                  {actions.slice(0, 15).map((act) => (
                    <div
                      key={act.id}
                      className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 p-2 text-zinc-700 dark:text-zinc-300 leading-snug"
                    >
                      {act.details}
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </>
      )}

      {/* BUILDINGS & MONOPOLY MANAGEMENT MODAL */}
      {isBuildingModalOpen && selfPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-white/20 bg-zinc-900 p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar text-white">
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

            <p className="text-xs text-zinc-400">
              قم ببناء العمارات (حتى ٤ عمارات) أو فندق سياحي فخم على المدن التي تمتلك احتكار دولتها بالكامل لزيادة الإيجارات!
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
                            className="flex items-center justify-between rounded-xl bg-zinc-800/70 px-3 py-2 text-xs"
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

      {/* MATCH FINISHED WINNER BANNER */}
      {room.status === "FINISHED" && (
        <section className="rounded-3xl border-2 border-amber-500/50 bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-transparent p-8 text-center space-y-4 shadow-2xl animate-in zoom-in">
          <div className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/30 text-4xl shadow-lg">
            🏆
          </div>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
            {t.winnerTitle}
          </h2>
          <p className="text-base font-bold text-amber-700 dark:text-amber-300">
            {players.find((p) => p.id === room.winnerPlayerId)?.displayName || "الفائز"}
          </p>

          {selfPlayer?.isHost && (
            <button
              type="button"
              disabled={busy}
              onClick={() => sendAction("REPLAY")}
              className="rounded-2xl bg-gradient-to-r from-amber-600 to-yellow-600 px-8 py-3.5 text-sm font-black text-white shadow-xl shadow-amber-600/30 hover:scale-105 active:scale-95 transition"
            >
              {t.replay}
            </button>
          )}
        </section>
      )}
    </div>
  );
}
