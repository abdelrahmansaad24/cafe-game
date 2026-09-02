"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PlayingCard } from "@/components/playing-card";
import {
  canPlayCard,
  EstimationCard,
  SUIT_NAMES_AR,
  SUIT_SYMBOLS,
  TrumpSuit,
} from "@/lib/games/estimation-types";

type RoomPayload = {
  room: {
    id: string;
    roomCode: string;
    title: string;
    visibility: "PUBLIC" | "PRIVATE";
    status: "WAITING" | "PLAYING" | "FINISHED";
    currentPhase: "BIDDING" | "SELECT_TRUMP" | "TRICK_PLAYING" | "ROUND_OVER" | "FINISHED";
    roundsTotal: number;
    roundNumber: number;
    currentTurnPlayerId: string | null;
    trumpSuit: TrumpSuit | null;
    highBidderName: string | null;
    highBid: number | null;
    leadSuit: string | null;
    currentTrick: Array<{ playerId: string; card: EstimationCard }>;
    trickNumber: number;
    roundWinnerId: string | null;
    winnerId: string | null;
    createdById: string;
    players: Array<{
      id: string;
      userId: string;
      displayName: string;
      seatIndex: number;
      score: number;
      bid: number | null;
      tricksWon: number;
      roundPoints: number;
      isHost: boolean;
      cardsCount: number;
      handCards: EstimationCard[];
      scoreHistory: number[];
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
    bid: number | null;
    tricksWon: number;
    isHost: boolean;
    isMyTurn: boolean;
  };
};

type Dictionary = {
  back: string;
  table: string;
  waiting: string;
  biddingPhase: string;
  selectTrumpPhase: string;
  trickPlayingPhase: string;
  roundOver: string;
  finished: string;
  round: string;
  trick: string;
  trump: string;
  leadSuit: string;
  bidTitle: string;
  yourTurnToBid: string;
  yourTurnToPlay: string;
  waitingForTurn: string;
  startTable: string;
  nextRound: string;
  playAgain: string;
  leaveRoom: string;
  scoreboard: string;
  tableLog: string;
  loading: string;
  bid: string;
  tricks: string;
  selectTrumpPrompt: string;
  scoreSheetTitle: string;
};

const DICTIONARY: Record<"en" | "ar", Dictionary> = {
  en: {
    back: "Back to Lobby",
    table: "Table",
    waiting: "Waiting for 4 Players",
    biddingPhase: "Bidding Phase (Call)",
    selectTrumpPhase: "Highest Bidder Selecting Trump",
    trickPlayingPhase: "Trick in Progress",
    roundOver: "Round Finished!",
    finished: "Match Champion Crowned!",
    round: "Round",
    trick: "Trick",
    trump: "Trump",
    leadSuit: "Lead Suit",
    bidTitle: "Place Your Bid (0-13 Tricks):",
    yourTurnToBid: "It's your turn to bid! How many tricks can you win?",
    yourTurnToPlay: "Your turn! Play a legal card to the table.",
    waitingForTurn: "Waiting for player's move...",
    startTable: "Deal 13 Cards & Start Match",
    nextRound: "Next Round",
    playAgain: "Play Again (Reset Scores)",
    leaveRoom: "Leave Table",
    scoreboard: "Players & Scoreboard",
    tableLog: "Table Activity Log",
    loading: "Loading Estimation Table...",
    bid: "Bid",
    tricks: "Tricks",
    selectTrumpPrompt: "👑 You won the bidding! Choose the Trump suit:",
    scoreSheetTitle: "Egyptian Cafe Score Sheet",
  },
  ar: {
    back: "العودة للقائمة",
    table: "الطاولة",
    waiting: "في انتظار ٤ لاعبين",
    biddingPhase: "مرحلة المزايدة (الكول)",
    selectTrumpPhase: "صاحب أعلى كول يختار الحُكم",
    trickPlayingPhase: "اللعب جارٍ (اللمّات)",
    roundOver: "انتهت الجولة!",
    finished: "انتهت المباراة وتُوّج البطل!",
    round: "الجولة",
    trick: "اللمّة",
    trump: "الحُكم",
    leadSuit: "لون اللمّة",
    bidTitle: "اطلب الكول بتاعك (من ٠ إلى ١٣ لمّة):",
    yourTurnToBid: "دورك في المزايدة! هتلم كام لمّة؟",
    yourTurnToPlay: "دورك! العب ورقة قانونية على الطاولة.",
    waitingForTurn: "في انتظار حركة اللاعب...",
    startTable: "توزيع ١٣ ورقة وبدء المباراة",
    nextRound: "الجولة التالية",
    playAgain: "لعب مباراة جديدة (تصفير النقط)",
    leaveRoom: "مغادرة الطاولة",
    scoreboard: "اللاعبون واللمّات",
    tableLog: "سجل أحداث الطاولة",
    loading: "جارٍ تحميل طاولة استميشن...",
    bid: "الكول",
    tricks: "اللمّات",
    selectTrumpPrompt: "👑 أنت صاحب أعلى كول! اختر لون الحُكم للمباراة:",
    scoreSheetTitle: "جدول السكور شيت المصري (الدوشات والنقاط)",
  },
};

// Web Audio sound effects for Estimation
function playEstimationSound(type: "deal" | "play" | "trickWon" | "bid" | "fanfare") {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === "deal") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === "play") {
      // Crisp card snap on felt table
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.08);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === "trickWon") {
      [659.25, 880].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.2, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.15);
      });
    } else if (type === "bid") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === "fanfare") {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.3, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.3);
      });
    }
  } catch {
    // Ignore audio error
  }
}

