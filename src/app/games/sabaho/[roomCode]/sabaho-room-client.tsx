"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ActiveSabahoQuestion } from "@/lib/games/sabaho-types";

type RoomPayload = {
  room: {
    id: string;
    roomCode: string;
    title: string;
    visibility: "PUBLIC" | "PRIVATE";
    status: "WAITING" | "PLAYING" | "FINISHED";
    gameMode: "MIXED" | "AUCTION" | "CAREER_PATH" | "SPEED" | "PASSWORD";
    currentPhase:
      | "AUCTION_BIDDING"
      | "AUCTION_EXECUTION"
      | "CAREER_REVEAL"
      | "CAREER_GUESS"
      | "SPEED_CHALLENGE"
      | "PASSWORD_ROUND"
      | "ROUND_REVIEW"
      | "ROUND_OVER"
      | "FINISHED";
    roundsTotal: number;
    roundNumber: number;
    isTeamPlay: boolean;
    team1Score: number;
    team2Score: number;
    team1Name: string;
    team2Name: string;
    currentTurnPlayerId: string | null;
    clueGiverPlayerId: string | null;
    passwordScore: number;
    activeQuestion: ActiveSabahoQuestion | null;
    activeBuzzerPlayerId: string | null;
    buzzerPlayerName: string | null;
    auctionHighBid: number | null;
    auctionHighBidderName: string | null;
    careerRevealedIndex: number;
    timerEndsAt: string | null;
    timerSeconds: number;
    roundWinnerId: string | null;
    winnerId: string | null;
    winnerTeam: number | null;
    createdById: string;
    players: Array<{
      id: string;
      userId: string;
      displayName: string;
      seatIndex: number;
      team: number;
      score: number;
      roundPoints: number;
      hasPassedBid: boolean;
      isHost: boolean;
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
    team: number;
    score: number;
    isHost: boolean;
    isMyTurn: boolean;
    isBuzzerPlayer: boolean;
    isClueGiver: boolean;
  };
};

type Dictionary = {
  back: string;
  room: string;
  waiting: string;
  round: string;
  startTable: string;
  nextRound: string;
  playAgain: string;
  leaveRoom: string;
  scoreboard: string;
  tableLog: string;
  loading: string;
  auctionTitle: string;
  careerTitle: string;
  speedTitle: string;
  currentHighBid: string;
  placeBid: string;
  passBid: string;
  buzzButton: string;
  revealNextClub: string;
  approveAnswer: string;
  rejectAnswer: string;
  switchTeam1: string;
  switchTeam2: string;
  team1: string;
  team2: string;
  timerRemaining: string;
  passwordTitle: string;
  adminTeamSetup: string;
  saveTeamNames: string;
  correctPasswordBtn: string;
  passPasswordBtn: string;
  passwordClueRule: string;
  typeYourGuess: string;
  submitGuessBtn: string;
  geminiValidating: string;
};

const DICTIONARY: Record<"en" | "ar", Dictionary> = {
  en: {
    back: "Back to Lobby",
    room: "Room",
    waiting: "Waiting for Players",
    round: "Round",
    startTable: "Start Challenge Match",
    nextRound: "Next Challenge Round",
    playAgain: "Play Again (Reset Match)",
    leaveRoom: "Leave Room",
    scoreboard: "Scoreboard",
    tableLog: "Match Activity Log",
    loading: "Loading Sabaho Tahadi Room...",
    auctionTitle: "🔥 المزاد (The Auction)",
    careerTitle: "🎽 مسيرة اللاعب (Career Path)",
    speedTitle: "⚡ تحدي السرعة (Speed Challenge)",
    passwordTitle: "🔐 لعبة كلمة السر (Password Game)",
    currentHighBid: "Highest Bid",
    placeBid: "Bid",
    passBid: "Pass",
    buzzButton: "🚨 BUZZ IN! (اضرب البزر)",
    revealNextClub: "Reveal Next Club (+1)",
    approveAnswer: "✅ Correct Answer (+10 pts)",
    rejectAnswer: "❌ Wrong Answer",
    switchTeam1: "Join Team 1 (Red)",
    switchTeam2: "Join Team 2 (White)",
    team1: "Team A",
    team2: "Team B",
    timerRemaining: "Time Remaining",
    adminTeamSetup: "Custom Team Names (Admin Controls)",
    saveTeamNames: "Save Team Names",
    correctPasswordBtn: "✅ Correct! (+10 pts)",
    passPasswordBtn: "⏭️ Pass (Skip Word)",
    passwordClueRule: "Clue Giver Rule: Say only ONE single word per hint to your teammate!",
    typeYourGuess: "Type the footballer's name to guess...",
    submitGuessBtn: "🎯 Validate with Gemini AI",
    geminiValidating: "Validating with Gemini AI...",
  },
  ar: {
    back: "العودة للقائمة",
    room: "الغرفة",
    waiting: "في انتظار اللاعبين",
    round: "الجولة",
    startTable: "بدء ماتش التحدي",
    nextRound: "الجولة التالية",
    playAgain: "لعب مباراة جديدة (تصفير النقط)",
    leaveRoom: "مغادرة الغرفة",
    scoreboard: "لوحة النتيجة",
    tableLog: "سجل أحداث المباراة",
    loading: "جارٍ تحميل غرفة صباحو تحدي...",
    auctionTitle: "🔥 المزاد (The Auction)",
    careerTitle: "🎽 مسيرة اللاعب (Career Path)",
    speedTitle: "⚡ تحدي السرعة (Speed Challenge)",
    passwordTitle: "🔐 لعبة كلمة السر (Password Game)",
    currentHighBid: "أعلى مزاد حالي",
    placeBid: "مزايدة",
    passBid: "باس (انسحاب)",
    buzzButton: "🚨 اضرب البزر!",
    revealNextClub: "كشف النادي التالي (+١)",
    approveAnswer: "✅ إجابة صحيحة (+١٠ نقط)",
    rejectAnswer: "❌ إجابة خاطئة",
    switchTeam1: "الانتقال لفريق أ (الأحمر)",
    switchTeam2: "الانتقال لفريق ب (الأبيض)",
    team1: "فريق أ",
    team2: "فريق ب",
    timerRemaining: "الوقت المتبقي",
    adminTeamSetup: "تخصيص أسماء الفريقين (تحكم الأدمن)",
    saveTeamNames: "💾 حفظ أسماء الفرق",
    correctPasswordBtn: "✅ صح! (+١٠ نقط)",
    passPasswordBtn: "⏭️ تخطي (Pass)",
    passwordClueRule: "قانون المتكلم: مسموح بكلمة واحدة فقط كتلميح لزميلك في كل محاولة!",
    typeYourGuess: "اكتب اسم اللاعب لتخمينه (مثال: محمد صلاح / ميسي / زيزو)...",
    submitGuessBtn: "🎯 تحقق من التخمين بالذكاء الاصطناعي (Gemini)",
    geminiValidating: "جارٍ التحقق بالذكاء الاصطناعي...",
  },
};

// Web Audio sound effects for Sabaho Tahadi
function playSabahoSound(type: "whistle" | "buzz" | "bid" | "correct" | "wrong" | "fanfare") {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === "whistle") {
      // Authentic high referee whistle: fweeeeeet!
      [2800, 3200].forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.linearRampToValueAtTime(freq + 400, now + 0.3);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      });
    } else if (type === "buzz") {
      // Aggressive TV buzzer BZZZZT!
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(120, now);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === "bid") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === "correct") {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.25, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.2);
      });
    } else if (type === "wrong") {
      [300, 260, 220].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, now + i * 0.12);
        gain.gain.setValueAtTime(0.2, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.12 + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.15);
      });
    } else if (type === "fanfare") {
      [440, 554, 659, 880].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.12);
        gain.gain.setValueAtTime(0.3, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.12 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.35);
      });
    }
  } catch {
    // Ignore audio error
  }
}

