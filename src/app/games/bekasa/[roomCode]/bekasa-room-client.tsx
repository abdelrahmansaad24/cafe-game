"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PlayerBadge } from "@/components/player-badge";
import { BEKASA_CATEGORIES } from "@/lib/games/bekasa-words";

type BekasaPlayer = {
  id: string;
  userId: string;
  displayName: string;
  score: number;
  isHost: boolean;
  isBekas: boolean | null;
  roleRevealed: boolean;
  isReady: boolean;
  votedPlayerId: string | null;
  hasVoted: boolean;
  bekasGuessedWord: string | null;
  bekasGuessCorrect: boolean | null;
};

type QuestionQueueItem = {
  askerId: string;
  targetId: string;
  done: boolean;
};

type BonusQueueItem = {
  askerId: string;
  targetId?: string | null;
  skipped: boolean;
  done: boolean;
};

type BekasaAction = {
  id: string;
  type: string;
  value: string | null;
  details: string | null;
  actorId: string | null;
  createdAt: string;
};

type BekasaRoomState = {
  id: string;
  roomCode: string;
  title: string;
  visibility: "PUBLIC" | "PRIVATE";
  scoreLimit: number;
  status: "WAITING" | "PLAYING" | "FINISHED";
  currentPhase:
    | "ROLE_REVEAL"
    | "MAIN_QUESTIONS"
    | "BONUS_QUESTIONS"
    | "VOTING"
    | "REVEAL_VOTES"
    | "BEKAS_GUESS"
    | "ROUND_OVER"
    | "FINISHED";
  roundNumber: number;
  categoryId: string;
  categoryNameAr: string;
  categoryNameEn: string;
  secretWordAr: string;
  secretWordEn: string;
  candidateWords: Array<{ ar: string; en: string }>;
  bekasPlayerId: string | null;
  questionQueue: QuestionQueueItem[];
  currentQuestionIndex: number;
  bonusQueue: BonusQueueItem[];
  currentBonusIndex: number;
  roundResultSummary: string | null;
  createdById: string;
  winnerId: string | null;
  players: BekasaPlayer[];
  actions: BekasaAction[];
};

type SelfPlayer = {
  id: string;
  userId: string;
  displayName: string;
  score: number;
  isHost: boolean;
  isBekas: boolean;
  roleRevealed: boolean;
  isReady: boolean;
  votedPlayerId: string | null;
  hasVoted: boolean;
};

type RoomPayload = {
  room: BekasaRoomState;
  selfPlayer: SelfPlayer;
};

type Dictionary = {
  back: string;
  room: string;
  category: string;
  secretWord: string;
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
  youAreBekas: string;
  bekasInstructions: string;
  youAreNormal: string;
  normalInstructions: string;
  iKnowMyRole: string;
  waitingForOthers: string;
  readyPlayers: string;
  mainQuestionsTitle: string;
  mainQuestionsDesc: string;
  askerLabel: string;
  targetLabel: string;
  asksLabel: string;
  questionDone: string;
  bonusQuestionsTitle: string;
  bonusQuestionsDesc: string;
  yourBonusTurn: string;
  askExtraQuestion: string;
  skipBonus: string;
  selectTargetToAsk: string;
  waitingForPlayerBonus: string;
  votingTitle: string;
  votingDesc: string;
  selectSuspect: string;
  submitVote: string;
  youVotedFor: string;
  waitingForVotes: string;
  bekasGuessTitle: string;
  bekasGuessDescBekas: string;
  bekasGuessDescOther: string;
  selectGuessedWord: string;
  submitWordGuess: string;
  roundWinner: string;
  matchWinner: string;
  players: string;
  actions: string;
  loading: string;
  language: string;
  english: string;
  arabic: string;
  changeCategory: string;
};

