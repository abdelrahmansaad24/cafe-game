"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { PlayerBadge } from "@/components/player-badge";

type RoomPlayer = {
  id: string;
  userId: string;
  displayName: string;
  turnOrder: number;
  penaltyScore: number;
  isHost: boolean;
  eliminatedAt: string | null;
};

type RoomAction = {
  id: string;
  type: string;
  value: string | null;
  success: boolean | null;
  details: string | null;
  actorId: string | null;
  createdAt: string;
};

type RoomState = {
  roomCode: string;
  title: string;
  status: "WAITING" | "PLAYING" | "FINISHED";
  scoreLimit: number;
  turnTimerSeconds?: number | null;
  turnStartedAt?: string | null;
  usedWords: string[];
  currentWord: string;
  currentTurnPlayerId: string | null;
  previousTurnPlayerId: string | null;
  challengeByPlayerId: string | null;
  challengeTargetPlayerId: string | null;
  challengePrefix: string | null;
  createdById: string;
  winnerId: string | null;
  players: RoomPlayer[];
  actions: RoomAction[];
};

type Dictionary = {
  back: string;
  room: string;
  waiting: string;
  playing: string;
  finished: string;
  scoreLimit: string;
  turnTimer: string;
  timeRemaining: string;
  currentWord: string;
  usedWords: string;
  noUsedWords: string;
  turn: string;
  startGame: string;
  playAgain: string;
  leaveRoom: string;
  addCharacter: string;
  finishWithChar: string;
  suspect: string;
  completeChallenge: string;
  submit: string;
  challengePrefix: string;
  players: string;
  eliminated: string;
  actions: string;
  loading: string;
  language: string;
  english: string;
  arabic: string;
  you: string;
};

const DICTIONARY: Record<"en" | "ar", Dictionary> = {
  en: {
    back: "Back to lobby",
    room: "Room",
    waiting: "Waiting for players",
    playing: "In Progress",
    finished: "Game Over",
    scoreLimit: "Penalty limit",
    turnTimer: "Turn timer",
    timeRemaining: "Time remaining",
    currentWord: "Current word",
    usedWords: "Used countries in this game",
    noUsedWords: "No countries used yet.",
    turn: "Current turn",
    startGame: "Start Game",
    playAgain: "Play Again (Replay)",
    leaveRoom: "Leave Room",
    addCharacter: "Add Letter",
    finishWithChar: "Finish Word (with this letter)",
    suspect: "Suspect Previous Player",
    completeChallenge: "Complete Challenged Word",
    submit: "Submit",
    challengePrefix: "Challenge Prefix",
    players: "Players & Penalties",
    eliminated: "Eliminated ❌",
    actions: "Action Log",
    loading: "Loading room...",
    language: "Language",
    english: "English",
    arabic: "العربية",
    you: "(You)",
  },
  ar: {
    back: "العودة للغرف",
    room: "الغرفة",
    waiting: "في انتظار اللاعبين",
    playing: "اللعبة جارية",
    finished: "انتهت اللعبة",
    scoreLimit: "حد النقاط الخاسرة",
    turnTimer: "مؤقت الدور",
    timeRemaining: "الوقت المتبقي",
    currentWord: "الكلمة الحالية",
    usedWords: "الدول المستخدمة في هذه الجولة",
    noUsedWords: "لم تُستخدم أي دولة بعد.",
    turn: "الدور الحالي",
    startGame: "ابدأ اللعبة",
    playAgain: "العب مرة أخرى (إعادة)",
    leaveRoom: "مغادرة الغرفة",
    addCharacter: "إضافة حرف",
    finishWithChar: "إنهاء الكلمة (بهذا الحرف)",
    suspect: "شكّك في اللاعب السابق",
    completeChallenge: "أكمل اسم الدولة",
    submit: "إرسال",
    challengePrefix: "بداية الكلمة",
    players: "اللاعبون والنتائج",
    eliminated: "مستبعد ❌",
    actions: "سجل الأحداث",
    loading: "جارٍ تحميل الغرفة...",
    language: "اللغة",
    english: "English",
    arabic: "العربية",
    you: "(أنت)",
  },
};

type RoomPayload = {
  room: RoomState;
  selfPlayerId: string;
};

function gameStatusLabel(status: RoomState["status"], t: Dictionary) {
  if (status === "WAITING") return t.waiting;
  if (status === "PLAYING") return t.playing;
  return t.finished;
}

type Props = {
  roomCode: string;
};