export default function SabahoRoomClient({ roomCode }: { roomCode: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") === "ar" ? "ar" : "en";
  const t = DICTIONARY[lang];

  const [roomData, setRoomData] = useState<RoomPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Custom team names state (admin editable)
  const [editableT1, setEditableT1] = useState("");
  const [editableT2, setEditableT2] = useState("");
  const [hasLoadedTeamNames, setHasLoadedTeamNames] = useState(false);

  // Typed player guess for Gemini AI validation
  const [typedGuess, setTypedGuess] = useState("");
  const [guessFeedback, setGuessFeedback] = useState<{ valid: boolean; text: string } | null>(null);
  const [validatingGuess, setValidatingGuess] = useState(false);

  // Custom bid input
  const [customBid, setCustomBid] = useState<number>(3);
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);

  const links = useMemo(
    () => ({
      lobby: `/games/sabaho?lang=${lang}`,
      en: `/games/sabaho/${roomCode}?lang=en`,
      ar: `/games/sabaho/${roomCode}?lang=ar`,
    }),
    [lang, roomCode],
  );

  useEffect(() => {
    let running = true;

    const load = async () => {
      const response = await fetch(`/api/games/sabaho/rooms/${roomCode}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as RoomPayload & { error?: string };
      if (!running) return;

      if (!response.ok || !data.room || !data.selfPlayer) {
        setError(data.error ?? "Could not load room.");
      } else {
        setRoomData({ room: data.room, selfPlayer: data.selfPlayer });
        if (!hasLoadedTeamNames) {
          setEditableT1(data.room.team1Name);
          setEditableT2(data.room.team2Name);
          setHasLoadedTeamNames(true);
        }
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

  // Live timer effect
  useEffect(() => {
    if (!roomData?.room.timerEndsAt) {
      setTimerRemaining(null);
      return;
    }

    const endsAt = new Date(roomData.room.timerEndsAt).getTime();
    const update = () => {
      const rem = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setTimerRemaining(rem);
    };

    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [roomData?.room.timerEndsAt]);

  async function callAction(payload: { type: string; [key: string]: unknown }) {
    setBusy(true);
    const response = await fetch(`/api/games/sabaho/rooms/${roomCode}/action`, {
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
    const refreshRes = await fetch(`/api/games/sabaho/rooms/${roomCode}`, {
      cache: "no-store",
    });
    if (refreshRes.ok) {
      const refreshed = (await refreshRes.json()) as RoomPayload;
      setRoomData(refreshed);
    }
  }

  const onStartGame = async () => {
    setBusy(true);
    const response = await fetch(`/api/games/sabaho/rooms/${roomCode}/start`, {
      method: "POST",
    });
    const data = (await response.json()) as { error?: string; ok?: boolean };
    setBusy(false);
    if (!response.ok) {
      setError(data.error ?? "Could not start game.");
      return;
    }
    playSabahoSound("whistle");
  };

  const onSwitchTeam = (team: 1 | 2) => callAction({ type: "CHANGE_TEAM", team });

  const onPlaceBid = (bid: number) => {
    playSabahoSound("bid");
    callAction({ type: "BID", bid });
  };

  const onPassBid = () => callAction({ type: "PASS_BID" });

  const onSaveTeamNames = () => {
    callAction({
      type: "UPDATE_TEAM_NAMES",
      team1Name: editableT1,
      team2Name: editableT2,
    });
  };

  const onPasswordCorrect = () => {
    playSabahoSound("correct");
    callAction({ type: "PASSWORD_CORRECT" });
  };

  const onPasswordPass = () => {
    callAction({ type: "PASSWORD_PASS" });
  };

  const onNextStep = () => callAction({ type: "NEXT_STEP" });

  const onBuzz = () => {
    playSabahoSound("buzz");
    setGuessFeedback(null);
    setTypedGuess("");
    callAction({ type: "BUZZ" });
  };

  const onSubmitTypedGuess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedGuess.trim() || validatingGuess) return;

    setValidatingGuess(true);
    setGuessFeedback(null);

    try {
      const res = await fetch(`/api/games/sabaho/rooms/${roomCode}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "SUBMIT_GUESS", guess: typedGuess.trim() }),
      });

      const data = await res.json();
      setValidatingGuess(false);

      if (res.ok && data.result) {
        if (data.result.valid) {
          playSabahoSound("correct");
          setGuessFeedback({ valid: true, text: data.result.explanation });
          setTypedGuess("");
        } else {
          playSabahoSound("wrong");
          setGuessFeedback({ valid: false, text: data.result.explanation });
        }
      } else {
        setError(data.error ?? "Failed to submit guess.");
      }

      // Refresh room state
      const refreshRes = await fetch(`/api/games/sabaho/rooms/${roomCode}`, {
        cache: "no-store",
      });
      if (refreshRes.ok) {
        const refreshed = (await refreshRes.json()) as RoomPayload;
        setRoomData(refreshed);
      }
    } catch (err) {
      setValidatingGuess(false);
      setError(err instanceof Error ? err.message : "Error validating guess.");
    }
  };

  const onJudgeAnswer = (isCorrect: boolean) => {
    if (isCorrect) playSabahoSound("correct");
    else playSabahoSound("wrong");
    callAction({ type: "JUDGE_ANSWER", isCorrect });
  };

  const onNextRound = () => {
    playSabahoSound("whistle");
    callAction({ type: "NEXT_ROUND" });
  };

  const onReplay = () => {
    playSabahoSound("whistle");
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
  const playerCount = room.players.length;

  const canStart = selfPlayer.isHost && room.status === "WAITING" && playerCount >= 2;
  const isAuctionBidding = room.currentPhase === "AUCTION_BIDDING";
  const isAuctionExecution = room.currentPhase === "AUCTION_EXECUTION";
  const isCareerReveal = room.currentPhase === "CAREER_REVEAL";
  const isCareerGuess = room.currentPhase === "CAREER_GUESS";
  const isSpeedChallenge = room.currentPhase === "SPEED_CHALLENGE";
  const isPasswordRound = room.currentPhase === "PASSWORD_ROUND";
  const isRoundOver = room.currentPhase === "ROUND_OVER" || room.status === "FINISHED";
  const isMatchFinished = room.status === "FINISHED";

  const question = room.activeQuestion;
  const auction = question?.auction;
  const career = question?.career;
  const speed = question?.speed;
  const passwordCard = question?.passwordList
    ? question.passwordList[question.currentPasswordIndex || 0]
    : null;

  const team1Players = room.players.filter((p) => p.team === 1);
  const team2Players = room.players.filter((p) => p.team === 2);

  return (
    <main
      className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 sm:px-6 py-6"
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

      {/* MATCH SCOREBOARD BANNER (TEAM 1 VS TEAM 2) */}
      <section className="relative rounded-3xl border-2 border-emerald-500/30 bg-gradient-to-r from-red-600 via-zinc-900 to-sky-600 p-5 text-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Team 1 Banner */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-red-200 uppercase">
                {room.team1Name}
              </span>
              <span className="font-mono text-3xl sm:text-4xl font-black">
                {room.team1Score} pts
              </span>
            </div>
          </div>

          {/* Center Match Status */}
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-zinc-300">
              {t.round} {room.roundNumber}/{room.roundsTotal}
            </span>
            {timerRemaining !== null && (
              <span className="mt-1 rounded-full bg-amber-400 text-zinc-950 px-3 py-1 text-xs font-black font-mono animate-bounce shadow-lg">
                ⏱️ {timerRemaining}s
              </span>
            )}
          </div>

          {/* Team 2 Banner */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-sky-200 uppercase">
                {room.team2Name}
              </span>
              <span className="font-mono text-3xl sm:text-4xl font-black">
                {room.team2Score} pts
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* LOBBY / PRE-GAME WAITING & TEAM SWITCHING */}
      {room.status === "WAITING" && (
        <section className="rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 p-5 sm:p-6 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50">{t.waiting}</h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
              Share code <strong className="font-mono text-emerald-600">#{room.roomCode}</strong> with friends. Choose your team before starting!
            </p>
          </div>

          {/* Admin Team Names Customization (Choose in Start) */}
          {selfPlayer.isHost && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                  ⚙️ {t.adminTeamSetup}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-red-600 dark:text-red-400 block mb-1">
                    🔴 {t.team1}
                  </label>
                  <input
                    type="text"
                    value={editableT1}
                    onChange={(e) => setEditableT1(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-sky-600 dark:text-sky-400 block mb-1">
                    ⚪ {t.team2}
                  </label>
                  <input
                    type="text"
                    value={editableT2}
                    onChange={(e) => setEditableT2(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditableT1("فريق الأهلي");
                      setEditableT2("فريق الزمالك");
                    }}
                    className="rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 cursor-pointer"
                  >
                    الأهلي vs الزمالك
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditableT1("ريال مدريد");
                      setEditableT2("برشلونة");
                    }}
                    className="rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 cursor-pointer"
                  >
                    ريال مدريد vs برشلونة
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditableT1("الفراعنة 🇪🇬");
                      setEditableT2("السامبا 🇧🇷");
                    }}
                    className="rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 cursor-pointer"
                  >
                    الفراعنة vs السامبا
                  </button>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={onSaveTeamNames}
                  className="rounded-xl bg-amber-500 hover:bg-amber-600 px-3.5 py-1.5 text-xs font-black text-white transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {t.saveTeamNames}
                </button>
              </div>
            </div>
          )}

          {/* 2 Team Selection Columns */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Team 1 Box */}
            <div className="rounded-2xl border-2 border-red-500/40 bg-red-500/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-red-600 dark:text-red-400">
                  🔴 {room.team1Name} ({team1Players.length})
                </span>
                {selfPlayer.team !== 1 && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onSwitchTeam(1)}
                    className="rounded-xl bg-red-600 text-white px-3 py-1 text-xs font-bold hover:bg-red-500 transition cursor-pointer"
                  >
                    {t.switchTeam1}
                  </button>
                )}
              </div>
              <div className="space-y-1">
                {team1Players.map((p) => (
                  <div key={p.id} className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    • {p.displayName} {p.id === selfPlayer.id && "(أنت)"}
                  </div>
                ))}
              </div>
            </div>

            {/* Team 2 Box */}
            <div className="rounded-2xl border-2 border-sky-500/40 bg-sky-500/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-sky-600 dark:text-sky-400">
                  ⚪ {room.team2Name} ({team2Players.length})
                </span>
                {selfPlayer.team !== 2 && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onSwitchTeam(2)}
                    className="rounded-xl bg-sky-600 text-white px-3 py-1 text-xs font-bold hover:bg-sky-500 transition cursor-pointer"
                  >
                    {t.switchTeam2}
                  </button>
                )}
              </div>
              <div className="space-y-1">
                {team2Players.map((p) => (
                  <div key={p.id} className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    • {p.displayName} {p.id === selfPlayer.id && "(أنت)"}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {selfPlayer.isHost && (
            <div className="pt-2 max-w-sm mx-auto">
              <button
                type="button"
                disabled={busy || !canStart}
                onClick={onStartGame}
                className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-500 px-6 py-3.5 font-bold text-white hover:opacity-95 transition disabled:opacity-50 cursor-pointer shadow-lg shadow-emerald-600/20"
              >
                {t.startTable} ({playerCount} Players)
              </button>
            </div>
          )}
        </section>
      )}

      {/* ACTIVE CHALLENGE ARENA */}
      {room.status === "PLAYING" && (
        <section className="rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 p-5 sm:p-6 shadow-sm space-y-6">
          {/* CHALLENGE TYPE 1: AL-MAZAAD (THE AUCTION) */}
          {auction && (isAuctionBidding || isAuctionExecution) && (
            <div className="space-y-6 text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1 text-xs font-black">
                <span>🔥</span>
                <span>{t.auctionTitle}</span>
              </div>

              <div className="max-w-xl mx-auto space-y-2">
                <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-50 leading-relaxed">
                  {lang === "ar" ? auction.topicAr : auction.topicEn}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {isAuctionBidding
                    ? "Bid how many correct answers you can name in 30 seconds!"
                    : "The highest bidder has 30 seconds to name the answers!"}
                </p>
              </div>

              {/* High Bid Banner */}
              <div className="inline-flex items-center gap-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 px-5 py-2.5 border border-zinc-200 dark:border-zinc-700">
                <span className="text-xs text-zinc-500 font-bold">{t.currentHighBid}:</span>
                <span className="font-mono text-xl font-black text-amber-500">
                  {room.auctionHighBid ?? 0}
                </span>
                {room.auctionHighBidderName && (
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    ({room.auctionHighBidderName})
                  </span>
                )}
              </div>

              {/* Bidding Controls (During AUCTION_BIDDING) */}
              {isAuctionBidding && (
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onPlaceBid((room.auctionHighBid || 0) + 1)}
                    className="rounded-2xl bg-emerald-600 px-5 py-2.5 text-xs font-black text-white hover:bg-emerald-500 transition shadow-md cursor-pointer"
                  >
                    +1 ({(room.auctionHighBid || 0) + 1})
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onPlaceBid((room.auctionHighBid || 0) + 2)}
                    className="rounded-2xl bg-emerald-600 px-5 py-2.5 text-xs font-black text-white hover:bg-emerald-500 transition shadow-md cursor-pointer"
                  >
                    +2 ({(room.auctionHighBid || 0) + 2})
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={onPassBid}
                    className="rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-5 py-2.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition cursor-pointer"
                  >
                    {t.passBid}
                  </button>
                </div>
              )}

              {/* Suggested Answers for Host / Players Review */}
              {isAuctionExecution && (
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 p-4 text-start max-w-2xl mx-auto space-y-2">
                  <span className="text-xs font-black text-zinc-500">
                    Suggested valid answers:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {auction.suggestedAnswers.map((ans, i) => (
                      <span
                        key={i}
                        className="rounded-lg bg-white dark:bg-zinc-800 px-2.5 py-1 text-xs font-semibold text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700"
                      >
                        {ans}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CHALLENGE TYPE 2: CAREER PATH (مسيرة اللاعب) */}
          {career && (isCareerReveal || isCareerGuess) && (
            <div className="space-y-6 text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 px-3 py-1 text-xs font-black">
                <span>🎽</span>
                <span>{t.careerTitle}</span>
              </div>

              <div className="max-w-md mx-auto">
                <span className="text-xs font-bold text-zinc-400">
                  {career.nationalityFlag} {career.nationality} · {career.position}
                </span>
                <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-50 mt-1">
                  خمن اللاعب من مسيرته الكروية!
                </h2>
              </div>

              {/* Clubs Journey Steps */}
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
                {career.clubs.map((club, idx) => {
                  const isRevealed = idx < room.careerRevealedIndex;

                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 rounded-2xl border p-3 transition-all duration-200 ${
                        isRevealed
                          ? "border-purple-500 bg-purple-500/10 text-purple-900 dark:text-purple-100 shadow-md animate-in zoom-in-90"
                          : "border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/40 text-zinc-400 opacity-50"
                      }`}
                    >
                      <span className="text-sm">{club.countryFlag}</span>
                      <div className="text-start">
                        <span className="font-black text-xs block">
                          {isRevealed ? club.clubName : "???"}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          {isRevealed ? club.year : "----"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Buzzer Alert & Typed Guess Form with Gemini Validation */}
              {isCareerGuess && (
                <div className="rounded-3xl border-2 border-red-500 bg-red-500/10 p-5 text-center space-y-4 shadow-lg animate-in fade-in">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xl">🚨</span>
                    <span className="text-base sm:text-lg font-black text-red-600 dark:text-red-300">
                      {room.buzzerPlayerName} اضرب البزر! معاه {timerRemaining ?? 30} ثانية للتخمين!
                    </span>
                  </div>

                  {/* Player Typed Guess Input with Gemini AI Validation */}
                  {(selfPlayer.isBuzzerPlayer || selfPlayer.isHost) && (
                    <form onSubmit={onSubmitTypedGuess} className="max-w-md mx-auto space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={typedGuess}
                          onChange={(e) => setTypedGuess(e.target.value)}
                          placeholder={t.typeYourGuess}
                          className="w-full rounded-2xl border-2 border-red-300 dark:border-red-900/60 bg-white dark:bg-zinc-900 px-4 py-2.5 text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                        <button
                          type="submit"
                          disabled={validatingGuess || !typedGuess.trim()}
                          className="shrink-0 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 px-5 py-2.5 text-xs font-black text-white hover:opacity-95 transition shadow-md disabled:opacity-50 cursor-pointer"
                        >
                          {validatingGuess ? "..." : t.submitGuessBtn}
                        </button>
                      </div>
                    </form>
                  )}

                  {validatingGuess && (
                    <p className="text-xs font-bold text-amber-500 animate-pulse">
                      ⚡ {t.geminiValidating}
                    </p>
                  )}

                  {guessFeedback && (
                    <div
                      className={`rounded-xl p-3 text-xs font-bold ${
                        guessFeedback.valid
                          ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40"
                          : "bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/40"
                      }`}
                    >
                      {guessFeedback.text}
                    </div>
                  )}
                </div>
              )}

              {/* ACTION CONTROLS FOR CAREER PATH */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {/* BIG RED BUZZER BUTTON */}
                {isCareerReveal && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={onBuzz}
                    className="rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-orange-500 px-8 sm:px-12 py-5 text-base sm:text-xl font-black text-white shadow-2xl hover:scale-105 transition cursor-pointer ring-4 ring-red-400/40 animate-pulse shadow-red-500/30 flex items-center gap-3"
                  >
                    <span>{t.buzzButton}</span>
                  </button>
                )}

                {/* Host button to reveal next club */}
                {selfPlayer.isHost && isCareerReveal && (
                  <button
                    type="button"
                    disabled={busy || room.careerRevealedIndex >= career.clubs.length}
                    onClick={onNextStep}
                    className="rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-4 py-2.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 transition cursor-pointer"
                  >
                    {t.revealNextClub}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* CHALLENGE TYPE 3: SPEED CHALLENGE (السرعة) */}
          {speed && isSpeedChallenge && (
            <div className="space-y-6 text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 px-3 py-1 text-xs font-black">
                <span>⚡</span>
                <span>{t.speedTitle}</span>
              </div>

              <div className="max-w-xl mx-auto space-y-2">
                <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-50 leading-relaxed">
                  {lang === "ar" ? speed.promptAr : speed.promptEn}
                </h2>
              </div>

              {/* Big Buzzer */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={onBuzz}
                  className="rounded-3xl bg-gradient-to-r from-sky-600 to-indigo-600 px-8 py-4 text-base font-black text-white shadow-xl hover:scale-105 transition cursor-pointer"
                >
                  {t.buzzButton}
                </button>
              </div>
            </div>
          )}

          {/* CHALLENGE TYPE 4: PASSWORD GAME (كلمة السر) */}
          {isPasswordRound && passwordCard && (
            <div className="space-y-6 text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3.5 py-1 text-xs font-black">
                <span>🔐</span>
                <span>{t.passwordTitle}</span>
              </div>

              {/* Big Football Password Secret Card */}
              <div className="max-w-md mx-auto rounded-3xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-zinc-900/40 to-teal-500/10 p-6 sm:p-8 shadow-xl">
                <div className="flex items-center justify-between text-xs text-zinc-400 font-bold mb-2">
                  <span className="rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 font-bold">
                    التصنيف: {passwordCard.category}
                  </span>
                  <span className="font-mono text-zinc-500">
                    الكلمة {(question?.currentPasswordIndex ?? 0) + 1} / {question?.passwordList?.length ?? 10}
                  </span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight my-4">
                  {lang === "ar" ? passwordCard.wordAr : passwordCard.wordEn}
                </h2>

                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
                  {t.passwordClueRule}
                </p>

                {/* Counter of correct words in turn */}
                <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 px-4 py-1.5 text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  <span>🔥 الكلمات الصحيحة:</span>
                  <span className="font-mono text-emerald-500 font-black text-sm">
                    {room.passwordScore}
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    (+{room.passwordScore * 10} نقطة)
                  </span>
                </div>
              </div>

              {/* Clue Giver / Host Controls */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={onPasswordCorrect}
                  className="rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-8 py-3.5 text-sm font-black text-white transition shadow-lg shadow-emerald-600/30 cursor-pointer"
                >
                  {t.correctPasswordBtn}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={onPasswordPass}
                  className="rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-6 py-3.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition cursor-pointer"
                >
                  {t.passPasswordBtn}
                </button>
              </div>
            </div>
          )}

          {/* HOST SCORING & JUDGING CONTROLS */}
          {selfPlayer.isHost && (isAuctionExecution || isCareerGuess || isSpeedChallenge) && (
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-5 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => onJudgeAnswer(true)}
                className="rounded-2xl bg-emerald-600 px-6 py-3 text-xs font-black text-white hover:bg-emerald-500 transition shadow-md cursor-pointer"
              >
                {t.approveAnswer}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => onJudgeAnswer(false)}
                className="rounded-2xl bg-red-600 px-6 py-3 text-xs font-black text-white hover:bg-red-500 transition shadow-md cursor-pointer"
              >
                {t.rejectAnswer}
              </button>
            </div>
          )}
        </section>
      )}

      {/* ROUND OVER / MATCH FINISHED CONTROLS */}
      {isRoundOver && selfPlayer.isHost && (
        <section className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 p-5 shadow-sm text-center">
          <div className="max-w-xs mx-auto">
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
                className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-sm font-bold text-white hover:opacity-95 transition cursor-pointer shadow-lg shadow-emerald-600/20"
              >
                ⏭️ {t.nextRound} ({room.roundNumber + 1}/{room.roundsTotal})
              </button>
            )}
          </div>
        </section>
      )}

      {/* Activity Log */}
      <section className="rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 p-5 shadow-sm">
        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-3">
          {t.tableLog}
        </h3>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {room.actions.length === 0 ? (
            <p className="text-xs text-zinc-400 italic">No match activity logged yet.</p>
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
      </section>
    </main>
  );
}
