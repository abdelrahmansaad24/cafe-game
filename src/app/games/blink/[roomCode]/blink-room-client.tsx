"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PlayerBadge } from "@/components/player-badge";

type BlinkPlayer = {
  id: string;
  userId: string;
  displayName: string;
  score: number;
  isHost: boolean;
  isBlinker: boolean | null;
  roleRevealed: boolean;
  isReady: boolean;
  isWinked: boolean;
  winkedAt: string | null;
};

type BlinkAction = {
  id: string;
  type: string;
  value: string | null;
  details: string | null;
  actorId: string | null;
  createdAt: string;
};

type BlinkRoomState = {
  id: string;
  roomCode: string;
  title: string;
  visibility: "PUBLIC" | "PRIVATE";
  scoreLimit: number;
  status: "WAITING" | "PLAYING" | "FINISHED";
  currentPhase: "ROLE_REVEAL" | "BLINKING" | "GUESSING" | "ROUND_OVER" | "FINISHED";
  roundNumber: number;
  blinkerPlayerId: string | null;
  survivorPlayerId: string | null;
  guessTargetPlayerId: string | null;
  roundWinnerPlayerId: string | null;
  roundResultSummary: string | null;
  createdById: string;
  winnerId: string | null;
  createdAt: string;
  players: BlinkPlayer[];
  actions: BlinkAction[];
};

type SelfPlayer = {
  id: string;
  userId: string;
  displayName: string;
  score: number;
  isHost: boolean;
  isBlinker: boolean;
  roleRevealed: boolean;
  isReady: boolean;
  isWinked: boolean;
};

type RoomPayload = {
  room: BlinkRoomState;
  selfPlayer: SelfPlayer;
};

type Dictionary = {
  back: string;
  room: string;
  waiting: string;
  playing: string;
  finished: string;
  round: string;
  threshold: string;
  minPlayersNotice: string;
  startGame: string;
  nextRound: string;
  playAgain: string;
  leaveRoom: string;
  revealRolePrompt: string;
  holdToReveal: string;
  hideRole: string;
  youAreBlinker: string;
  blinkerInstructions: string;
  youAreInnocent: string;
  innocentInstructions: string;
  iKnowMyRole: string;
  waitingForOthers: string;
  readyPlayers: string;
  blinkingPhaseTitle: string;
  blinkingPhaseDesc: string;
  iGotWinked: string;
  youGotWinkedNotice: string;
  remainingAlive: string;
  guessingPhaseTitle: string;
  guessingPhaseDescSurvivor: string;
  guessingPhaseDescOther: string;
  selectSuspect: string;
  submitGuess: string;
  roundWinner: string;
  matchWinner: string;
  players: string;
  actions: string;
  loading: string;
  language: string;
  english: string;
  arabic: string;
  you: string;
  host: string;
};