const DICTIONARY: Record<"en" | "ar", Dictionary> = {
  en: {
    back: "Back to Lobby",
    room: "Room",
    category: "Category",
    secretWord: "Secret Word",
    waiting: "Waiting for Players",
    playing: "Match in Progress",
    finished: "Match Over",
    round: "Round",
    threshold: "Goal",
    minPlayersNotice: "Requires at least 3 players to start بكاسة (Bekasa).",
    startGame: "Start Game (Round 1)",
    nextRound: "Start Next Round",
    playAgain: "Play Again (Reset Scores)",
    leaveRoom: "Leave Room",
    revealRolePrompt: "Tap or hold to reveal your secret card:",
    holdToReveal: "👁️ Reveal Secret Card",
    hideRole: "🙈 Hide Card",
    youAreBekas: "🎭 YOU ARE THE BEKAS (IMPOSTOR)!",
    bekasInstructions:
      "You do NOT know the secret word! Blend in, listen carefully to other questions, and fake your answers so nobody suspects you!",
    youAreNormal: "👤 YOU KNOW THE SECRET WORD!",
    normalInstructions:
      "Your secret word is shown below. Ask questions that prove you know it without making it too obvious for the Bekas to guess!",
    iKnowMyRole: "✅ I Saw My Card & Ready",
    waitingForOthers: "Waiting for other players to acknowledge their cards...",
    readyPlayers: "Players Ready",
    mainQuestionsTitle: "🎤 Main Q&A Round (Randomized)",
    mainQuestionsDesc:
      "Every player asks 1 question and is asked 1 question verbally around the table. Follow the turn below:",
    askerLabel: "Asker",
    targetLabel: "Target",
    asksLabel: "asks",
    questionDone: "Question Answered / Next →",
    bonusQuestionsTitle: "✨ Bonus Question Round",
    bonusQuestionsDesc: "Each player can ask 1 additional person a question, or choose to skip!",
    yourBonusTurn: "It's your turn for a bonus question!",
    askExtraQuestion: "Ask Bonus Question",
    skipBonus: "Skip My Turn ⏭️",
    selectTargetToAsk: "Select who to ask:",
    waitingForPlayerBonus: "is deciding whether to ask a bonus question or skip...",
    votingTitle: "🗳️ Secret Voting Phase",
    votingDesc: "Vote for who you believe is the Bekas (the Impostor who doesn't know the word)!",
    selectSuspect: "Select who you think is the Bekas:",
    submitVote: "Cast My Vote 🎯",
    youVotedFor: "You voted for:",
    waitingForVotes: "Waiting for remaining votes...",
    bekasGuessTitle: "🎯 The Bekas Word Guess!",
    bekasGuessDescBekas:
      "You were the Bekas! Now choose what you think the secret word was from these 7 close candidates for +1 BONUS point!",
    bekasGuessDescOther:
      "The Bekas is now looking at 7 closely related candidate words to try and guess the secret word!",
    selectGuessedWord: "Select your guess for the secret word:",
    submitWordGuess: "Submit Word Guess 🚀",
    roundWinner: "Round Outcome",
    matchWinner: "🏆 MATCH CHAMPION 🏆",
    players: "Players & Scoreboard",
    actions: "Live Action Log",
    loading: "Loading room...",
    language: "Language",
    english: "English",
    arabic: "العربية",
    changeCategory: "Category for next round:",
  },
  ar: {
    back: "العودة للقائمة",
    room: "الغرفة",
    category: "الموضوع",
    secretWord: "الكلمة السرية",
    waiting: "في انتظار اكتمال اللاعبين",
    playing: "المباراة جارية",
    finished: "انتهت المباراة",
    round: "الجولة",
    threshold: "الهدف",
    minPlayersNotice: "تحتاج إلى 3 لاعبين على الأقل لبدء لعبة بكاسة.",
    startGame: "بدء اللعبة (الجولة الأولى)",
    nextRound: "بدء الجولة التالية",
    playAgain: "لعب مباراة جديدة (تصفير النقاط)",
    leaveRoom: "مغادرة الغرفة",
    revealRolePrompt: "اضغط لكشف بطاقتك السرية بحذر:",
    holdToReveal: "👁️ اكشف بطاقتي السرية",
    hideRole: "🙈 إخفاء البطاقة",
    youAreBekas: "🎭 أنت البكاس (برا السالفة)!",
    bekasInstructions:
      "أنت لا تعرف الكلمة السرية! استمع جيداً لأسئلة وأجوبة الآخرين، وموّه في إجاباتك بحيث لا يشك فيك أحد!",
    youAreNormal: "👤 أنت تعرف الكلمة السرية!",
    normalInstructions:
      "كلمتك السرية موضحة أدناه. اسأل أسئلة ذكية تُثبت معرفتك دون أن تفضح الكلمة للبّكاس!",
    iKnowMyRole: "✅ رأيت بطاقتي وأنا جاهز",
    waitingForOthers: "في انتظار بقية اللاعبين لرؤية بطاقاتهم...",
    readyPlayers: "اللاعبون الجاهزون",
    mainQuestionsTitle: "🎤 جولة الأسئلة الرئيسية (بالقرعة)",
    mainQuestionsDesc:
      "كل لاعب يسأل سؤالاً واحداً ويُسأل سؤالاً واحداً في الواقع. اتبع الدور الموضح:",
    askerLabel: "السائل",
    targetLabel: "المسؤول",
    asksLabel: "يسأل",
    questionDone: "تم السؤال والإجابة / التالي →",
    bonusQuestionsTitle: "✨ جولة الأسئلة الإضافية",
    bonusQuestionsDesc: "يحق لكل لاعب سؤال شخص إضافي أو التخطي!",
    yourBonusTurn: "دورك الآن في السؤال الإضافي!",
    askExtraQuestion: "سؤال لاعب إضافي",
    skipBonus: "تخطي دوري ⏭️",
    selectTargetToAsk: "اختر اللاعب الذي تريد سؤاله:",
    waitingForPlayerBonus: "يقرر الآن هل يسأل سؤالاً إضافياً أم يتخطى...",
    votingTitle: "🗳️ مرحلة التصويت السري",
    votingDesc: "صوّت على اللاعب الذي تعتقد أنه هو البكاس (الذي لا يعرف الكلمة)!",
    selectSuspect: "اختر من تشك أنه البكاس:",
    submitVote: "تأكيد التصويت 🎯",
    youVotedFor: "لقد صوتت على:",
    waitingForVotes: "في انتظار بقية الأصوات...",
    bekasGuessTitle: "🎯 فرصة البكاس للتخمين!",
    bekasGuessDescBekas:
      "أنت البكاس! الآن خمن ما هي الكلمة السرية من بين هذه الخيارات الـ 7 القريبة لتحصل على +1 نقطة إضافية!",
    bekasGuessDescOther:
      "البكاس يحاول الآن تخمين الكلمة السرية من بين 7 خيارات قريبة جداً!",
    selectGuessedWord: "اختر تخمينك للكلمة السرية:",
    submitWordGuess: "تأكيد التخمين 🚀",
    roundWinner: "نتيجة الجولة",
    matchWinner: "🏆 بطل المباراة 🏆",
    players: "اللاعبون ولوحة النقاط",
    actions: "سجل أحداث اللعبة",
    loading: "جارٍ تحميل الغرفة...",
    language: "اللغة",
    english: "English",
    arabic: "العربية",
    changeCategory: "موضوع الجولة القادمة:",
  },
};

