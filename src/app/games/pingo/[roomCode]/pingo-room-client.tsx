"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PingoCardView } from "@/components/pingo-card";
import { generateRandomPingoCard, PINGO_LETTERS } from "@/lib/games/pingo-types";

type RoomPayload = {
  room: {
    id: string;
    roomCode: string;
    title: string;
    visibility: "PUBLIC" | "PRIVATE";
    status: "WAITING" | "PLAYING" | "FINISHED";
    currentPhase: "SETUP" | "PLAYING" | "ROUND_OVER" | "FINISHED";
    scoreLimit: number;
    roundNumber: number;
    currentTurnPlayerId: string | null;
    turnStartedAt: string | null;
    turnTimerSeconds: number;
    calledNumbers: number[];
    lastCalledNumber: number | null;
    roundWinnerId: string | null;
    roundSummary: string | null;
    createdById: string;
    winnerId: string | null;
    players: Array<{
      id: string;
      userId: string;
      displayName: string;
      seatIndex: number;
      score: number;
      isHost: boolean;
      isReady: boolean;
      completedLinesCount: number;
      lettersUnlocked: string;
      isPingoReady: boolean;
      gridNumbers: number[];
      scratchedCellIndices: number[];
      completedLineIndices: number[][];
    }>;
    actions: Array<{
      id: string;
      type: string;
      details: string | null;
      createdAt: string;
    }>;
  };
  selfPlayer: {
    id: string;
    userId: string;
    displayName: string;
    seatIndex: number;
    score: number;
    isHost: boolean;
    isReady: boolean;
    isMyTurn: boolean;
  };
};

type Dictionary = {
  back: string;
  room: string;
  waiting: string;
  setupPhase: string;
  playing: string;
  roundOver: string;
  finished: string;
  round: string;
  targetWins: string;
  minPlayersNotice: string;
  startTable: string;
  nextRound: string;
  playAgain: string;
  leaveRoom: string;
  yourTurn: string;
  waitingForTurn: string;
  callNumberInstruction: string;
  lastCalledTitle: string;
  calledNumbersTitle: string;
  shoutPingo: string;
  randomizeCard: string;
  setupDone: string;
  scoreboard: string;
  tableLog: string;
  loading: string;
  linesCompleted: string;
  championTitle: string;
};

const DICTIONARY: Record<"en" | "ar", Dictionary> = {
  en: {
    back: "Back to Lobby",
    room: "Table",
    waiting: "Waiting for Players",
    setupPhase: "Card Setup (Arranging numbers)",
    playing: "Round in Progress",
    roundOver: "Round Finished!",
    finished: "Match Champion Crowned!",
    round: "Round",
    targetWins: "Target Wins",
    minPlayersNotice: "Requires at least 2 players to start.",
    startTable: "Start Pingo Match",
    nextRound: "Next Round",
    playAgain: "Play Again (Reset Scores)",
    leaveRoom: "Leave Table",
    yourTurn: "It's your turn to call a number!",
    waitingForTurn: "Waiting for",
    callNumberInstruction: "Click any uncalled number in your card to call it out!",
    lastCalledTitle: "Last Called Number",
    calledNumbersTitle: "Called Numbers Tracker",
    shoutPingo: "🚨 SHOUT PINGO! 🚨",
    randomizeCard: "🎲 Randomize Numbers",
    setupDone: "Ready to Play!",
    scoreboard: "Players & Scoreboard",
    tableLog: "Table Activity Log",
    loading: "Loading Pingo Table...",
    linesCompleted: "Lines Completed",
    championTitle: "🏆 PINGO CHAMPION 🏆",
  },
  ar: {
    back: "العودة للقائمة",
    room: "الطاولة",
    waiting: "في انتظار اللاعبين",
    setupPhase: "مرحلة تجهيز الكرت",
    playing: "الجولة جارية",
    roundOver: "انتهت الجولة!",
    finished: "انتهت المباراة وتُوّج البطل!",
    round: "الجولة",
    targetWins: "عدد الجولات للفوز",
    minPlayersNotice: "تحتاج إلى لاعبين اثنين على الأقل لبدء اللعب.",
    startTable: "بدء مباراة بينجو",
    nextRound: "الجولة التالية",
    playAgain: "لعب طاولة جديدة (تصفير النقط)",
    leaveRoom: "مغادرة الطاولة",
    yourTurn: "دورك الآن لنداء رقم!",
    waitingForTurn: "في انتظار",
    callNumberInstruction: "المس أي رقم غير مشطوب في كرتك لندائه للجميع!",
    lastCalledTitle: "آخر رقم تم نداؤه",
    calledNumbersTitle: "سجل الأرقام المناداة",
    shoutPingo: "🚨 صرخة بينجو! (PINGO!) 🚨",
    randomizeCard: "🎲 ترتيب عشوائي",
    setupDone: "أنا جاهز!",
    scoreboard: "اللاعبون ولوحة النقط",
    tableLog: "سجل أحداث الطاولة",
    loading: "جارٍ تحميل طاولة بينجو...",
    linesCompleted: "خطوط مكتملة",
    championTitle: "🏆 بطل مباراة بينجو 🏆",
  },
};

