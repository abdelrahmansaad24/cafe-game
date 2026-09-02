"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  AUTOBUS_CATEGORIES,
  AutobusAnswers,
  doesWordStartWithLetter,
  EvaluatedCategoryAnswer,
} from "@/lib/games/autobus-types";

type RoomPayload = {
  room: {
    id: string;
    roomCode: string;
    title: string;
    visibility: "PUBLIC" | "PRIVATE";
    status: "WAITING" | "PLAYING" | "FINISHED";
    currentPhase: "PLAYING" | "COUNTDOWN" | "REVIEW" | "ROUND_OVER" | "FINISHED";
    scoreLimit: number;
    roundNumber: number;
    currentLetter: string;
    countdownStartedAt: string | null;
    countdownSeconds: number;
    autobusPresserName: string | null;
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
      roundPoints: number;
      isHost: boolean;
      hasSubmitted: boolean;
      filledCategoriesCount: number;
      answers: AutobusAnswers;
      evaluation: {
        categoryScores: Record<string, EvaluatedCategoryAnswer>;
        totalRoundPoints: number;
      } | null;
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
    hasSubmitted: boolean;
  };
};

type Dictionary = {
  back: string;
  room: string;
  waiting: string;
  playing: string;
  countdownBanner: string;
  reviewPhase: string;
  roundOver: string;
  finished: string;
  round: string;
  targetScore: string;
  minPlayersNotice: string;
  startTable: string;
  nextRound: string;
  playAgain: string;
  leaveRoom: string;
  currentLetterTitle: string;
  autobusBuzzer: string;
  submitAnswers: string;
  submittedNotice: string;
  confirmScores: string;
  scoreboard: string;
  tableLog: string;
  loading: string;
  uniqueBadge: string;
  duplicateBadge: string;
  invalidBadge: string;
  championTitle: string;
};

const DICTIONARY: Record<"en" | "ar", Dictionary> = {
  en: {
    back: "Back to Lobby",
    room: "Table",
    waiting: "Waiting for Players",
    playing: "Round in Progress - Type Your Words!",
    countdownBanner: "pressed AUTOBUS COMPLETE! Countdown started!",
    reviewPhase: "Review & Scoring Phase",
    roundOver: "Round Finished!",
    finished: "Match Champion Crowned!",
    round: "Round",
    targetScore: "Target Score",
    minPlayersNotice: "Requires at least 2 players to start.",
    startTable: "Start Autobus Match",
    nextRound: "Next Round",
    playAgain: "Play Again (Reset Scores)",
    leaveRoom: "Leave Table",
    currentLetterTitle: "Round Letter",
    autobusBuzzer: "🚌 AUTOBUS COMPLETE!",
    submitAnswers: "Save Answers",
    submittedNotice: "Answers Submitted!",
    confirmScores: "Confirm & Apply Scores",
    scoreboard: "Players & Scoreboard",
    tableLog: "Table Activity Log",
    loading: "Loading Autobus Table...",
    uniqueBadge: "10 pts (Unique)",
    duplicateBadge: "5 pts (Shared)",
    invalidBadge: "0 pts",
    championTitle: "🏆 AUTOBUS CHAMPION 🏆",
  },
  ar: {
    back: "العودة للقائمة",
    room: "الطاولة",
    waiting: "في انتظار اللاعبين",
    playing: "الجولة جارية - اكتب كلماتك!",
    countdownBanner: "ضغط أتوبيس كومبليت! العداد التنازلي بدأ!",
    reviewPhase: "مرحلة مراجعة وتصحيح الكلمات",
    roundOver: "انتهت الجولة!",
    finished: "انتهت المباراة وتُوّج البطل!",
    round: "الجولة",
    targetScore: "نقط الفوز بالمباراة",
    minPlayersNotice: "تحتاج إلى لاعبين اثنين على الأقل لبدء اللعب.",
    startTable: "بدء مباراة أتوبيس كومبليت",
    nextRound: "الجولة التالية",
    playAgain: "لعب طاولة جديدة (تصفير النقط)",
    leaveRoom: "مغادرة الطاولة",
    currentLetterTitle: "حرف الجولة",
    autobusBuzzer: "🚌 أتوبيس كومبليت!",
    submitAnswers: "حفظ الكلمات",
    submittedNotice: "تم تسليم الكلمات!",
    confirmScores: "اعتماد وحساب النتيجة",
    scoreboard: "اللاعبون ولوحة النقط",
    tableLog: "سجل أحداث الطاولة",
    loading: "جارٍ تحميل طاولة أتوبيس كومبليت...",
    uniqueBadge: "١٠ نقط (مميزة)",
    duplicateBadge: "٥ نقط (متشابهة)",
    invalidBadge: "٠ نقطة",
    championTitle: "🏆 بطل أتوبيس كومبليت 🏆",
  },
};