function playSound(type: "click" | "ready" | "vote" | "win") {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === "click") {
      osc.frequency.setValueAtTime(450, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === "ready") {
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === "vote") {
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === "win") {
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.1);
      osc.frequency.setValueAtTime(783.99, now + 0.2);
      osc.frequency.setValueAtTime(1046.5, now + 0.35);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.6);
    }
  } catch {
    // Ignore audio errors
  }
}

export default function BekasaRoomClient({ roomCode }: { roomCode: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") === "ar" ? "ar" : "en";
  const t = DICTIONARY[lang];

  const [roomData, setRoomData] = useState<RoomPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [selectedVoteId, setSelectedVoteId] = useState<string>("");
  const [selectedBonusTargetId, setSelectedBonusTargetId] = useState<string>("");
  const [selectedBekasGuess, setSelectedBekasGuess] = useState<string>("");
  const [nextRoundCategory, setNextRoundCategory] = useState<string>("football");

  const links = useMemo(
    () => ({
      lobby: `/games/bekasa?lang=${lang}`,
      en: `/games/bekasa/${roomCode}?lang=en`,
      ar: `/games/bekasa/${roomCode}?lang=ar`,
    }),
    [lang, roomCode],
  );

  useEffect(() => {
    let running = true;

    const load = async () => {
      const response = await fetch(`/api/games/bekasa/rooms/${roomCode}`, {
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
    const response = await fetch(`/api/games/bekasa/rooms/${roomCode}/action`, {
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

    const refreshRes = await fetch(`/api/games/bekasa/rooms/${roomCode}`, {
      cache: "no-store",
    });
    if (refreshRes.ok) {
      const refreshed = (await refreshRes.json()) as RoomPayload;
      setRoomData(refreshed);
    }
  }

  const onStartGame = async () => {
    setBusy(true);
    const response = await fetch(`/api/games/bekasa/rooms/${roomCode}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId: nextRoundCategory }),
    });
    const data = (await response.json()) as { error?: string; ok?: boolean };
    setBusy(false);
    if (!response.ok) {
      setError(data.error ?? "Could not start game.");
      return;
    }
    playSound("ready");
    setShowCard(false);
  };

  const onRevealRole = () => {
    setShowCard(!showCard);
    if (!roomData?.selfPlayer.roleRevealed) {
      callAction({ type: "REVEAL_ROLE" });
    }
  };

  const onConfirmReady = () => {
    playSound("ready");
    callAction({ type: "READY" });
  };

  const onAdvanceQuestion = () => {
    callAction({ type: "ADVANCE_QUESTION" });
  };

  const onBonusQuestion = () => {
    if (!selectedBonusTargetId) return;
    callAction({ type: "BONUS_QUESTION", targetPlayerId: selectedBonusTargetId });
    setSelectedBonusTargetId("");
  };

  const onSkipBonus = () => {
    callAction({ type: "SKIP_BONUS" });
  };

  const onSubmitVote = () => {
    if (!selectedVoteId) return;
    playSound("vote");
    callAction({ type: "CAST_VOTE", votedPlayerId: selectedVoteId });
  };

  const onSubmitBekasGuess = () => {
    if (!selectedBekasGuess) return;
    playSound("ready");
    callAction({ type: "BEKAS_GUESS", guessedWordAr: selectedBekasGuess });
  };

  const onNextRound = () => {
    setShowCard(false);
    setSelectedVoteId("");
    setSelectedBekasGuess("");
    callAction({ type: "NEXT_ROUND", categoryId: nextRoundCategory });
  };

  const onReplay = () => {
    setShowCard(false);
    setSelectedVoteId("");
    setSelectedBekasGuess("");
    callAction({ type: "REPLAY", categoryId: nextRoundCategory });
  };

  const onLeaveRoom = () => {
    callAction({ type: "LEAVE" });
  };

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

  const currentQ = room.questionQueue[room.currentQuestionIndex];
  const currentQAsker = currentQ ? room.players.find((p) => p.id === currentQ.askerId) : null;
  const currentQTarget = currentQ ? room.players.find((p) => p.id === currentQ.targetId) : null;
  const isMyQuestionTurn = currentQAsker?.id === selfPlayer.id;

  const currentBonus = room.bonusQueue[room.currentBonusIndex];
  const currentBonusAsker = currentBonus
    ? room.players.find((p) => p.id === currentBonus.askerId)
    : null;
  const isMyBonusTurn = currentBonusAsker?.id === selfPlayer.id;

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
                ? "border-amber-600 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-bold"
                : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
            href={links.en}
          >
            EN
          </Link>
          <Link
            className={`rounded-lg border px-2.5 py-1 transition ${
              lang === "ar"
                ? "border-amber-600 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-bold"
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
              <span className="text-2xl">🎭</span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
                {room.title}
              </h1>
            </div>
            <p className="mt-1 font-mono text-xs text-zinc-500 dark:text-zinc-400">
              {t.room}: <span className="font-bold text-amber-600 dark:text-amber-400">#{room.roomCode}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-800 dark:text-amber-200">
              🏷️ {lang === "ar" ? room.categoryNameAr : room.categoryNameEn}
            </span>
            <span className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 text-xs font-bold text-zinc-800 dark:text-zinc-200">
              {t.round} {room.roundNumber} · 🎯 {t.threshold}: {room.scoreLimit} pts
            </span>
          </div>
        </div>

        {/* LOBBY / WAITING STATE */}
        {room.status === "WAITING" && (
          <div className="mt-5 space-y-4 text-center py-4">
            <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-3xl">
              👥
            </div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{t.waiting}</h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
              Share code <strong className="font-mono text-amber-600 dark:text-amber-400">#{room.roomCode}</strong> with friends.
              {room.players.length < 3 && (
                <span className="block mt-1 text-amber-600 dark:text-amber-400 font-semibold">
                  ⚠️ {t.minPlayersNotice}
                </span>
              )}
            </p>

            {selfPlayer.isHost && (
              <div className="pt-2 max-w-sm mx-auto space-y-3">
                <button
                  type="button"
                  disabled={busy || room.players.length < 3}
                  onClick={onStartGame}
                  className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 font-bold text-white hover:from-amber-400 hover:to-orange-400 transition disabled:opacity-50 cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  {t.startGame} ({room.players.length}/3+ Players)
                </button>
              </div>
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

            <div className="flex flex-col items-center justify-center gap-3 py-2">
              <button
                type="button"
                onClick={onRevealRole}
                className={`w-full max-w-sm rounded-2xl border p-4 font-bold text-base transition cursor-pointer shadow-sm ${
                  showCard
                    ? "border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                    : "border-amber-500 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-500/20 hover:opacity-95"
                }`}
              >
                {showCard ? t.hideRole : t.holdToReveal}
              </button>

              {/* Secret Role Card */}
              {showCard && (
                <div
                  className={`w-full max-w-sm rounded-3xl border-2 p-6 text-center shadow-xl animate-in fade-in zoom-in duration-150 ${
                    selfPlayer.isBekas
                      ? "border-rose-500 bg-rose-500/10 text-rose-950 dark:text-rose-100 shadow-rose-500/20"
                      : "border-amber-500 bg-amber-500/10 text-amber-950 dark:text-amber-100 shadow-amber-500/20"
                  }`}
                >
                  <div className="text-5xl mb-3">{selfPlayer.isBekas ? "🎭" : "🤫"}</div>
                  <h3 className="text-xl font-extrabold mb-1">
                    {selfPlayer.isBekas ? t.youAreBekas : t.youAreNormal}
                  </h3>

                  <div className="my-3 py-2 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-current/20">
                    <p className="text-xs uppercase font-bold opacity-75">{t.category}:</p>
                    <p className="font-bold text-sm">
                      {lang === "ar" ? room.categoryNameAr : room.categoryNameEn}
                    </p>

                    {!selfPlayer.isBekas && (
                      <div className="mt-2 pt-2 border-t border-current/10">
                        <p className="text-xs uppercase font-bold opacity-75">{t.secretWord}:</p>
                        <p className="font-extrabold text-2xl tracking-wider text-amber-600 dark:text-amber-300">
                          {lang === "ar" ? room.secretWordAr : room.secretWordEn || room.secretWordAr}
                        </p>
                      </div>
                    )}
                  </div>

                  <p className="text-xs font-medium leading-relaxed opacity-90 mb-4">
                    {selfPlayer.isBekas ? t.bekasInstructions : t.normalInstructions}
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

        {/* PHASE 2: MAIN QUESTIONS ROUND-ROBIN */}
        {room.status === "PLAYING" && room.currentPhase === "MAIN_QUESTIONS" && (
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-center">
              <h2 className="text-base sm:text-lg font-extrabold text-amber-900 dark:text-amber-200">
                {t.mainQuestionsTitle}
              </h2>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                {t.mainQuestionsDesc}
              </p>
              <div className="mt-2 font-mono text-xs font-bold text-amber-700 dark:text-amber-300">
                Question {room.currentQuestionIndex + 1} of {room.questionQueue.length}
              </div>
            </div>

            {/* Active Question Banner */}
            {currentQ && currentQAsker && currentQTarget && (
              <div className="rounded-3xl border-2 border-amber-500 bg-amber-500/5 p-6 text-center space-y-4 max-w-lg mx-auto shadow-md">
                <div className="flex flex-wrap items-center justify-center gap-3 text-lg font-bold">
                  <div className="flex flex-col items-center">
                    <span className="text-xs uppercase text-zinc-500 dark:text-zinc-400 font-semibold mb-1">
                      {t.askerLabel}
                    </span>
                    <PlayerBadge
                      name={currentQAsker.displayName}
                      playerId={currentQAsker.id}
                      userId={currentQAsker.userId}
                      isSelf={currentQAsker.id === selfPlayer.id}
                      size="md"
                      lang={lang}
                    />
                  </div>

                  <span className="text-2xl text-amber-600 font-extrabold px-2">👉 {t.asksLabel} 👉</span>

                  <div className="flex flex-col items-center">
                    <span className="text-xs uppercase text-zinc-500 dark:text-zinc-400 font-semibold mb-1">
                      {t.targetLabel}
                    </span>
                    <PlayerBadge
                      name={currentQTarget.displayName}
                      playerId={currentQTarget.id}
                      userId={currentQTarget.userId}
                      isSelf={currentQTarget.id === selfPlayer.id}
                      size="md"
                      lang={lang}
                    />
                  </div>
                </div>

                <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">
                  Ask any question about the topic in real life!
                </p>

                {/* Advance Button (Host or Asker) */}
                {(isMyQuestionTurn || selfPlayer.isHost) && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={onAdvanceQuestion}
                    className="w-full rounded-2xl bg-amber-500 px-5 py-3 font-bold text-white hover:bg-amber-400 transition cursor-pointer shadow-md shadow-amber-500/20"
                  >
                    {t.questionDone}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* PHASE 3: BONUS QUESTIONS */}
        {room.status === "PLAYING" && room.currentPhase === "BONUS_QUESTIONS" && (
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4 text-center">
              <h2 className="text-base sm:text-lg font-extrabold text-indigo-900 dark:text-indigo-200">
                {t.bonusQuestionsTitle}
              </h2>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                {t.bonusQuestionsDesc}
              </p>
              <div className="mt-2 font-mono text-xs font-bold text-indigo-700 dark:text-indigo-300">
                Bonus Turn {room.currentBonusIndex + 1} of {room.bonusQueue.length}
              </div>
            </div>

            {currentBonusAsker && (
              <div className="rounded-3xl border-2 border-indigo-500/80 bg-indigo-500/5 p-6 text-center space-y-4 max-w-lg mx-auto shadow-md">
                <div className="flex items-center justify-center gap-2">
                  <PlayerBadge
                    name={currentBonusAsker.displayName}
                    playerId={currentBonusAsker.id}
                    userId={currentBonusAsker.userId}
                    isSelf={currentBonusAsker.id === selfPlayer.id}
                    size="md"
                    lang={lang}
                  />
                  {!isMyBonusTurn && (
                    <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                      {t.waitingForPlayerBonus}
                    </span>
                  )}
                </div>

                {isMyBonusTurn ? (
                  <div className="space-y-4 pt-2">
                    <p className="text-sm font-bold text-indigo-800 dark:text-indigo-300">
                      {t.yourBonusTurn}
                    </p>

                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">
                        {t.selectTargetToAsk}
                      </label>
                      <div className="grid gap-2">
                        {room.players
                          .filter((p) => p.id !== selfPlayer.id)
                          .map((player) => (
                            <button
                              key={player.id}
                              type="button"
                              onClick={() => setSelectedBonusTargetId(player.id)}
                              className={`flex items-center justify-between p-3 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                                selectedBonusTargetId === player.id
                                  ? "border-indigo-600 bg-indigo-600/15 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500"
                                  : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 hover:border-indigo-400"
                              }`}
                            >
                              <PlayerBadge
                                name={player.displayName}
                                playerId={player.id}
                                userId={player.userId}
                                size="sm"
                                lang={lang}
                              />
                              <span>{selectedBonusTargetId === player.id ? "🎯 Target" : "Select"}</span>
                            </button>
                          ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busy || !selectedBonusTargetId}
                        onClick={onBonusQuestion}
                        className="flex-1 rounded-2xl bg-indigo-600 px-4 py-3 text-xs font-bold text-white hover:bg-indigo-500 transition disabled:opacity-50 cursor-pointer shadow-md"
                      >
                        {t.askExtraQuestion}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={onSkipBonus}
                        className="rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-4 py-3 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition cursor-pointer"
                      >
                        {t.skipBonus}
                      </button>
                    </div>
                  </div>
                ) : (
                  selfPlayer.isHost && (
                    <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-center gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={onSkipBonus}
                        className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 cursor-pointer"
                      >
                        Host: Force Skip Turn
                      </button>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}

        {/* PHASE 4: VOTING */}
        {room.status === "PLAYING" && room.currentPhase === "VOTING" && (
          <div className="mt-5 space-y-4 max-w-lg mx-auto">
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-center">
              <h2 className="text-base sm:text-lg font-extrabold text-rose-900 dark:text-rose-200">
                {t.votingTitle}
              </h2>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{t.votingDesc}</p>
            </div>

            {!selfPlayer.hasVoted ? (
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase text-zinc-500">
                  {t.selectSuspect}
                </label>
                <div className="grid gap-2">
                  {room.players
                    .filter((p) => p.id !== selfPlayer.id)
                    .map((player) => (
                      <button
                        key={player.id}
                        type="button"
                        onClick={() => setSelectedVoteId(player.id)}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border text-sm font-bold transition cursor-pointer ${
                          selectedVoteId === player.id
                            ? "border-rose-600 bg-rose-600/15 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500"
                            : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 hover:border-rose-400"
                        }`}
                      >
                        <PlayerBadge
                          name={player.displayName}
                          playerId={player.id}
                          userId={player.userId}
                          size="md"
                          lang={lang}
                        />
                        <span>{selectedVoteId === player.id ? "🎯 Accused" : "Accuse"}</span>
                      </button>
                    ))}
                </div>

                <button
                  type="button"
                  disabled={busy || !selectedVoteId}
                  onClick={onSubmitVote}
                  className="w-full rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 px-6 py-3.5 font-bold text-white hover:from-rose-500 hover:to-pink-500 transition disabled:opacity-50 cursor-pointer shadow-lg shadow-rose-600/20"
                >
                  {t.submitVote}
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center">
                <span className="text-3xl">🗳️</span>
                <p className="mt-2 text-sm font-bold text-emerald-800 dark:text-emerald-300">
                  {t.youVotedFor}
                </p>
                <div className="mt-2">
                  {(() => {
                    const votedPlayer = room.players.find((p) => p.id === selfPlayer.votedPlayerId);
                    return votedPlayer ? (
                      <PlayerBadge
                        name={votedPlayer.displayName}
                        playerId={votedPlayer.id}
                        userId={votedPlayer.userId}
                        size="md"
                        lang={lang}
                      />
                    ) : null;
                  })()}
                </div>
                <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">{t.waitingForVotes}</p>
              </div>
            )}
          </div>
        )}

        {/* PHASE 5: BEKAS GUESS FROM 7 CLOSE CANDIDATES */}
        {room.status === "PLAYING" && room.currentPhase === "BEKAS_GUESS" && (
          <div className="mt-5 space-y-4 max-w-lg mx-auto">
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-center">
              <h2 className="text-base sm:text-lg font-extrabold text-amber-900 dark:text-amber-200">
                {t.bekasGuessTitle}
              </h2>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                {selfPlayer.isBekas ? t.bekasGuessDescBekas : t.bekasGuessDescOther}
              </p>
            </div>

            {/* Voting Summary Banner */}
            {room.roundResultSummary && (
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4 text-xs sm:text-sm font-medium text-zinc-800 dark:text-zinc-200 text-center leading-relaxed">
                {room.roundResultSummary}
              </div>
            )}

            {/* Candidate Words Selector (Only Bekas picks) */}
            {selfPlayer.isBekas ? (
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold uppercase text-zinc-500">
                  {t.selectGuessedWord}
                </label>
                <div className="grid gap-2">
                  {room.candidateWords.map((cand, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedBekasGuess(cand.ar)}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border text-sm font-bold transition cursor-pointer ${
                        selectedBekasGuess === cand.ar
                          ? "border-amber-500 bg-amber-500/15 text-amber-800 dark:text-amber-200 ring-2 ring-amber-500"
                          : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 hover:border-amber-400"
                      }`}
                    >
                      <span className="text-base">{lang === "ar" ? cand.ar : cand.en || cand.ar}</span>
                      <span>{selectedBekasGuess === cand.ar ? "🎯 Selected" : "Select"}</span>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={busy || !selectedBekasGuess}
                  onClick={onSubmitBekasGuess}
                  className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3.5 font-bold text-white hover:from-amber-400 hover:to-orange-400 transition disabled:opacity-50 cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  {t.submitWordGuess}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent mb-3" />
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  {t.bekasGuessDescOther}
                </p>
              </div>
            )}
          </div>
        )}

        {/* PHASE 6 & 7: ROUND OVER & MATCH VICTORY */}
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
                <pre className="mt-3 font-sans whitespace-pre-line text-sm text-amber-800 dark:text-amber-300 font-medium">
                  {room.roundResultSummary}
                </pre>

                {selfPlayer.isHost && (
                  <div className="mt-5 space-y-3 max-w-sm mx-auto">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={onReplay}
                      className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 font-bold text-white hover:opacity-95 transition cursor-pointer shadow-md shadow-amber-500/30"
                    >
                      {t.playAgain}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-6 space-y-3">
                <div className="text-4xl mb-2">🏁</div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  Round {room.roundNumber} Complete!
                </h3>
                <pre className="font-sans whitespace-pre-line text-sm text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed">
                  {room.roundResultSummary}
                </pre>

                {selfPlayer.isHost && (
                  <div className="pt-3 max-w-sm mx-auto space-y-3">
                    {/* Optional Category Selector for Next Round */}
                    <div className="text-left">
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
                        {t.changeCategory}
                      </label>
                      <select
                        value={nextRoundCategory}
                        onChange={(e) => setNextRoundCategory(e.target.value)}
                        className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 outline-none"
                      >
                        {BEKASA_CATEGORIES.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.icon} {lang === "ar" ? cat.nameAr : cat.nameEn}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={onNextRound}
                      className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 font-bold text-white hover:from-amber-400 hover:to-orange-400 transition cursor-pointer shadow-md shadow-amber-500/20"
                    >
                      {t.nextRound} →
                    </button>
                  </div>
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

              let statusText = null;
              let statusColor = undefined;

              if (isRoundOver && player.isBekas) {
                statusText = "🎭 Bekas";
                statusColor = "text-rose-600 dark:text-rose-400";
              } else if (room.currentPhase === "VOTING") {
                statusText = player.hasVoted ? "✓ Voted" : "Thinking...";
                statusColor = player.hasVoted
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-zinc-400";
              }

              return (
                <div
                  key={player.id}
                  className="flex items-center justify-between rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5 text-sm transition"
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

                  <div className="flex items-center gap-2 font-mono font-bold text-xs text-zinc-700 dark:text-zinc-300">
                    <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400">
                      {player.score}
                    </span>
                    <span className="opacity-60">/ {room.scoreLimit} pts</span>
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
                <span className="ml-1.5 font-mono font-bold text-amber-600 dark:text-amber-400">
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