const DICTIONARY: Record<"en" | "ar", Dictionary> = {
  en: {
    back: "Back to Lobby",
    room: "Room",
    waiting: "Waiting for Players",
    playing: "Match in Progress",
    finished: "Match Over",
    round: "Round",
    threshold: "Goal",
    minPlayersNotice: "Requires at least 3 players to start غمازة (Blink).",
    startGame: "Start Game (Round 1)",
    nextRound: "Start Next Round",
    playAgain: "Play Again (Reset Scores)",
    leaveRoom: "Leave Room",
    revealRolePrompt: "Tap or hold to reveal your secret role:",
    holdToReveal: "👁️ Reveal My Secret Role",
    hideRole: "🙈 Hide Role",
    youAreBlinker: "YOU ARE THE BLINKER! 😉",
    blinkerInstructions:
      "Your mission: Secretly wink at other players in real life without getting caught! If only 1 innocent survivor is left, they will try to guess your identity.",
    youAreInnocent: "YOU ARE AN INNOCENT PLAYER 👤",
    innocentInstructions:
      "Watch everyone closely! If the Blinker winks at you, press 'I got winked!'. If you survive until the end, you get to guess who the Blinker is!",
    iKnowMyRole: "✅ I Know My Role & Ready",
    waitingForOthers: "Waiting for other players to acknowledge their roles...",
    readyPlayers: "Players Ready",
    blinkingPhaseTitle: "😉 The Game is ON! Blinking Phase",
    blinkingPhaseDesc:
      "The Blinker is winking at players in real life. If someone winks at you, click the button below!",
    iGotWinked: "😵 I Got Winked / انغمزت!",
    youGotWinkedNotice: "You were winked! You are out for this round. Stay quiet and watch the rest unfold! 🤫",
    remainingAlive: "Active Innocents Remaining",
    guessingPhaseTitle: "🕵️‍♂️ Final Showdown: Guess the Blinker!",
    guessingPhaseDescSurvivor:
      "You are the last survivor! Select the player you believe is the Blinker:",
    guessingPhaseDescOther:
      "Only the last survivor is left! They are currently guessing who the Blinker is...",
    selectSuspect: "Choose who you think is the Blinker:",
    submitGuess: "Submit Accusation 🎯",
    roundWinner: "Round Winner",
    matchWinner: "🏆 MATCH CHAMPION 🏆",
    players: "Players & Scoreboard",
    actions: "Live Action Log",
    loading: "Loading room...",
    language: "Language",
    english: "English",
    arabic: "العربية",
    you: "(You)",
    host: "Host",
  },
  ar: {
    back: "العودة للقائمة",
    room: "الغرفة",
    waiting: "في انتظار اكتمال اللاعبين",
    playing: "المباراة جارية",
    finished: "انتهت المباراة",
    round: "الجولة",
    threshold: "الهدف",
    minPlayersNotice: "تحتاج إلى 3 لاعبين على الأقل لبدء لعبة غمازة.",
    startGame: "بدء اللعبة (الجولة الأولى)",
    nextRound: "بدء الجولة التالية",
    playAgain: "لعب مباراة جديدة (تصفير النقاط)",
    leaveRoom: "مغادرة الغرفة",
    revealRolePrompt: "اضغط لكشف دورك السري بحذر:",
    holdToReveal: "👁️ اكشف دوري السري",
    hideRole: "🙈 إخفاء الدور",
    youAreBlinker: "أنت الغماز! 😉",
    blinkerInstructions:
      "مهمتك: اغمز للاعبين في الواقع سراً دون أن يراك أحد! إذا تبقى لاعب بريء واحد، سيحاول تخمين هويتك.",
    youAreInnocent: "أنت لاعب عادي (بريء) 👤",
    innocentInstructions:
      "راقب وجوه الجميع جيداً! إذا غمز لك الغماز، اضغط زر 'انغمزت!'. إذا بقيت حتى النهاية ستخمن من هو الغماز!",
    iKnowMyRole: "✅ عرفت دوري وأنا جاهز",
    waitingForOthers: "في انتظار بقية اللاعبين لمعرفة أدوارهم...",
    readyPlayers: "اللاعبون الجاهزون",
    blinkingPhaseTitle: "😉 بدأت مرحلة الغمز الحقيقي!",
    blinkingPhaseDesc:
      "الغماز يغمز للاعبين في الواقع الآن. إذا غمز لك أحدهم، اضغط الزر أدناه فوراً!",
    iGotWinked: "😵 تم غمزى! / انغمزت!",
    youGotWinkedNotice: "لقد تم غمزك! أنت مستبعد لهذه الجولة. التزم الصمت وتابع الإثارة! 🤫",
    remainingAlive: "اللاعبون الأبرياء الصامدون",
    guessingPhaseTitle: "🕵️‍♂️ مرحلة التخمين وكشف الغماز!",
    guessingPhaseDescSurvivor:
      "أنت الصامد الأخير! اختر اللاعب الذي تعتقد أنه هو الغماز:",
    guessingPhaseDescOther:
      "تبقى لاعب بريء واحد فقط! هو الآن يختار ويخمن من هو الغماز...",
    selectSuspect: "اختر من تشك أنه الغماز:",
    submitGuess: "تأكيد التخمين 🎯",
    roundWinner: "فائز الجولة",
    matchWinner: "🏆 بطل المباراة 🏆",
    players: "اللاعبون ولوحة النقاط",
    actions: "سجل أحداث اللعبة",
    loading: "جارٍ تحميل الغرفة...",
    language: "اللغة",
    english: "English",
    arabic: "العربية",
    you: "(أنت)",
    host: "المضيف",
  },
};