// Web Audio sound effects for Pingo
function playPingoSound(
  type: "call" | "scratch" | "lineComplete" | "pingoVictory" | "tick" | "shuffle",
) {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === "call") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === "scratch") {
      // Chalk/pencil scratch sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(380, now + 0.08);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === "lineComplete") {
      // Triumphant line bell chime
      [587.33, 739.99, 880].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.25, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.2);
      });
    } else if (type === "pingoVictory") {
      // Grand victory fanfare
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.35, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.35);
      });
    } else if (type === "shuffle") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === "tick") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(900, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    }
  } catch {
    // Ignore audio error
  }
}

export default function PingoRoomClient({ roomCode }: { roomCode: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") === "ar" ? "ar" : "en";
  const t = DICTIONARY[lang];

  const [roomData, setRoomData] = useState<RoomPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Turn timer countdown state
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  // Previous letter count tracker to trigger sound on new letter unlock
  const [prevLettersCount, setPrevLettersCount] = useState(0);

  const links = useMemo(
    () => ({
      lobby: `/games/pingo?lang=${lang}`,
      en: `/games/pingo/${roomCode}?lang=en`,
      ar: `/games/pingo/${roomCode}?lang=ar`,
    }),
    [lang, roomCode],
  );

  useEffect(() => {
    let running = true;

    const load = async () => {
      const response = await fetch(`/api/games/pingo/rooms/${roomCode}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as RoomPayload & { error?: string };
      if (!running) return;

      if (!response.ok || !data.room || !data.selfPlayer) {
        setError(data.error ?? "Could not load table.");
      } else {
        setRoomData({ room: data.room, selfPlayer: data.selfPlayer });
        setError(null);

        // Sound trigger for newly completed letter
        const myPlayerData = data.room.players.find((p) => p.id === data.selfPlayer.id);
        const currentLettersLen = myPlayerData?.lettersUnlocked.length || 0;
        if (currentLettersLen > prevLettersCount) {
          playPingoSound("lineComplete");
          setPrevLettersCount(currentLettersLen);
        }
      }
      setLoading(false);
    };

    load().catch((err) => {
      if (running) {
        setError(err instanceof Error ? err.message : "Could not load table.");
        setLoading(false);
      }
    });

    const intervalId = window.setInterval(() => {
      load().catch(() => undefined);
    }, 1500);

    return () => {
      running = false;
      window.clearInterval(intervalId);
    };
  }, [roomCode, prevLettersCount]);

  // Turn Timer countdown effect
  useEffect(() => {
    if (
      !roomData?.room.turnStartedAt ||
      !roomData.room.turnTimerSeconds ||
      roomData.room.status !== "PLAYING"
    ) {
      setSecondsRemaining(null);
      return;
    }

    const timerSeconds = roomData.room.turnTimerSeconds;
    const startedAt = new Date(roomData.room.turnStartedAt).getTime();

    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = Math.max(0, timerSeconds - elapsed);
      setSecondsRemaining(remaining);

      if (remaining > 0 && remaining <= 5 && roomData.selfPlayer.isMyTurn) {
        playPingoSound("tick");
      }

      // Auto-call uncalled number on turn expiry
      if (remaining === 0 && roomData.selfPlayer.isMyTurn && !busy) {
        const calledSet = new Set(roomData.room.calledNumbers);
        const selfCard =
          roomData.room.players.find((p) => p.id === roomData.selfPlayer.id)?.gridNumbers || [];
        const uncalledNumber = selfCard.find((n) => !calledSet.has(n));
        if (uncalledNumber) {
          onCallNumber(uncalledNumber);
        }
      }
    };

    updateTimer();
    const interval = window.setInterval(updateTimer, 1000);
    return () => window.clearInterval(interval);
  }, [
    roomData?.room.turnStartedAt,
    roomData?.room.turnTimerSeconds,
    roomData?.room.status,
    roomData?.selfPlayer.isMyTurn,
    roomData?.room.calledNumbers,
    busy,
  ]);

  async function callAction(payload: { type: string; [key: string]: unknown }) {
    setBusy(true);
    const response = await fetch(`/api/games/pingo/rooms/${roomCode}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as { error?: string; ok?: boolean; deleted?: boolean };
    setBusy(false);

    if (!response.ok) {
      setError(data.error ?? "Action failed.");
      return;
    }

    if (data.deleted) {
      router.push(links.lobby);
      return;
    }

    setError(null);
    const refreshRes = await fetch(`/api/games/pingo/rooms/${roomCode}`, {
      cache: "no-store",
    });
    if (refreshRes.ok) {
      const refreshed = (await refreshRes.json()) as RoomPayload;
      setRoomData(refreshed);
    }
  }

  const onStartGame = async () => {
    setBusy(true);
    const response = await fetch(`/api/games/pingo/rooms/${roomCode}/start`, {
      method: "POST",
    });
    const data = (await response.json()) as { error?: string; ok?: boolean };
    setBusy(false);
    if (!response.ok) {
      setError(data.error ?? "Could not start game.");
      return;
    }
    playPingoSound("call");
  };

  const onRandomizeCard = () => {
    playPingoSound("shuffle");
    const newNumbers = generateRandomPingoCard();
    callAction({ type: "SETUP_CARD", gridNumbers: newNumbers });
  };

  const onCallNumber = (num: number) => {
    playPingoSound("call");
    callAction({ type: "CALL_NUMBER", calledNumber: num });
  };

  const onShoutPingo = () => {
    playPingoSound("pingoVictory");
    callAction({ type: "SHOUT_PINGO" });
  };

  const onNextRound = () => callAction({ type: "NEXT_ROUND" });
  const onReplay = () => callAction({ type: "REPLAY" });
  const onLeaveRoom = () => callAction({ type: "LEAVE" });

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-4xl items-center justify-center px-6 py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">{t.loading}</p>
        </div>
      </main>
    );
  }

  if (error || !roomData) {
    return (
      <main className="mx-auto w-full max-w-4xl px-6 py-12">
        <div className="rounded-3xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-6 text-center">
          <p className="text-red-700 dark:text-red-300 font-bold">{error ?? "Table not available."}</p>
          <Link
            href={links.lobby}
            className="mt-4 inline-block rounded-xl bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-semibold text-white dark:text-zinc-900 hover:opacity-90"
          >
            {t.back}
          </Link>
        </div>
      </main>
    );
  }

  const room = roomData.room;
  const selfPlayer = roomData.selfPlayer;
  const playerCount = room.players.length;

  const canStart = selfPlayer.isHost && room.status === "WAITING" && playerCount >= 2;
  const isRoundOver = room.currentPhase === "ROUND_OVER" || room.status === "FINISHED";
  const isMatchFinished = room.status === "FINISHED";

  const myPlayerData = room.players.find((p) => p.id === selfPlayer.id);
  const currentTurnPlayer = room.players.find((p) => p.id === room.currentTurnPlayerId);

  const calledSet = new Set(room.calledNumbers);

  return (
    <main
      className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 sm:px-6 py-8"
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href={links.lobby}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            ← {t.back}
          </Link>
          <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-900/60">
            #{room.roomCode}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs font-medium">
            <Link
              className={`rounded-lg border px-2.5 py-1 transition ${
                lang === "en"
                  ? "border-amber-600 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-bold"
                  : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
              }`}
              href={links.en}
            >
              EN
            </Link>
            <Link
              className={`rounded-lg border px-2.5 py-1 transition ${
                lang === "ar"
                  ? "border-amber-600 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-bold"
                  : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
              }`}
              href={links.ar}
            >
              عربي
            </Link>
          </div>
          <button
            type="button"
            onClick={onLeaveRoom}
            className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-3 py-1 text-xs font-semibold text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/60 transition cursor-pointer"
          >
            {t.leaveRoom}
          </button>
        </div>
      </div>

      {/* Table Status Card */}
      <section className="rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 p-5 shadow-sm backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl animate-bounce">🎱</span>
              <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-50">{room.title}</h1>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {t.round} {room.roundNumber} · {t.targetWins}:{" "}
              <strong className="text-zinc-900 dark:text-zinc-100">{room.scoreLimit} Wins</strong>
              {room.turnTimerSeconds > 0 && (
                <span className="ml-2 text-amber-600 dark:text-amber-400 font-bold">
                  ⏱️ {room.turnTimerSeconds}s timer
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Live Turn Timer Countdown */}
            {room.status === "PLAYING" && secondsRemaining !== null && (
              <span
                className={`rounded-full px-3 py-1 text-xs font-black font-mono transition shadow-sm ${
                  secondsRemaining <= 5
                    ? "bg-red-500 text-white animate-bounce ring-2 ring-red-400"
                    : secondsRemaining <= 10
                    ? "bg-amber-500 text-zinc-950"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                }`}
              >
                ⏱️ {secondsRemaining}s
              </span>
            )}

            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                room.status === "WAITING"
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                  : isRoundOver
                  ? "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
              }`}
            >
              {room.status === "WAITING"
                ? t.waiting
                : isRoundOver
                ? t.roundOver
                : t.playing}
            </span>
          </div>
        </div>

        {/* WAITING STATE */}
        {room.status === "WAITING" && (
          <div className="mt-5 space-y-4 text-center py-6">
            <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-3xl">
              🎱
            </div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{t.waiting}</h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
              Share code <strong className="font-mono text-amber-600 dark:text-amber-400">#{room.roomCode}</strong> with friends.
              <span className="block mt-1 text-amber-600 dark:text-amber-400 font-semibold">
                ⚠️ {t.minPlayersNotice}
              </span>
            </p>

            {/* Pre-game Card Randomizer */}
            <div className="pt-2 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={onRandomizeCard}
                className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition cursor-pointer shadow-sm"
              >
                {t.randomizeCard}
              </button>

              {selfPlayer.isHost && (
                <button
                  type="button"
                  disabled={busy || !canStart}
                  onClick={onStartGame}
                  className="rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 px-8 py-3.5 font-black text-white hover:opacity-95 transition disabled:opacity-50 cursor-pointer shadow-lg shadow-amber-600/20"
                >
                  {t.startTable} ({playerCount}/8 Players)
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ACTIVE GAMEPLAY AREA */}
      {room.status === "PLAYING" && (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Main Player Card Column */}
          <div className="lg:col-span-7 flex flex-col items-center gap-4">
            {/* Turn Banner */}
            <div
              className={`w-full p-3.5 rounded-2xl border text-center transition ${
                selfPlayer.isMyTurn
                  ? "border-amber-400 bg-amber-500/20 text-amber-300 font-black ring-2 ring-amber-400/40 animate-pulse"
                  : "border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-400 font-medium"
              }`}
            >
              {selfPlayer.isMyTurn ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg">📢</span>
                  <span>{t.yourTurn}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-xs">
                  <span>⏳ {t.waitingForTurn}</span>
                  <strong className="text-zinc-900 dark:text-zinc-100">
                    {currentTurnPlayer?.displayName}
                  </strong>
                </div>
              )}
            </div>

            {/* PINGO CLAIM BUTTON (Unlocked when 5 lines completed) */}
            {myPlayerData && myPlayerData.isPingoReady && (
              <button
                type="button"
                disabled={busy}
                onClick={onShoutPingo}
                className="w-full rounded-3xl bg-gradient-to-r from-red-600 via-amber-500 to-emerald-500 p-4 text-center font-black text-white shadow-2xl hover:scale-105 transition cursor-pointer ring-4 ring-yellow-400 animate-bounce"
              >
                <span className="text-xl sm:text-2xl">{t.shoutPingo}</span>
                <span className="block text-xs text-yellow-200 mt-0.5">
                  5 Lines Completed! Claim Victory Now!
                </span>
              </button>
            )}

            {/* 5x5 Player Card */}
            {myPlayerData && (
              <PingoCardView
                gridNumbers={myPlayerData.gridNumbers}
                scratchedCellIndices={myPlayerData.scratchedCellIndices}
                completedLineIndices={myPlayerData.completedLineIndices}
                lettersUnlocked={myPlayerData.lettersUnlocked}
                isInteractive={selfPlayer.isMyTurn}
                onCellClick={(num) => {
                  if (selfPlayer.isMyTurn && !calledSet.has(num)) {
                    onCallNumber(num);
                  }
                }}
                lastCalledNumber={room.lastCalledNumber}
                size="lg"
                isCurrentTurn={selfPlayer.isMyTurn}
              />
            )}

            <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center max-w-sm">
              {selfPlayer.isMyTurn
                ? t.callNumberInstruction
                : `Completed Lines: ${myPlayerData?.completedLinesCount || 0} / 5`}
            </p>
          </div>

          {/* Called Numbers Board & Tracker Column */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Last Called Big Ball Card */}
            <div className="rounded-3xl border-2 border-amber-400/50 bg-gradient-to-br from-amber-500/10 via-zinc-900 to-zinc-950 p-5 shadow-xl text-center">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                {t.lastCalledTitle}
              </span>
              <div className="mt-3 flex justify-center">
                {room.lastCalledNumber ? (
                  <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-rose-600 text-white flex items-center justify-center font-black text-3xl sm:text-4xl shadow-2xl ring-4 ring-amber-400/40 animate-in zoom-in-50 duration-200">
                    {room.lastCalledNumber}
                  </div>
                ) : (
                  <div className="h-20 w-20 rounded-full border-2 border-dashed border-zinc-700 flex items-center justify-center text-xs text-zinc-500">
                    None yet
                  </div>
                )}
              </div>
            </div>

            {/* 1 to 25 Numbers Tracker Dial */}
            <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black uppercase text-zinc-700 dark:text-zinc-300 tracking-wider">
                  {t.calledNumbersTitle}
                </h3>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono">
                  {room.calledNumbers.length}/25
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 25 }, (_, i) => i + 1).map((n) => {
                  const isCalled = calledSet.has(n);
                  const isLast = room.lastCalledNumber === n;

                  return (
                    <button
                      key={n}
                      type="button"
                      disabled={!selfPlayer.isMyTurn || isCalled}
                      onClick={() => onCallNumber(n)}
                      className={`h-9 rounded-xl flex items-center justify-center text-xs font-bold transition select-none ${
                        isLast
                          ? "bg-amber-500 text-zinc-950 font-black ring-2 ring-amber-400 scale-105"
                          : isCalled
                          ? "bg-red-500/20 text-red-500 line-through border border-red-500/30"
                          : selfPlayer.isMyTurn
                          ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-amber-400 hover:text-zinc-950 cursor-pointer"
                          : "bg-zinc-100/50 dark:bg-zinc-800/50 text-zinc-400 cursor-default"
                      }`}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ROUND OVER / MATCH SUMMARY & REVEALED CARDS */}
      {isRoundOver && (
        <section className="rounded-3xl border-2 border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-transparent p-6 text-center space-y-4 shadow-xl">
          <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/20 text-3xl animate-bounce">
            🏆
          </div>
          <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
            {isMatchFinished ? t.championTitle : t.roundOver}
          </h2>
          {room.roundSummary && (
            <p className="text-sm font-bold text-amber-800 dark:text-amber-200 max-w-xl mx-auto">
              {room.roundSummary}
            </p>
          )}

          {/* All Players Cards Revealed for Transparency */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-3">
            {room.players.map((p) => (
              <div key={p.id} className="flex justify-center">
                <PingoCardView
                  gridNumbers={p.gridNumbers}
                  scratchedCellIndices={p.scratchedCellIndices}
                  completedLineIndices={p.completedLineIndices}
                  lettersUnlocked={p.lettersUnlocked}
                  playerName={p.displayName}
                  size="sm"
                />
              </div>
            ))}
          </div>

          {/* Host Next Round / Replay Buttons */}
          {selfPlayer.isHost && (
            <div className="pt-4 max-w-xs mx-auto">
              {isMatchFinished ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={onReplay}
                  className="w-full rounded-2xl bg-zinc-900 dark:bg-zinc-100 px-6 py-3 text-sm font-bold text-white dark:text-zinc-900 hover:opacity-90 transition cursor-pointer shadow-lg"
                >
                  🔄 {t.playAgain}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={onNextRound}
                  className="w-full rounded-2xl bg-amber-600 px-6 py-3 text-sm font-bold text-white hover:bg-amber-500 transition cursor-pointer shadow-lg shadow-amber-600/20"
                >
                  ⏭️ {t.nextRound} ({room.roundNumber + 1})
                </button>
              )}
            </div>
          )}
        </section>
      )}

      {/* Players Scoreboard & Table Activity Log */}
      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 p-5 shadow-sm">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-3">
            {t.scoreboard}
          </h3>
          <div className="space-y-2">
            {room.players.map((p) => {
              const isTurn = p.id === room.currentTurnPlayerId && room.status === "PLAYING";
              const isSelf = p.id === selfPlayer.id;

              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between rounded-2xl border p-3 transition ${
                    isTurn
                      ? "border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/20 font-bold"
                      : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {p.displayName} {isSelf && (lang === "ar" ? "(أنت)" : "(You)")}
                    </span>
                    {p.isHost && (
                      <span className="rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2 py-0.5 text-[10px] font-bold">
                        Host
                      </span>
                    )}
                    {/* Letters badge */}
                    {p.lettersUnlocked && (
                      <span className="rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 text-white px-2 py-0.5 text-[10px] font-black tracking-widest">
                        {p.lettersUnlocked}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-extrabold text-amber-600 dark:text-amber-400">
                      {p.score}{" "}
                      <span className="text-xs font-normal text-zinc-400">
                        / {room.scoreLimit} Wins
                      </span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 p-5 shadow-sm">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-3">
            {t.tableLog}
          </h3>
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {room.actions.length === 0 ? (
              <p className="text-xs text-zinc-400 italic">No numbers called yet.</p>
            ) : (
              room.actions.map((act) => (
                <div
                  key={act.id}
                  className="rounded-xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800/60 p-2 text-xs text-zinc-700 dark:text-zinc-300"
                >
                  {act.details}
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