// Web Audio sound effects for Autobus Complete
function playAutobusSound(type: "horn" | "start" | "tick" | "celebrate") {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === "horn") {
      // Authentic Egyptian bus double-honk: beep-beep!
      [0, 0.16].forEach((delay) => {
        [440, 554].forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(freq, now + delay);
          gain.gain.setValueAtTime(0.3, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.12);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + delay);
          osc.stop(now + delay + 0.12);
        });
      });
    } else if (type === "start") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.linearRampToValueAtTime(880, now + 0.2);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === "celebrate") {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.09);
        gain.gain.setValueAtTime(0.3, now + i * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.09 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.09);
        osc.stop(now + i * 0.09 + 0.25);
      });
    } else if (type === "tick") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(950, now);
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

export default function AutobusRoomClient({ roomCode }: { roomCode: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") === "ar" ? "ar" : "en";
  const t = DICTIONARY[lang];

  const [roomData, setRoomData] = useState<RoomPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Live input fields for current player
  const [inputs, setInputs] = useState<AutobusAnswers>({});

  // Countdown timer state
  const [countdownRemaining, setCountdownRemaining] = useState<number | null>(null);

  const links = useMemo(
    () => ({
      lobby: `/games/autobus?lang=${lang}`,
      en: `/games/autobus/${roomCode}?lang=en`,
      ar: `/games/autobus/${roomCode}?lang=ar`,
    }),
    [lang, roomCode],
  );

  useEffect(() => {
    let running = true;

    const load = async () => {
      const response = await fetch(`/api/games/autobus/rooms/${roomCode}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as RoomPayload & { error?: string };
      if (!running) return;

      if (!response.ok || !data.room || !data.selfPlayer) {
        setError(data.error ?? "Could not load table.");
      } else {
        setRoomData({ room: data.room, selfPlayer: data.selfPlayer });
        setError(null);

        // Sync inputs if not yet typed
        const myPlayerData = data.room.players.find((p) => p.id === data.selfPlayer.id);
        if (myPlayerData?.answers && Object.keys(inputs).length === 0) {
          setInputs(myPlayerData.answers);
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
  }, [roomCode]);

  // Countdown timer effect
  useEffect(() => {
    if (
      roomData?.room.currentPhase !== "COUNTDOWN" ||
      !roomData.room.countdownStartedAt
    ) {
      setCountdownRemaining(null);
      return;
    }

    const timerTotal = roomData.room.countdownSeconds;
    const startedAt = new Date(roomData.room.countdownStartedAt).getTime();

    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = Math.max(0, timerTotal - elapsed);
      setCountdownRemaining(remaining);

      if (remaining > 0 && remaining <= 5) {
        playAutobusSound("tick");
      }

      // Auto submit answers when countdown reaches 0
      if (remaining === 0 && !busy) {
        onSubmitAnswers();
      }
    };

    updateTimer();
    const interval = window.setInterval(updateTimer, 1000);
    return () => window.clearInterval(interval);
  }, [
    roomData?.room.currentPhase,
    roomData?.room.countdownStartedAt,
    roomData?.room.countdownSeconds,
    busy,
  ]);

  async function callAction(payload: { type: string; [key: string]: unknown }) {
    setBusy(true);
    const response = await fetch(`/api/games/autobus/rooms/${roomCode}/action`, {
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
    const refreshRes = await fetch(`/api/games/autobus/rooms/${roomCode}`, {
      cache: "no-store",
    });
    if (refreshRes.ok) {
      const refreshed = (await refreshRes.json()) as RoomPayload;
      setRoomData(refreshed);
    }
  }

  const onStartGame = async () => {
    setBusy(true);
    const response = await fetch(`/api/games/autobus/rooms/${roomCode}/start`, {
      method: "POST",
    });
    const data = (await response.json()) as { error?: string; ok?: boolean };
    setBusy(false);
    if (!response.ok) {
      setError(data.error ?? "Could not start match.");
      return;
    }
    playAutobusSound("start");
  };

  const onInputChange = (categoryId: string, value: string) => {
    const updated = { ...inputs, [categoryId]: value };
    setInputs(updated);
  };

  const onSubmitAnswers = () => {
    callAction({ type: "SUBMIT_ANSWERS", answers: inputs });
  };

  const onPressAutobusBuzzer = () => {
    playAutobusSound("horn");
    callAction({ type: "PRESS_AUTOBUS", answers: inputs });
  };

  const onConfirmScores = () => {
    playAutobusSound("celebrate");
    callAction({ type: "CONFIRM_SCORES" });
  };

  const onNextRound = () => {
    setInputs({});
    playAutobusSound("start");
    callAction({ type: "NEXT_ROUND" });
  };

  const onReplay = () => {
    setInputs({});
    callAction({ type: "REPLAY" });
  };

  const onLeaveRoom = () => callAction({ type: "LEAVE" });

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-4xl items-center justify-center px-6 py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
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
  const isPlayingOrCountdown =
    room.status === "PLAYING" &&
    (room.currentPhase === "PLAYING" || room.currentPhase === "COUNTDOWN");
  const isReviewPhase = room.currentPhase === "REVIEW";
  const isRoundOver = room.currentPhase === "ROUND_OVER" || room.status === "FINISHED";
  const isMatchFinished = room.status === "FINISHED";

  const filledCount = Object.values(inputs).filter((v) => (v || "").trim().length > 0).length;
  const canPressBuzzer =
    room.currentPhase === "PLAYING" && filledCount >= 3;

  return (
    <main
      className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 sm:px-6 py-8"
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href={links.lobby}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            ← {t.back}
          </Link>
          <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-900/60">
            #{room.roomCode}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs font-medium">
            <Link
              className={`rounded-lg border px-2.5 py-1 transition ${
                lang === "en"
                  ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold"
                  : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
              }`}
              href={links.en}
            >
              EN
            </Link>
            <Link
              className={`rounded-lg border px-2.5 py-1 transition ${
                lang === "ar"
                  ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold"
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
              <span className="text-2xl animate-bounce">🚌</span>
              <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-50">{room.title}</h1>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {t.round} {room.roundNumber} · {t.targetScore}:{" "}
              <strong className="text-zinc-900 dark:text-zinc-100">{room.scoreLimit} pts</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Live Countdown Badge */}
            {countdownRemaining !== null && (
              <span className="rounded-full bg-red-500 text-white px-3 py-1 text-xs font-black font-mono animate-bounce ring-4 ring-red-400/40 shadow-lg">
                ⏱️ {countdownRemaining}s
              </span>
            )}

            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                room.status === "WAITING"
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                  : room.currentPhase === "COUNTDOWN"
                  ? "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 animate-pulse"
                  : room.currentPhase === "REVIEW"
                  ? "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300"
                  : isRoundOver
                  ? "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
              }`}
            >
              {room.status === "WAITING"
                ? t.waiting
                : room.currentPhase === "COUNTDOWN"
                ? "Countdown!"
                : room.currentPhase === "REVIEW"
                ? t.reviewPhase
                : isRoundOver
                ? t.roundOver
                : t.playing}
            </span>
          </div>
        </div>

        {/* WAITING STATE */}
        {room.status === "WAITING" && (
          <div className="mt-5 space-y-4 text-center py-6">
            <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-3xl">
              🚌
            </div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{t.waiting}</h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
              Share code <strong className="font-mono text-emerald-600 dark:text-emerald-400">#{room.roomCode}</strong> with friends.
              <span className="block mt-1 text-amber-600 dark:text-amber-400 font-semibold">
                ⚠️ {t.minPlayersNotice}
              </span>
            </p>

            {selfPlayer.isHost && (
              <div className="pt-2 max-w-sm mx-auto">
                <button
                  type="button"
                  disabled={busy || !canStart}
                  onClick={onStartGame}
                  className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-500 px-6 py-3.5 font-bold text-white hover:opacity-95 transition disabled:opacity-50 cursor-pointer shadow-lg shadow-emerald-600/20"
                >
                  {t.startTable} ({playerCount}/10 Players)
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* AUTOBUS COUNTDOWN SIREN BANNER */}
      {room.currentPhase === "COUNTDOWN" && (
        <section className="rounded-3xl border-2 border-red-500/50 bg-red-500/10 p-4 text-center space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-center gap-2 text-sm sm:text-base font-black text-red-600 dark:text-red-300 animate-pulse">
            <span className="text-2xl animate-bounce">🚨</span>
            <span>
              {room.autobusPresserName} {t.countdownBanner} ({countdownRemaining ?? 0}s left!)
            </span>
          </div>
        </section>
      )}

      {/* ACTIVE TYPING PHASE */}
      {isPlayingOrCountdown && (
        <div className="space-y-6">
          {/* Round Letter Banner & Autobus Buzzer */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-3xl border-2 border-emerald-500/40 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-amber-500/10 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center">
                <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">
                  {t.currentLetterTitle}
                </span>
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-amber-500 text-white flex items-center justify-center font-black text-3xl sm:text-4xl shadow-xl ring-4 ring-emerald-400/40">
                  {room.currentLetter}
                </div>
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-zinc-900 dark:text-zinc-50">
                  {lang === "ar"
                    ? `اكتب كلمات تبدأ بحرف [ ${room.currentLetter} ]`
                    : `Type words starting with letter [ ${room.currentLetter} ]`}
                </h3>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {filledCount}/7 {lang === "ar" ? "خانات مكتملة" : "categories filled"}
                </span>
              </div>
            </div>

            {/* THE AUTOBUS COMPLETE BUZZER */}
            {room.currentPhase === "PLAYING" && (
              <button
                type="button"
                disabled={busy || !canPressBuzzer}
                onClick={onPressAutobusBuzzer}
                className="rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-orange-500 px-6 sm:px-8 py-4 text-sm sm:text-base font-black text-white shadow-2xl hover:scale-105 transition disabled:opacity-50 cursor-pointer ring-4 ring-red-400/40 shadow-red-500/30 animate-pulse flex items-center gap-2"
              >
                <span>{t.autobusBuzzer}</span>
              </button>
            )}
          </div>

          {/* 7 Category Input Cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {AUTOBUS_CATEGORIES.map((cat) => {
              const currentVal = inputs[cat.id] || "";
              const isValid =
                currentVal.trim().length > 0 &&
                doesWordStartWithLetter(currentVal, room.currentLetter);

              return (
                <div
                  key={cat.id}
                  className={`rounded-2xl border p-4 transition shadow-sm ${
                    isValid
                      ? "border-emerald-500 bg-emerald-500/5 dark:bg-emerald-950/20 ring-1 ring-emerald-500/30"
                      : currentVal.trim().length > 0
                      ? "border-red-400 bg-red-500/5"
                      : "border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{cat.icon}</span>
                      <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                        {lang === "ar" ? cat.labelAr : cat.labelEn}
                      </span>
                    </div>
                    {currentVal.trim().length > 0 && (
                      <span
                        className={`text-xs font-bold ${
                          isValid ? "text-emerald-500" : "text-red-500"
                        }`}
                      >
                        {isValid ? "✓" : "✗"}
                      </span>
                    )}
                  </div>

                  <input
                    type="text"
                    value={currentVal}
                    placeholder={`بحرف ${room.currentLetter}...`}
                    onChange={(e) => onInputChange(cat.id, e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              );
            })}
          </div>

          {/* Save / Submit Draft button */}
          <div className="flex justify-center pt-2">
            <button
              type="button"
              disabled={busy}
              onClick={onSubmitAnswers}
              className="rounded-2xl bg-zinc-900 dark:bg-zinc-100 px-6 py-2.5 text-xs font-bold text-white dark:text-zinc-900 hover:opacity-90 transition cursor-pointer shadow-md"
            >
              💾 {t.submitAnswers}
            </button>
          </div>
        </div>
      )}

      {/* REVIEW & EVALUATION PHASE (Comparing all players' answers) */}
      {(isReviewPhase || isRoundOver) && (
        <section className="rounded-3xl border-2 border-sky-400/50 bg-white/90 dark:bg-zinc-900/90 p-5 sm:p-6 shadow-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <div>
              <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <span>📋</span>
                <span>{t.reviewPhase}</span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Letter: <strong className="text-emerald-500 text-sm">[ {room.currentLetter} ]</strong> · 10 pts for unique words, 5 pts for duplicates
              </p>
            </div>

            {/* Host Confirm Scores button */}
            {isReviewPhase && selfPlayer.isHost && (
              <button
                type="button"
                disabled={busy}
                onClick={onConfirmScores}
                className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-xs font-black text-white hover:opacity-95 transition shadow-lg shadow-emerald-600/20 cursor-pointer"
              >
                ✅ {t.confirmScores}
              </button>
            )}
          </div>

          {/* Side-by-side Review Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {room.players.map((player) => {
              const evalData = player.evaluation;

              return (
                <div
                  key={player.id}
                  className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/80 p-4 space-y-2.5"
                >
                  <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                    <span className="text-xs font-black text-zinc-900 dark:text-zinc-100">
                      {player.displayName}
                    </span>
                    <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg">
                      +{evalData?.totalRoundPoints || player.roundPoints} pts
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {AUTOBUS_CATEGORIES.map((cat) => {
                      const catScore = evalData?.categoryScores[cat.id];
                      const word = player.answers[cat.id] || "";

                      return (
                        <div
                          key={cat.id}
                          className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/60"
                        >
                          <span className="text-zinc-500 font-bold flex items-center gap-1">
                            <span>{cat.icon}</span>
                            <span className="text-[11px]">{lang === "ar" ? cat.labelAr : cat.labelEn}</span>
                          </span>

                          <div className="flex items-center gap-2">
                            <span
                              className={`font-semibold ${
                                word ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 italic"
                              }`}
                            >
                              {word || "-"}
                            </span>

                            {catScore && (
                              <span
                                className={`text-[10px] font-black rounded-md px-1.5 py-0.5 ${
                                  catScore.points === 10
                                    ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                                    : catScore.points === 5
                                    ? "bg-sky-500/20 text-sky-600 dark:text-sky-400"
                                    : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400"
                                }`}
                              >
                                +{catScore.points}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Host Next Round / Replay Buttons */}
          {isRoundOver && selfPlayer.isHost && (
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
                  className="w-full rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-500 transition cursor-pointer shadow-lg shadow-emerald-600/20"
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
              const isSelf = p.id === selfPlayer.id;

              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-2xl border p-3 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {p.displayName} {isSelf && (lang === "ar" ? "(أنت)" : "(You)")}
                    </span>
                    {p.isHost && (
                      <span className="rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-bold">
                        Host
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                      {p.score}{" "}
                      <span className="text-xs font-normal text-zinc-400">
                        / {room.scoreLimit} pts
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
              <p className="text-xs text-zinc-400 italic">No activity logged yet.</p>
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