export default function EstimationRoomClient({ roomCode }: { roomCode: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") === "ar" ? "ar" : "en";
  const t = DICTIONARY[lang];

  const [roomData, setRoomData] = useState<RoomPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const links = useMemo(
    () => ({
      lobby: `/games/estimation?lang=${lang}`,
      en: `/games/estimation/${roomCode}?lang=en`,
      ar: `/games/estimation/${roomCode}?lang=ar`,
    }),
    [lang, roomCode],
  );

  useEffect(() => {
    let running = true;

    const load = async () => {
      const response = await fetch(`/api/games/estimation/rooms/${roomCode}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as RoomPayload & { error?: string };
      if (!running) return;

      if (!response.ok || !data.room || !data.selfPlayer) {
        setError(data.error ?? "Could not load table.");
      } else {
        setRoomData({ room: data.room, selfPlayer: data.selfPlayer });
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
    const response = await fetch(`/api/games/estimation/rooms/${roomCode}/action`, {
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
    const refreshRes = await fetch(`/api/games/estimation/rooms/${roomCode}`, {
      cache: "no-store",
    });
    if (refreshRes.ok) {
      const refreshed = (await refreshRes.json()) as RoomPayload;
      setRoomData(refreshed);
    }
  }

  const onStartGame = async () => {
    setBusy(true);
    const response = await fetch(`/api/games/estimation/rooms/${roomCode}/start`, {
      method: "POST",
    });
    const data = (await response.json()) as { error?: string; ok?: boolean };
    setBusy(false);
    if (!response.ok) {
      setError(data.error ?? "Could not start table.");
      return;
    }
    playEstimationSound("deal");
  };

  const onBid = (bid: number) => {
    playEstimationSound("bid");
    callAction({ type: "BID", bid });
  };

  const onSelectTrump = (trumpSuit: TrumpSuit) => {
    playEstimationSound("bid");
    callAction({ type: "SELECT_TRUMP", trumpSuit });
  };

  const onPlayCard = (card: EstimationCard) => {
    playEstimationSound("play");
    callAction({ type: "PLAY_CARD", cardId: card.id });
  };

  const onNextRound = () => {
    playEstimationSound("deal");
    callAction({ type: "NEXT_ROUND" });
  };

  const onReplay = () => {
    playEstimationSound("deal");
    callAction({ type: "REPLAY" });
  };

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

  const canStart = selfPlayer.isHost && room.status === "WAITING" && playerCount === 4;
  const myPlayerInState = room.players.find((p) => p.id === selfPlayer.id);
  const myHand = myPlayerInState?.handCards || [];

  const isBiddingPhase = room.currentPhase === "BIDDING";
  const isSelectTrumpPhase = room.currentPhase === "SELECT_TRUMP";
  const isTrickPlaying = room.currentPhase === "TRICK_PLAYING";
  const isRoundOver = room.currentPhase === "ROUND_OVER" || room.status === "FINISHED";
  const isMatchFinished = room.status === "FINISHED";

  const isMyTurn = room.currentTurnPlayerId === selfPlayer.id;
  const isHighBidder = room.highBidderName === selfPlayer.displayName;

  // Relative seat mapping (self at bottom: 0, right: 1, top: 2, left: 3)
  const selfSeat = selfPlayer.seatIndex;
  const seatsRelative = [0, 1, 2, 3].map((rel) => {
    const seatIdx = (selfSeat + rel) % 4;
    return room.players.find((p) => p.seatIndex === seatIdx) || null;
  });

  const bottomPlayer = seatsRelative[0];
  const rightPlayer = seatsRelative[1];
  const topPlayer = seatsRelative[2];
  const leftPlayer = seatsRelative[3];

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

      {/* Table Status Bar */}
      <section className="rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 p-4 sm:p-5 shadow-sm backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl animate-bounce">♠️</span>
              <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-50">{room.title}</h1>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {t.round} {room.roundNumber}/{room.roundsTotal} · {t.trick} {room.trickNumber}/13
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Trump Badge */}
            {room.trumpSuit && (
              <span className="rounded-xl border border-amber-500/40 bg-amber-500/10 dark:bg-amber-950/50 px-3 py-1 text-xs font-black text-amber-700 dark:text-amber-300 shadow-sm flex items-center gap-1.5">
                <span>{t.trump}:</span>
                <span className="text-sm font-bold">
                  {SUIT_NAMES_AR[room.trumpSuit as TrumpSuit]}
                </span>
              </span>
            )}

            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                room.status === "WAITING"
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                  : isBiddingPhase
                  ? "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300"
                  : isSelectTrumpPhase
                  ? "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
                  : isRoundOver
                  ? "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
              }`}
            >
              {room.status === "WAITING"
                ? t.waiting
                : isBiddingPhase
                ? t.biddingPhase
                : isSelectTrumpPhase
                ? t.selectTrumpPhase
                : isRoundOver
                ? t.roundOver
                : t.trickPlayingPhase}
            </span>
          </div>
        </div>

        {/* WAITING ROOM (Need 4 players) */}
        {room.status === "WAITING" && (
          <div className="mt-5 space-y-4 text-center py-6">
            <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-3xl">
              ♠️
            </div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{t.waiting}</h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
              Share code <strong className="font-mono text-amber-600 dark:text-amber-400">#{room.roomCode}</strong> with friends.
              <span className="block mt-1 font-semibold text-zinc-700 dark:text-zinc-300">
                Seated: {playerCount}/4 players
              </span>
            </p>

            {selfPlayer.isHost && (
              <div className="pt-2 max-w-sm mx-auto">
                <button
                  type="button"
                  disabled={busy || !canStart}
                  onClick={onStartGame}
                  className="w-full rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 px-6 py-3.5 font-bold text-white hover:opacity-95 transition disabled:opacity-50 cursor-pointer shadow-lg shadow-amber-600/20"
                >
                  {t.startTable} ({playerCount}/4)
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* SELECT TRUMP MODAL / PROMPT (for High Bidder) */}
      {isSelectTrumpPhase && isHighBidder && (
        <section className="rounded-3xl border-2 border-purple-500/50 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-amber-500/10 p-5 sm:p-6 text-center shadow-xl space-y-4 animate-in fade-in">
          <h2 className="text-base sm:text-lg font-black text-purple-900 dark:text-purple-200">
            {t.selectTrumpPrompt}
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => onSelectTrump("SPADES")}
              className="flex items-center gap-2 rounded-2xl bg-zinc-900 text-white px-5 py-3 font-black text-sm hover:scale-105 transition shadow-md cursor-pointer"
            >
              <span>♠️</span>
              <span>بيك (Spades)</span>
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onSelectTrump("HEARTS")}
              className="flex items-center gap-2 rounded-2xl bg-red-600 text-white px-5 py-3 font-black text-sm hover:scale-105 transition shadow-md cursor-pointer"
            >
              <span>♥️</span>
              <span>كبة (Hearts)</span>
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onSelectTrump("DIAMONDS")}
              className="flex items-center gap-2 rounded-2xl bg-red-600 text-white px-5 py-3 font-black text-sm hover:scale-105 transition shadow-md cursor-pointer"
            >
              <span>♦️</span>
              <span>كاروه (Diamonds)</span>
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onSelectTrump("CLUBS")}
              className="flex items-center gap-2 rounded-2xl bg-zinc-900 text-white px-5 py-3 font-black text-sm hover:scale-105 transition shadow-md cursor-pointer"
            >
              <span>♣️</span>
              <span>سنتر (Clubs)</span>
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onSelectTrump("NO_TRUMP")}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-600 to-yellow-500 text-white px-5 py-3 font-black text-sm hover:scale-105 transition shadow-md cursor-pointer"
            >
              <span>🚫</span>
              <span>صن (No-Trump)</span>
            </button>
          </div>
        </section>
      )}

      {/* BIDDING CONTROLS (When it's your turn to bid) */}
      {isBiddingPhase && isMyTurn && (
        <section className="rounded-3xl border-2 border-amber-500/50 bg-amber-500/10 p-5 text-center space-y-3 animate-in fade-in">
          <h2 className="text-sm sm:text-base font-black text-amber-900 dark:text-amber-200">
            {t.yourTurnToBid}
          </h2>
          <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
            {/* Dash button */}
            <button
              type="button"
              disabled={busy}
              onClick={() => onBid(0)}
              className="rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2 text-xs font-black text-white hover:scale-105 transition shadow-md cursor-pointer"
            >
              داش (Dash 0)
            </button>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((num) => (
              <button
                key={num}
                type="button"
                disabled={busy}
                onClick={() => onBid(num)}
                className="h-10 w-10 rounded-xl font-mono text-sm font-black border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-amber-500 hover:text-white transition shadow-sm cursor-pointer"
              >
                {num}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ACTIVE CARD FELT TABLE LAYOUT */}
      {room.status === "PLAYING" && (
        <section className="relative rounded-3xl border-4 border-emerald-800/80 bg-gradient-to-b from-emerald-900 via-emerald-800 to-emerald-950 p-4 sm:p-8 shadow-2xl text-white min-h-[480px] flex flex-col justify-between overflow-hidden">
          {/* Subtle felt texture overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-700/20 via-transparent to-black/40 pointer-events-none" />

          {/* TOP SEAT (Opponent / Partner Across) */}
          <div className="flex flex-col items-center z-10">
            {topPlayer && (
              <div className="flex items-center gap-2 rounded-2xl bg-black/40 px-3 py-1.5 border border-white/10 backdrop-blur-sm">
                <span className="text-xs font-bold">{topPlayer.displayName}</span>
                <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
                  {t.bid}: {topPlayer.bid ?? "-"}
                </span>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">
                  {t.tricks}: {topPlayer.tricksWon}
                </span>
                <span className="text-[10px] text-zinc-400">🎴 {topPlayer.cardsCount}</span>
              </div>
            )}
          </div>

          {/* MIDDLE ROW: Left Player, Center Trick Felt, Right Player */}
          <div className="flex items-center justify-between my-4 z-10">
            {/* LEFT SEAT */}
            <div className="flex flex-col items-center">
              {leftPlayer && (
                <div className="flex flex-col items-center gap-1 rounded-2xl bg-black/40 p-2.5 border border-white/10 backdrop-blur-sm">
                  <span className="text-xs font-bold">{leftPlayer.displayName}</span>
                  <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
                    {t.bid}: {leftPlayer.bid ?? "-"}
                  </span>
                  <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">
                    {t.tricks}: {leftPlayer.tricksWon}
                  </span>
                  <span className="text-[10px] text-zinc-400">🎴 {leftPlayer.cardsCount}</span>
                </div>
              )}
            </div>

            {/* CENTER FELT: The 4 Cards in Current Trick */}
            <div className="relative flex items-center justify-center min-w-[200px] min-h-[160px] rounded-3xl bg-black/30 border border-white/10 p-4 shadow-inner">
              {room.currentTrick.length === 0 ? (
                <div className="text-center text-xs text-emerald-200/50 font-medium">
                  {isTrickPlaying && (
                    <span className="animate-pulse">
                      {isMyTurn ? t.yourTurnToPlay : t.waitingForTurn}
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {room.currentTrick.map((entry) => {
                    const thrower = room.players.find((p) => p.id === entry.playerId);
                    return (
                      <div key={entry.card.id} className="flex flex-col items-center animate-in zoom-in-90 duration-150">
                        <PlayingCard card={entry.card} size="sm" />
                        <span className="text-[10px] font-bold text-emerald-200 mt-1 truncate max-w-[60px]">
                          {thrower?.displayName || "Player"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RIGHT SEAT */}
            <div className="flex flex-col items-center">
              {rightPlayer && (
                <div className="flex flex-col items-center gap-1 rounded-2xl bg-black/40 p-2.5 border border-white/10 backdrop-blur-sm">
                  <span className="text-xs font-bold">{rightPlayer.displayName}</span>
                  <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
                    {t.bid}: {rightPlayer.bid ?? "-"}
                  </span>
                  <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">
                    {t.tricks}: {rightPlayer.tricksWon}
                  </span>
                  <span className="text-[10px] text-zinc-400">🎴 {rightPlayer.cardsCount}</span>
                </div>
              )}
            </div>
          </div>

          {/* BOTTOM SEAT: Self info & 13 Cards Fan */}
          <div className="flex flex-col items-center gap-3 z-10">
            {bottomPlayer && (
              <div className="flex items-center gap-2 rounded-2xl bg-black/50 px-4 py-1.5 border border-white/20 backdrop-blur-sm">
                <span className="text-xs font-black text-amber-300">
                  {bottomPlayer.displayName} ({lang === "ar" ? "أنت" : "You"})
                </span>
                <span className="text-xs font-mono font-black bg-amber-500/30 text-amber-300 px-2 py-0.5 rounded">
                  {t.bid}: {bottomPlayer.bid ?? "-"}
                </span>
                <span className="text-xs font-mono font-black bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded">
                  {t.tricks}: {bottomPlayer.tricksWon}
                </span>
              </div>
            )}

            {/* YOUR HAND OF CARDS */}
            <div className="flex flex-wrap justify-center gap-1 sm:gap-2 max-w-full overflow-x-auto pb-2 px-2">
              {myHand.map((card) => {
                const isPlayable =
                  isTrickPlaying &&
                  isMyTurn &&
                  canPlayCard(card, myHand, room.leadSuit);

                return (
                  <PlayingCard
                    key={card.id}
                    card={card}
                    size="md"
                    isPlayable={isPlayable}
                    disabled={busy || !isPlayable}
                    onClick={() => onPlayCard(card)}
                  />
                );
              })}
            </div>
          </div>
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
                className="w-full rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-3 text-sm font-bold text-white hover:opacity-95 transition cursor-pointer shadow-lg shadow-amber-600/20"
              >
                ⏭️ {t.nextRound} ({room.roundNumber + 1}/{room.roundsTotal})
              </button>
            )}
          </div>
        </section>
      )}

      {/* EGYPTIAN CAFE SCORE SHEET (جدول النقاط والدوشات) */}
      <section className="rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 p-5 shadow-sm overflow-hidden">
        <h2 className="text-base font-black text-zinc-900 dark:text-zinc-50 flex items-center gap-2 mb-4">
          <span>📊</span>
          <span>{t.scoreSheetTitle}</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-zinc-600 dark:text-zinc-300">
            <thead className="bg-zinc-100 dark:bg-zinc-800/60 font-black text-zinc-900 dark:text-zinc-100 uppercase">
              <tr>
                <th className="px-3 py-2.5">Player</th>
                <th className="px-3 py-2.5 text-center">Current Bid</th>
                <th className="px-3 py-2.5 text-center">Tricks Won</th>
                <th className="px-3 py-2.5 text-center">Round Score</th>
                <th className="px-3 py-2.5 text-center">Total Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {room.players.map((p) => {
                const isSelf = p.id === selfPlayer.id;

                return (
                  <tr
                    key={p.id}
                    className={isSelf ? "bg-amber-500/10 font-bold" : ""}
                  >
                    <td className="px-3 py-2.5 font-bold text-zinc-900 dark:text-zinc-100">
                      {p.displayName} {isSelf && (lang === "ar" ? "(أنت)" : "(You)")}
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono font-bold">
                      {p.bid !== null ? (p.bid === 0 ? "Dash (0)" : p.bid) : "-"}
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono font-bold">
                      {p.tricksWon}
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono font-bold">
                      {p.roundPoints > 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          +{p.roundPoints}
                        </span>
                      ) : p.roundPoints < 0 ? (
                        <span className="text-red-500">
                          {p.roundPoints}
                        </span>
                      ) : (
                        "0"
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono text-sm font-black text-amber-600 dark:text-amber-400">
                      {p.score} pts
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Activity Log */}
      <section className="rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 p-5 shadow-sm">
        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-3">
          {t.tableLog}
        </h3>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
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
      </section>
    </main>
  );
}