export default function QuarterMonkeyRoomClient({ roomCode }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") === "ar" ? "ar" : "en";
  const t = DICTIONARY[lang];
  const [roomData, setRoomData] = useState<RoomPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [inputChar, setInputChar] = useState("");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const links = useMemo(
    () => ({
      lobby: `/games/quarter-monkey?lang=${lang}`,
      en: `/games/quarter-monkey/${roomCode}?lang=en`,
      ar: `/games/quarter-monkey/${roomCode}?lang=ar`,
    }),
    [lang, roomCode],
  );

  useEffect(() => {
    let running = true;

    const load = async () => {
      const response = await fetch(`/api/games/quarter-monkey/rooms/${roomCode}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as { room?: RoomState; selfPlayerId?: string; error?: string };
      if (!running) return;

      if (!response.ok || !data.room || !data.selfPlayerId) {
        setError(data.error ?? "Could not load room.");
      } else {
        setRoomData({ room: data.room, selfPlayerId: data.selfPlayerId });
        setError(null);
      }
      setLoading(false);
    };

    load().catch((loadError) => {
      if (running) {
        setError(loadError instanceof Error ? loadError.message : "Could not load room.");
        setLoading(false);
      }
    });

    const intervalId = window.setInterval(() => {
      load().catch(() => undefined);
    }, 2000);

    return () => {
      running = false;
      window.clearInterval(intervalId);
    };
  }, [roomCode]);

  // Turn timer countdown effect
  useEffect(() => {
    if (!roomData?.room || roomData.room.status !== "PLAYING" || !roomData.room.turnTimerSeconds) {
      setTimeLeft(null);
      return;
    }

    const timerLimit = roomData.room.turnTimerSeconds;
    const startedAt = roomData.room.turnStartedAt
      ? new Date(roomData.room.turnStartedAt).getTime()
      : Date.now();

    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = Math.max(0, timerLimit - elapsed);
      setTimeLeft(remaining);

      if (
        remaining === 0 &&
        roomData.room.currentTurnPlayerId === roomData.selfPlayerId &&
        !busy
      ) {
        callAction(`/api/games/quarter-monkey/rooms/${roomCode}/action`, {
          type: "TIMEOUT",
        }).catch(() => undefined);
      }
    };

    updateTimer();
    const interval = window.setInterval(updateTimer, 1000);
    return () => window.clearInterval(interval);
  }, [roomData, roomCode, busy]);

  async function callAction(url: string, payload?: unknown) {
    setBusy(true);
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload ? JSON.stringify(payload) : undefined,
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
    setInputChar("");

    // Refresh state
    const refreshRes = await fetch(`/api/games/quarter-monkey/rooms/${roomCode}`, {
      cache: "no-store",
    });
    if (refreshRes.ok) {
      const refreshed = (await refreshRes.json()) as RoomPayload;
      setRoomData(refreshed);
    }
  }

  const onStartGame = () =>
    callAction(`/api/games/quarter-monkey/rooms/${roomCode}/start`);

  const onAddCharacter = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputChar.trim()) return;
    callAction(`/api/games/quarter-monkey/rooms/${roomCode}/action`, {
      type: "ADD_CHAR",
      character: inputChar.trim(),
    });
  };

  const onFinishWord = () => {
    callAction(`/api/games/quarter-monkey/rooms/${roomCode}/action`, {
      type: "FINISH_WORD",
      character: inputChar.trim() || undefined,
    });
  };

  const onSuspect = () =>
    callAction(`/api/games/quarter-monkey/rooms/${roomCode}/action`, {
      type: "SUSPECT",
    });

  const onCompleteChallenge = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const completedWord = String(form.get("completedWord") ?? "").trim();
    if (!completedWord) return;
    callAction(`/api/games/quarter-monkey/rooms/${roomCode}/action`, {
      type: "COMPLETE_CHALLENGE",
      completedWord,
    });
  };

  const onPlayAgain = () =>
    callAction(`/api/games/quarter-monkey/rooms/${roomCode}/action`, {
      type: "REPLAY",
    });

  const onLeaveRoom = () =>
    callAction(`/api/games/quarter-monkey/rooms/${roomCode}/action`, {
      type: "LEAVE",
    });

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-4xl items-center justify-center px-6 py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="text-zinc-500 dark:text-zinc-400">{t.loading}</p>
        </div>
      </main>
    );
  }

  if (error || !roomData) {
    return (
      <main className="mx-auto w-full max-w-4xl px-6 py-12">
        <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-6 text-center">
          <p className="text-red-700 dark:text-red-300 font-medium">{error ?? "Room not available."}</p>
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
  const selfPlayer = room.players.find((player) => player.id === roomData.selfPlayerId);
  const canStart = selfPlayer?.isHost && room.status === "WAITING" && room.players.length >= 2;
  const isMyTurn = room.currentTurnPlayerId === selfPlayer?.id;
  const isChallengeTarget = room.challengeTargetPlayerId === selfPlayer?.id;
  const turnPlayer = room.players.find((player) => player.id === room.currentTurnPlayerId);
  const winner = room.players.find((player) => player.userId === room.winnerId);

  return (
    <main
      className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-5 px-4 sm:px-6 py-8"
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href={links.lobby}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            ← {t.back}
          </Link>
          <button
            type="button"
            onClick={onLeaveRoom}
            className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 px-3.5 py-1.5 text-xs font-semibold text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/60 transition cursor-pointer"
          >
            {t.leaveRoom}
          </button>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium">
          <span className="text-zinc-500 dark:text-zinc-400">{t.language}:</span>
          <Link
            className={`rounded-lg border px-2.5 py-1 transition ${
              lang === "en"
                ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold"
                : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
            href={links.en}
          >
            EN
          </Link>
          <Link
            className={`rounded-lg border px-2.5 py-1 transition ${
              lang === "ar"
                ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold"
                : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
            href={links.ar}
          >
            عربي
          </Link>
        </div>
      </div>

      {/* Main Room Card */}
      <section className="rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 p-5 sm:p-6 shadow-sm backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🐒</span>
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {room.title}
              </h1>
            </div>
            <p className="mt-1 font-mono text-xs text-zinc-500 dark:text-zinc-400">
              {t.room}: <span className="font-bold text-indigo-600 dark:text-indigo-400">#{room.roomCode}</span>
            </p>
          </div>
          <span className="rounded-full border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50 dark:bg-indigo-950/60 px-3.5 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-300">
            {gameStatusLabel(room.status, t)}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
          <span className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-1.5">
            {t.scoreLimit}: <strong className="text-zinc-900 dark:text-zinc-100">{room.scoreLimit} 🐒</strong>
          </span>
          <span className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-1.5">
            {t.turnTimer}:{" "}
            <strong className="text-zinc-900 dark:text-zinc-100">
              {room.turnTimerSeconds ? `${room.turnTimerSeconds}s` : "♾️"}
            </strong>
          </span>
        </div>

        {/* Word Display & Turn Status */}
        <div className="mt-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-950/80 p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {t.currentWord}
            </p>
            <div className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-wider text-zinc-900 dark:text-zinc-50">
              {room.currentWord ? (
                <span className="font-mono bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-900 dark:text-amber-200 px-4 py-1.5 rounded-xl border border-amber-500/30">
                  {room.currentWord}
                </span>
              ) : (
                <span className="text-zinc-400 dark:text-zinc-600 font-normal text-2xl">—</span>
              )}
            </div>
          </div>

          {room.status === "PLAYING" && (
            <div className="flex flex-col items-end">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {t.turn}
              </p>
              <div className="mt-1">
                {turnPlayer ? (
                  <PlayerBadge
                    name={turnPlayer.displayName}
                    playerId={turnPlayer.id}
                    isSelf={isMyTurn}
                    size="md"
                    lang={lang}
                  />
                ) : (
                  <span>—</span>
                )}
              </div>
              {timeLeft !== null && (
                <p
                  className={`text-xs font-mono font-bold mt-1.5 ${
                    timeLeft <= 5
                      ? "text-red-600 dark:text-red-400 animate-pulse"
                      : "text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  ⏳ {t.timeRemaining}: {timeLeft}s
                </p>
              )}
            </div>
          )}
        </div>

        {winner && (
          <div className="mt-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-5 text-center">
            <h2 className="text-xl sm:text-2xl font-extrabold text-emerald-800 dark:text-emerald-300">
              🏆 Winner: {winner.displayName}!
            </h2>
            <p className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-400 mt-1">
              All other players reached the monkey limit!
            </p>
            {selfPlayer?.isHost && (
              <button
                type="button"
                disabled={busy}
                onClick={onPlayAgain}
                className="mt-4 rounded-xl bg-emerald-600 px-5 py-2.5 font-bold text-white hover:bg-emerald-500 transition disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-600/20"
              >
                {t.playAgain}
              </button>
            )}
          </div>
        )}
      </section>

      {error && (
        <p className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-3 text-xs text-red-700 dark:text-red-300 font-medium">
          {error}
        </p>
      )}

      {canStart && (
        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <button
            type="button"
            disabled={busy}
            onClick={onStartGame}
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white hover:bg-indigo-500 transition cursor-pointer shadow-md shadow-indigo-600/20 disabled:opacity-50"
          >
            {t.startGame}
          </button>
        </section>
      )}

      {/* Turn Action Controls */}
      {room.status === "PLAYING" && isMyTurn && (
        <section className="rounded-3xl border-2 border-indigo-500/80 bg-white dark:bg-zinc-900 p-5 sm:p-6 shadow-lg shadow-indigo-500/10">
          {isChallengeTarget ? (
            <form onSubmit={onCompleteChallenge} className="space-y-4">
              <h2 className="text-lg font-bold text-amber-700 dark:text-amber-400">
                {t.completeChallenge}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                {t.challengePrefix}:{" "}
                <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/30">
                  {room.challengePrefix ?? "—"}
                </span>
              </p>
              <input
                name="completedWord"
                required
                minLength={2}
                maxLength={64}
                placeholder="Complete the full country name..."
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-base text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-500 font-medium"
              />
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white hover:bg-indigo-500 transition disabled:opacity-50 cursor-pointer shadow-md shadow-indigo-600/20"
              >
                {t.submit}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <form onSubmit={onAddCharacter} className="flex flex-col gap-3">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  {t.addCharacter} / Letter:
                </label>
                <div className="flex flex-wrap items-center gap-2.5">
                  <input
                    value={inputChar}
                    onChange={(e) => setInputChar(e.target.value)}
                    maxLength={2}
                    placeholder="A / م"
                    className="w-20 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2.5 text-center text-2xl font-extrabold font-mono uppercase text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={busy || !inputChar.trim()}
                    className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 font-bold text-white hover:bg-indigo-500 transition disabled:opacity-50 cursor-pointer shadow-md shadow-indigo-600/20"
                  >
                    {t.addCharacter}
                  </button>
                  <button
                    type="button"
                    disabled={busy || (!inputChar.trim() && !room.currentWord)}
                    onClick={onFinishWord}
                    className="rounded-xl border border-amber-500/40 bg-amber-500/10 dark:bg-amber-500/20 px-4 py-2.5 font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-500/30 transition disabled:opacity-50 cursor-pointer"
                  >
                    {t.finishWithChar}
                  </button>
                </div>
              </form>

              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3">
                <button
                  type="button"
                  disabled={busy || !room.previousTurnPlayerId}
                  onClick={onSuspect}
                  className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition disabled:opacity-50 cursor-pointer"
                >
                  🤔 {t.suspect}
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Used words list */}
      <section className="rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 p-5 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {t.usedWords}
        </h2>
        {room.usedWords && room.usedWords.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {room.usedWords.map((word, idx) => (
              <span
                key={idx}
                className="rounded-xl bg-zinc-100 dark:bg-zinc-800 px-3 py-1 text-xs font-mono font-medium text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700"
              >
                ✓ {word}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">{t.noUsedWords}</p>
        )}
      </section>

      {/* Players List */}
      <section className="rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 p-5 shadow-sm">
        <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
          {t.players}
        </h2>
        <div className="mt-3 grid gap-2.5">
          {room.players
            .slice()
            .sort((a, b) => a.turnOrder - b.turnOrder)
            .map((player) => {
              const isTurn = player.id === room.currentTurnPlayerId;
              const isEliminated = Boolean(player.eliminatedAt);
              const isSelf = player.id === selfPlayer?.id;
              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between rounded-2xl border p-3 text-sm transition ${
                    isTurn
                      ? "border-indigo-500 bg-indigo-500/5 shadow-sm"
                      : isEliminated
                        ? "opacity-50 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950"
                        : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500">
                      {player.turnOrder}.
                    </span>
                    <PlayerBadge
                      name={player.displayName}
                      playerId={player.id}
                      userId={player.userId}
                      isSelf={isSelf}
                      isHost={player.isHost}
                      size="sm"
                      lang={lang}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-xs text-zinc-700 dark:text-zinc-300">
                      {player.penaltyScore}/{room.scoreLimit} 🐒
                    </span>
                    {isEliminated && (
                      <span className="text-red-600 dark:text-red-400 font-bold text-xs">
                        {t.eliminated}
                      </span>
                    )}
                    {isTurn && <span className="text-base animate-bounce">🎯</span>}
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      {/* Action Log */}
      <section className="rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 p-5 shadow-sm">
        <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
          {t.actions}
        </h2>
        <div className="mt-3 grid gap-2 max-h-60 overflow-y-auto">
          {room.actions.map((action) => (
            <div
              key={action.id}
              className="rounded-xl border border-zinc-100 dark:border-zinc-800/60 p-2.5 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950/60"
            >
              <span className="font-mono font-bold text-zinc-900 dark:text-zinc-200">
                {action.type}
              </span>
              {action.value && (
                <span className="ml-1.5 font-mono font-bold text-amber-700 dark:text-amber-400">
                  [{action.value}]
                </span>
              )}
              {action.details && (
                <span className="ml-2 font-normal">{action.details}</span>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