// Web Audio sound triggers for rich feedback
function playSound(type: "wink" | "ready" | "win" | "click") {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === "click") {
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === "wink") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.3);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === "ready") {
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === "win") {
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
      osc.frequency.setValueAtTime(1046.5, now + 0.35); // C6
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.6);
    }
  } catch {
    // Ignore audio errors
  }
}

export default function BlinkRoomClient({ roomCode }: { roomCode: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") === "ar" ? "ar" : "en";
  const t = DICTIONARY[lang];

  const [roomData, setRoomData] = useState<RoomPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showRole, setShowRole] = useState(false);
  const [selectedGuessId, setSelectedGuessId] = useState<string>("");

  const links = useMemo(
    () => ({
      lobby: `/games/blink?lang=${lang}`,
      en: `/games/blink/${roomCode}?lang=en`,
      ar: `/games/blink/${roomCode}?lang=ar`,
    }),
    [lang, roomCode],
  );

  // Poll room state
  useEffect(() => {
    let running = true;

    const load = async () => {
      const response = await fetch(`/api/games/blink/rooms/${roomCode}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as RoomPayload & { error?: string };
      if (!running) return;

      if (!response.ok || !data.room || !data.selfPlayer) {
        setError(data.error ?? "Could not load room.");
      } else {
        setRoomData({ room: data.room, selfPlayer: data.selfPlayer });
        setError(null);
      }
      setLoading(false);
    };

    load().catch((err) => {
      if (running) {
        setError(err instanceof Error ? err.message : "Could not load room.");
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

  async function callAction(payload: { type: string; [key: string]: unknown }) {
    setBusy(true);
    playSound("click");
    const response = await fetch(`/api/games/blink/rooms/${roomCode}/action`, {
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

    // Refresh state immediately
    const refreshRes = await fetch(`/api/games/blink/rooms/${roomCode}`, {
      cache: "no-store",
    });
    if (refreshRes.ok) {
      const refreshed = (await refreshRes.json()) as RoomPayload;
      setRoomData(refreshed);
    }
  }

  const onStartGame = async () => {
    setBusy(true);
    const response = await fetch(`/api/games/blink/rooms/${roomCode}/start`, {
      method: "POST",
    });
    const data = (await response.json()) as { error?: string; ok?: boolean };
    setBusy(false);
    if (!response.ok) {
      setError(data.error ?? "Could not start game.");
      return;
    }
    playSound("ready");
    setShowRole(false);
  };

  const onRevealRole = () => {
    setShowRole(!showRole);
    if (!roomData?.selfPlayer.roleRevealed) {
      callAction({ type: "REVEAL_ROLE" });
    }
  };

  const onConfirmReady = () => {
    playSound("ready");
    callAction({ type: "READY" });
  };

  const onGotWinked = () => {
    playSound("wink");
    callAction({ type: "GOT_WINKED" });
  };

  const onSubmitGuess = () => {
    if (!selectedGuessId) return;
    callAction({ type: "MAKE_GUESS", guessedPlayerId: selectedGuessId });
    playSound("ready");
  };

  const onNextRound = () => {
    setShowRole(false);
    setSelectedGuessId("");
    callAction({ type: "NEXT_ROUND" });
  };

  const onReplay = () => {
    setShowRole(false);
    setSelectedGuessId("");
    callAction({ type: "REPLAY" });
  };

  const onLeaveRoom = () => {
    callAction({ type: "LEAVE" });
  };

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-4xl items-center justify-center px-6 py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-600 border-t-transparent" />
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">{t.loading}</p>
        </div>
      </main>
    );
  }

  if (error || !roomData) {
    return (
      <main className="mx-auto w-full max-w-4xl px-6 py-12">
        <div className="rounded-3xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-6 text-center">
          <p className="text-red-700 dark:text-red-300 font-bold">{error ?? "Room not available."}</p>
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
  const canStart = selfPlayer.isHost && room.status === "WAITING" && room.players.length >= 3;
  const readyCount = room.players.filter((p) => p.isReady).length;
  const totalPlayers = room.players.length;

  // Active innocence count in blinking phase
  const activeInnocents = room.players.filter((p) => !p.isWinked && !p.isBlinker);
  const isSurvivor = room.survivorPlayerId === selfPlayer.id;
  const isRoundOver = room.currentPhase === "ROUND_OVER" || room.currentPhase === "FINISHED";
  const isMatchFinished = room.status === "FINISHED" || room.currentPhase === "FINISHED";

  const matchWinnerPlayer = isMatchFinished
    ? room.players.find((p) => p.userId === room.winnerId)
    : null;

  return (
    <main
      className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-5 px-4 sm:px-6 py-8"
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
                ? "border-rose-600 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-bold"
                : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
            href={links.en}
          >
            EN
          </Link>
          <Link
            className={`rounded-lg border px-2.5 py-1 transition ${
              lang === "ar"
                ? "border-rose-600 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-bold"
                : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
            href={links.ar}
          >
            عربي
          </Link>
        </div>
      </div>

      {/* Main Game Info Card */}
      <section className="rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 p-5 sm:p-6 shadow-sm backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">😉</span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
                {room.title}
              </h1>
            </div>
            <p className="mt-1 font-mono text-xs text-zinc-500 dark:text-zinc-400">
              {t.room}: <span className="font-bold text-rose-600 dark:text-rose-400">#{room.roomCode}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-700 dark:text-rose-300">
              {t.round} {room.roundNumber}
            </span>
            <span className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 text-xs font-bold text-zinc-800 dark:text-zinc-200">
              🎯 {t.threshold}: {room.scoreLimit} pts
            </span>
          </div>
        </div>

        {/* WAITING LOBBY STATE */}
        {room.status === "WAITING" && (
          <div className="mt-5 space-y-4 text-center py-4">
            <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-3xl">
              👥
            </div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{t.waiting}</h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
              Share code <strong className="font-mono text-rose-600 dark:text-rose-400">#{room.roomCode}</strong> with your friends at the cafe.
              {room.players.length < 3 && (
                <span className="block mt-1 text-amber-600 dark:text-amber-400 font-semibold">
                  ⚠️ {t.minPlayersNotice}
                </span>
              )}
            </p>

            {selfPlayer.isHost && (
              <button
                type="button"
                disabled={busy || room.players.length < 3}
                onClick={onStartGame}
                className="mt-2 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 px-6 py-3 font-bold text-white hover:from-rose-500 hover:to-pink-500 transition disabled:opacity-50 cursor-pointer shadow-lg shadow-rose-600/20"
              >
                {t.startGame} ({room.players.length}/3+ Players)
              </button>
            )}
          </div>
        )}

        {/* PHASE 1: ROLE REVEAL & READY */}
        {room.status === "PLAYING" && room.currentPhase === "ROLE_REVEAL" && (
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-center">
              <p className="text-xs sm:text-sm font-semibold text-amber-800 dark:text-amber-200">
                🔒 {t.revealRolePrompt}
              </p>
            </div>

            {/* Privacy Shield Button */}
            <div className="flex flex-col items-center justify-center gap-3 py-2">
              <button
                type="button"
                onClick={onRevealRole}
                className={`w-full max-w-sm rounded-2xl border p-4 font-bold text-base transition cursor-pointer shadow-sm ${
                  showRole
                    ? "border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                    : "border-rose-500 bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-rose-600/20 hover:opacity-95"
                }`}
              >
                {showRole ? t.hideRole : t.holdToReveal}
              </button>

              {/* Secret Role Modal Card */}
              {showRole && (
                <div
                  className={`w-full max-w-sm rounded-3xl border-2 p-6 text-center shadow-xl animate-in fade-in zoom-in duration-150 ${
                    selfPlayer.isBlinker
                      ? "border-rose-500 bg-rose-500/10 text-rose-950 dark:text-rose-100 shadow-rose-500/20"
                      : "border-sky-500 bg-sky-500/10 text-sky-950 dark:text-sky-100 shadow-sky-500/20"
                  }`}
                >
                  <div className="text-5xl mb-3">{selfPlayer.isBlinker ? "😉" : "👤"}</div>
                  <h3 className="text-xl font-extrabold mb-2">
                    {selfPlayer.isBlinker ? t.youAreBlinker : t.youAreInnocent}
                  </h3>
                  <p className="text-xs sm:text-sm font-medium leading-relaxed opacity-90 mb-4">
                    {selfPlayer.isBlinker ? t.blinkerInstructions : t.innocentInstructions}
                  </p>

                  {!selfPlayer.isReady && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={onConfirmReady}
                      className="w-full rounded-xl bg-zinc-900 dark:bg-zinc-100 px-4 py-2.5 text-xs font-bold text-white dark:text-zinc-900 hover:opacity-90 transition cursor-pointer"
                    >
                      {t.iKnowMyRole}
                    </button>
                  )}
                </div>
              )}

              {selfPlayer.isReady && (
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  ✓ {t.iKnowMyRole} · {t.readyPlayers}: {readyCount}/{totalPlayers}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PHASE 2: ACTIVE BLINKING */}
        {room.status === "PLAYING" && room.currentPhase === "BLINKING" && (
          <div className="mt-5 space-y-5 text-center">
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
              <h2 className="text-base sm:text-lg font-extrabold text-rose-800 dark:text-rose-200">
                {t.blinkingPhaseTitle}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                {t.blinkingPhaseDesc}
              </p>
              <div className="mt-2 font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
                {t.remainingAlive}: {activeInnocents.length}
              </div>
            </div>

            {/* BIG POKE / WINK BUTTON */}
            {!selfPlayer.isWinked ? (
              <div className="py-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={onGotWinked}
                  className="group relative w-full max-w-sm mx-auto flex flex-col items-center justify-center gap-2 rounded-3xl border-4 border-rose-600 bg-gradient-to-b from-rose-500 to-pink-600 p-8 text-white font-extrabold shadow-2xl shadow-rose-600/40 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
                >
                  <span className="text-5xl group-hover:animate-bounce">😵</span>
                  <span className="text-2xl tracking-wide">{t.iGotWinked}</span>
                  <span className="text-[11px] font-normal opacity-80">
                    (Click as soon as someone signs/winks to you)
                  </span>
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-5 text-center">
                <span className="text-4xl">👻</span>
                <p className="mt-2 text-sm font-bold text-zinc-700 dark:text-zinc-300">
                  {t.youGotWinkedNotice}
                </p>
              </div>
            )}
          </div>
        )}

        {/* PHASE 3: FINAL GUESSING */}
        {room.status === "PLAYING" && room.currentPhase === "GUESSING" && (
          <div className="mt-5 space-y-5">
            <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4 text-center">
              <h2 className="text-base sm:text-lg font-extrabold text-indigo-900 dark:text-indigo-200">
                {t.guessingPhaseTitle}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                {isSurvivor ? t.guessingPhaseDescSurvivor : t.guessingPhaseDescOther}
              </p>
            </div>

            {/* Survivor Guess Interface */}
            {isSurvivor ? (
              <div className="space-y-4 max-w-md mx-auto">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  {t.selectSuspect}
                </label>
                <div className="grid gap-2">
                  {room.players
                    .filter((p) => p.id !== selfPlayer.id)
                    .map((player) => (
                      <button
                        key={player.id}
                        type="button"
                        onClick={() => setSelectedGuessId(player.id)}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border text-sm font-bold transition cursor-pointer ${
                          selectedGuessId === player.id
                            ? "border-indigo-600 bg-indigo-600/15 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500"
                            : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 hover:border-indigo-400"
                        }`}
                      >
                        <PlayerBadge
                          name={player.displayName}
                          playerId={player.id}
                          userId={player.userId}
                          size="md"
                          lang={lang}
                        />
                        <span>{selectedGuessId === player.id ? "🎯 Selected" : "Select"}</span>
                      </button>
                    ))}
                </div>

                <button
                  type="button"
                  disabled={busy || !selectedGuessId}
                  onClick={onSubmitGuess}
                  className="w-full rounded-2xl bg-indigo-600 px-6 py-3.5 font-bold text-white hover:bg-indigo-500 transition disabled:opacity-50 cursor-pointer shadow-lg shadow-indigo-600/20"
                >
                  {t.submitGuess}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mb-3" />
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  {t.guessingPhaseDescOther}
                </p>
              </div>
            )}
          </div>
        )}

        {/* PHASE 4 & 5: ROUND OVER & MATCH VICTORY */}
        {isRoundOver && (
          <div className="mt-5 space-y-4 text-center">
            {isMatchFinished ? (
              <div className="rounded-3xl border-2 border-amber-500 bg-amber-500/10 p-6 shadow-xl shadow-amber-500/20">
                <div className="text-5xl mb-2">🏆👑🎉</div>
                <h2 className="text-2xl sm:text-3xl font-black text-amber-900 dark:text-amber-200">
                  {t.matchWinner}
                </h2>
                <div className="mt-3">
                  {matchWinnerPlayer && (
                    <PlayerBadge
                      name={matchWinnerPlayer.displayName}
                      playerId={matchWinnerPlayer.id}
                      userId={matchWinnerPlayer.userId}
                      isSelf={matchWinnerPlayer.userId === selfPlayer.userId}
                      size="lg"
                      score={matchWinnerPlayer.score}
                      scoreSuffix="pts"
                      lang={lang}
                    />
                  )}
                </div>
                <p className="mt-3 text-sm text-amber-800 dark:text-amber-300 font-medium">
                  {room.roundResultSummary}
                </p>

                {selfPlayer.isHost && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={onReplay}
                    className="mt-5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 font-bold text-white hover:opacity-95 transition cursor-pointer shadow-md shadow-amber-500/30"
                  >
                    {t.playAgain}
                  </button>
                )}
              </div>
            ) : (
              <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-6">
                <div className="text-4xl mb-2">🏁</div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  Round {room.roundNumber} Complete!
                </h3>
                <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300 font-medium">
                  {room.roundResultSummary}
                </p>

                {selfPlayer.isHost && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={onNextRound}
                    className="mt-4 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 px-6 py-3 font-bold text-white hover:from-rose-500 hover:to-pink-500 transition cursor-pointer shadow-md shadow-rose-600/20"
                  >
                    {t.nextRound} →
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {error && (
        <p className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-3.5 text-xs text-red-700 dark:text-red-300 font-medium">
          {error}
        </p>
      )}

      {/* Players List & Scoreboard */}
      <section className="rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {t.players}
          </h2>
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            {room.players.length} Players
          </span>
        </div>

        <div className="grid gap-2.5">
          {room.players
            .slice()
            .sort((a, b) => b.score - a.score)
            .map((player) => {
              const isSelf = player.id === selfPlayer.id;
              const isSurvivorPlayer = player.id === room.survivorPlayerId;
              const isRoundWinner = player.id === room.roundWinnerPlayerId;

              let statusText = null;
              let statusColor = undefined;

              if (isRoundOver && player.isBlinker) {
                statusText = "😉 Blinker";
                statusColor = "text-rose-600 dark:text-rose-400";
              } else if (player.isWinked) {
                statusText = "😵 Winked Out";
                statusColor = "text-red-500 dark:text-red-400";
              } else if (room.currentPhase === "BLINKING") {
                statusText = "👀 Active";
                statusColor = "text-emerald-600 dark:text-emerald-400";
              }

              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between rounded-2xl border p-3.5 text-sm transition ${
                    isRoundWinner
                      ? "border-amber-500 bg-amber-500/10 shadow-sm"
                      : isSurvivorPlayer
                        ? "border-indigo-500 bg-indigo-500/10"
                        : player.isWinked
                          ? "opacity-60 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950"
                          : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <PlayerBadge
                      name={player.displayName}
                      playerId={player.id}
                      userId={player.userId}
                      isSelf={isSelf}
                      isHost={player.isHost}
                      statusBadge={statusText}
                      statusColor={statusColor}
                      size="md"
                      lang={lang}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Score towards threshold */}
                    <div className="flex items-center gap-1.5 font-mono font-bold text-xs text-zinc-700 dark:text-zinc-300">
                      <span className="text-sm font-extrabold text-rose-600 dark:text-rose-400">
                        {player.score}
                      </span>
                      <span className="opacity-60">/ {room.scoreLimit} pts</span>
                    </div>

                    {isRoundWinner && <span className="text-lg">🏆</span>}
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      {/* Live Action Log */}
      <section className="rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 p-5 sm:p-6 shadow-sm">
        <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-3">
          {t.actions}
        </h2>
        <div className="grid gap-2 max-h-60 overflow-y-auto">
          {room.actions.map((action) => (
            <div
              key={action.id}
              className="rounded-xl border border-zinc-100 dark:border-zinc-800/60 p-2.5 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950/60"
            >
              <span className="font-mono font-bold text-zinc-900 dark:text-zinc-200">
                {action.type}
              </span>
              {action.value && (
                <span className="ml-1.5 font-mono font-bold text-rose-600 dark:text-rose-400">
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
