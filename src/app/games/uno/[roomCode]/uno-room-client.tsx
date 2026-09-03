"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { UnoCardView } from "@/components/uno-card";
import { GameTableShell } from "@/components/game-table-shell";
import {
  isCardPlayable,
  UnoCard,
  UnoColor,
  UNO_COLORS,
  UNO_COLOR_NAMES,
} from "@/lib/games/uno-types";

type RoomPayload = {
  room: {
    id: string;
    roomCode: string;
    title: string;
    visibility: "PUBLIC" | "PRIVATE";
    scoreLimit: number;
    status: "WAITING" | "PLAYING" | "FINISHED";
    currentPhase: "PLAYING" | "ROUND_OVER" | "FINISHED";
    roundNumber: number;
    currentTurnPlayerId: string | null;
    direction: number;
    activeColor: UnoColor;
    topCard: UnoCard | null;
    drawDeckCount: number;
    discardPileCount: number;
    drawCardDrawnThisTurn: boolean;
    roundWinnerId: string | null;
    roundResultSummary: string | null;
    createdById: string;
    winnerId: string | null;
    players: Array<{
      id: string;
      userId: string;
      displayName: string;
      seatIndex: number;
      score: number;
      cardsCount: number;
      hand: UnoCard[] | null;
      handPoints: number | null;
      hasCalledUno: boolean;
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
    score: number;
    hand: UnoCard[];
    hasCalledUno: boolean;
    isHost: boolean;
    isMyTurn: boolean;
  };
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
  startTable: string;
  nextRound: string;
  playAgain: string;
  leaveRoom: string;
  yourTurn: string;
  drawCard: string;
  passTurn: string;
  shoutUno: string;
  unoCalled: string;
  catchUno: string;
  chooseColor: string;
  activeColor: string;
  directionClockwise: string;
  directionCounter: string;
  drawPile: string;
  discardPile: string;
  emptyTable: string;
  roundWinner: string;
  matchChampion: string;
  scoreboard: string;
  tableLog: string;
  loading: string;
  language: string;
  english: string;
  arabic: string;
};

const DICTIONARY: Record<"en" | "ar", Dictionary> = {
  en: {
    back: "Back to Lobby",
    room: "Table",
    waiting: "Waiting for Players",
    playing: "Round in Progress",
    finished: "Match Over",
    round: "Round",
    threshold: "Goal",
    minPlayersNotice: "Requires at least 2 players to start.",
    startTable: "Start UNO Game",
    nextRound: "Start Next Round",
    playAgain: "Play Again (Reset Scores)",
    leaveRoom: "Leave Table",
    yourTurn: "It's your turn to play!",
    drawCard: "Draw Card",
    passTurn: "Pass Turn",
    shoutUno: "🔥 SHOUT UNO! 🔥",
    unoCalled: "UNO Called!",
    catchUno: "Catch UNO! 🚨",
    chooseColor: "Choose Active Color for Wild:",
    activeColor: "Active Color",
    directionClockwise: "Clockwise ↻",
    directionCounter: "Counter-Clockwise ↺",
    drawPile: "Draw Pile",
    discardPile: "Discard Pile",
    emptyTable: "Waiting for round to start...",
    roundWinner: "Round Winner",
    matchChampion: "🏆 UNO MATCH CHAMPION 🏆",
    scoreboard: "Players & Scoreboard",
    tableLog: "Table Activity Log",
    loading: "Loading UNO Table...",
    language: "Language",
    english: "English",
    arabic: "العربية",
  },
  ar: {
    back: "العودة للقائمة",
    room: "الطاولة",
    waiting: "في انتظار اكتمال اللاعبين",
    playing: "الجولة جارية",
    finished: "انتهت المباراة",
    round: "الجولة",
    threshold: "الهدف",
    minPlayersNotice: "تحتاج إلى لاعبين اثنين على الأقل لبدء اللعب.",
    startTable: "بدء مباراة أونو",
    nextRound: "بدء الجولة التالية",
    playAgain: "لعب طاولة جديدة (تصفير النقط)",
    leaveRoom: "مغادرة الطاولة",
    yourTurn: "دورك الآن في اللعب!",
    drawCard: "اسحب كرت",
    passTurn: "باص (تمرير الدور)",
    shoutUno: "🔥 صرخة أونو! (UNO) 🔥",
    unoCalled: "صرخ أونو!",
    catchUno: "قفش أونو! 🚨",
    chooseColor: "اختر اللون القادم للجوكر:",
    activeColor: "اللون الحالي",
    directionClockwise: "مع عقارب الساعة ↻",
    directionCounter: "عكس عقارب الساعة ↺",
    drawPile: "كومة السحب",
    discardPile: "كومة اللعب",
    emptyTable: "في انتظار بدء الجولة...",
    roundWinner: "فائز الجولة",
    matchChampion: "🏆 بطل مباراة أونو 🏆",
    scoreboard: "اللاعبون ولوحة النقط",
    tableLog: "سجل أحداث الطاولة",
    loading: "جارٍ تحميل طاولة أونو...",
    language: "اللغة",
    english: "English",
    arabic: "العربية",
  },
};

// Web Audio sound effects for authentic card table feel
function playUnoSound(type: "card" | "draw" | "wild" | "uno" | "catch" | "win") {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === "card") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.08);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === "draw") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(550, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === "uno" || type === "wild") {
      [440, 554, 659].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + i * 0.07);
        gain.gain.setValueAtTime(0.25, now + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.07 + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 0.15);
      });
    } else if (type === "catch") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(160, now + 0.1);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === "win") {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
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

export default function UnoRoomClient({ roomCode }: { roomCode: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") === "ar" ? "ar" : "en";
  const t = DICTIONARY[lang];

  const [roomData, setRoomData] = useState<RoomPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [wildCardPending, setWildCardPending] = useState<UnoCard | null>(null);
  const [unoShoutActive, setUnoShoutActive] = useState(false);

  const links = useMemo(
    () => ({
      lobby: `/games/uno?lang=${lang}`,
      en: `/games/uno/${roomCode}?lang=en`,
      ar: `/games/uno/${roomCode}?lang=ar`,
    }),
    [lang, roomCode],
  );

  useEffect(() => {
    let running = true;

    const load = async () => {
      const response = await fetch(`/api/games/uno/rooms/${roomCode}`, {
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
    const response = await fetch(`/api/games/uno/rooms/${roomCode}/action`, {
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
    setWildCardPending(null);

    const refreshRes = await fetch(`/api/games/uno/rooms/${roomCode}`, {
      cache: "no-store",
    });
    if (refreshRes.ok) {
      const refreshed = (await refreshRes.json()) as RoomPayload;
      setRoomData(refreshed);
    }
  }

  const onStartGame = async () => {
    setBusy(true);
    const response = await fetch(`/api/games/uno/rooms/${roomCode}/start`, {
      method: "POST",
    });
    const data = (await response.json()) as { error?: string; ok?: boolean };
    setBusy(false);
    if (!response.ok) {
      setError(data.error ?? "Could not start table.");
      return;
    }
    playUnoSound("wild");
  };

  const onCardClick = (card: UnoCard) => {
    if (!roomData?.selfPlayer.isMyTurn) return;

    const playable = isCardPlayable(card, roomData.room.activeColor, roomData.room.topCard);
    if (!playable) return;

    const isWild = card.color === "WILD" || card.value === "WILD" || card.value === "WILD_DRAW_FOUR";

    if (isWild) {
      setWildCardPending(card);
    } else {
      playUnoSound("card");
      callAction({
        type: "PLAY_CARD",
        cardId: card.id,
        calledUno: unoShoutActive,
      });
      setUnoShoutActive(false);
    }
  };

  const onSelectWildColor = (chosenColor: UnoColor) => {
    if (!wildCardPending) return;
    playUnoSound("wild");
    callAction({
      type: "PLAY_CARD",
      cardId: wildCardPending.id,
      chosenColor,
      calledUno: unoShoutActive,
    });
    setWildCardPending(null);
    setUnoShoutActive(false);
  };

  const onDrawCard = () => {
    playUnoSound("draw");
    callAction({ type: "DRAW_CARD" });
  };

  const onPassTurn = () => {
    playUnoSound("card");
    callAction({ type: "PASS_TURN" });
  };

  const onToggleShoutUno = () => {
    playUnoSound("uno");
    setUnoShoutActive(!unoShoutActive);
    callAction({ type: "CALL_UNO" });
  };

  const onCatchPlayer = (targetPlayerId: string) => {
    playUnoSound("catch");
    callAction({ type: "CATCH_UNO", targetPlayerId });
  };

  const onNextRound = () => {
    callAction({ type: "NEXT_ROUND" });
  };

  const onReplay = () => {
    callAction({ type: "REPLAY" });
  };

  const onLeaveRoom = () => {
    callAction({ type: "LEAVE" });
  };

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-4xl items-center justify-center px-6 py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">{t.loading}</p>
        </div>
      </main>
    );
  }

  if (error && !roomData) {
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

  if (!roomData) return null;

  const room = roomData.room;
  const selfPlayer = roomData.selfPlayer;
  const playerCount = room.players.length;

  const canStart = selfPlayer.isHost && room.status === "WAITING" && playerCount >= 2;
  const isRoundOver = room.currentPhase === "ROUND_OVER" || room.status === "FINISHED";
  const isMatchFinished = room.status === "FINISHED";

  const canDraw = selfPlayer.isMyTurn && !room.drawCardDrawnThisTurn;
  const canPass = selfPlayer.isMyTurn && room.drawCardDrawnThisTurn;

  const activeColorInfo = UNO_COLOR_NAMES[room.activeColor] || UNO_COLOR_NAMES.RED;

  // ==========================================
  // WAITING / LOBBY STATE
  // ==========================================
  if (room.status === "WAITING") {
    return (
      <main
        className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-5 px-4 sm:px-6 py-8"
        dir={lang === "ar" ? "rtl" : "ltr"}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link
              href={links.lobby}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              ← {t.back}
            </Link>
            <span className="font-mono text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-900/60">
              #{room.roomCode}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs font-medium">
              <Link
                className={`rounded-lg border px-2.5 py-1 transition ${
                  lang === "en"
                    ? "border-red-600 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 font-bold"
                    : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                }`}
                href={links.en}
              >
                EN
              </Link>
              <Link
                className={`rounded-lg border px-2.5 py-1 transition ${
                  lang === "ar"
                    ? "border-red-600 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 font-bold"
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

        <section className="rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 p-5 shadow-sm backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎴</span>
                <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-50">{room.title}</h1>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {t.round} {room.roundNumber} · {t.threshold}: <strong className="text-zinc-900 dark:text-zinc-100">{room.scoreLimit} pts</strong>
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4 text-center py-6">
            <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-3xl">
              🎴
            </div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{t.waiting}</h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
              Share code <strong className="font-mono text-red-600 dark:text-red-400">#{room.roomCode}</strong> with friends.
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
                  className="w-full rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 px-6 py-3.5 font-bold text-white hover:opacity-95 transition disabled:opacity-50 cursor-pointer shadow-lg shadow-red-600/20"
                >
                  {t.startTable} ({playerCount}/8 Players)
                </button>
              </div>
            )}
          </div>
        </section>
      </main>
    );
  }

  // ==========================================
  // ACTIVE GAME: FULLSCREEN IMMERSIVE TABLE
  // ==========================================

  const opponents = room.players.filter((p) => p.id !== selfPlayer.id);

  // ---- TOP BAR: Active Color + Direction + Round ----
  const topBarContent = (
    <>
      {/* Active Color */}
      <span className="rounded-lg bg-black/50 backdrop-blur-md px-2.5 py-1 border border-white/10 flex items-center gap-1.5 text-white text-[10px] font-bold">
        <span
          className="inline-block w-3 h-3 rounded-full shadow-md animate-pulse"
          style={{ backgroundColor: activeColorInfo.hex }}
        />
        <span style={{ color: activeColorInfo.hex }}>
          {lang === "ar" ? activeColorInfo.ar : activeColorInfo.en}
        </span>
      </span>

      {/* Round + Score */}
      <span className="rounded-lg bg-black/50 px-2 py-1 text-[10px] font-bold text-white border border-white/10">
        R{room.roundNumber} · {selfPlayer.score}/{room.scoreLimit}
      </span>

      {/* Direction */}
      <span className="rounded-lg bg-black/50 px-2 py-1 text-[10px] font-bold text-white border border-white/10">
        {room.direction === 1 ? "↻" : "↺"}
      </span>
    </>
  );

  // ---- DOCK HEADER ----
  const dockHeaderContent = (
    <div className="flex flex-wrap items-center justify-between gap-2 px-1">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase text-red-300/90 tracking-wider">
          {lang === "ar" ? "كروتك" : "Your Hand"} ({selfPlayer.hand.length})
        </span>
        {selfPlayer.isMyTurn && (
          <span className="rounded-full bg-red-600 text-white px-2 py-0.5 text-[10px] font-black animate-pulse">
            {t.yourTurn}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        {/* UNO Shout */}
        <button
          type="button"
          onClick={onToggleShoutUno}
          className={`rounded-lg px-2.5 py-1 text-[10px] font-black transition cursor-pointer shadow ${
            unoShoutActive || selfPlayer.hasCalledUno
              ? "bg-red-600 text-white ring-2 ring-amber-400 animate-pulse"
              : "bg-gradient-to-r from-red-600 to-amber-500 text-white hover:opacity-95"
          }`}
        >
          UNO!
        </button>
        {selfPlayer.isMyTurn && canDraw && (
          <button
            type="button"
            disabled={busy}
            onClick={onDrawCard}
            className="rounded-lg bg-amber-500 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-amber-400 transition cursor-pointer"
          >
            📥 {t.drawCard}
          </button>
        )}
        {selfPlayer.isMyTurn && canPass && (
          <button
            type="button"
            disabled={busy}
            onClick={onPassTurn}
            className="rounded-lg bg-zinc-800 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-zinc-700 transition cursor-pointer border border-white/20"
          >
            ⏭️ {t.passTurn}
          </button>
        )}
      </div>
    </div>
  );

  // ---- DOCK: Player's cards ----
  const dockCards = selfPlayer.hand.map((card) => {
    const playable =
      selfPlayer.isMyTurn && isCardPlayable(card, room.activeColor, room.topCard);
    return (
      <UnoCardView
        key={card.id}
        card={card}
        size="md"
        isPlayable={playable}
        onClick={() => onCardClick(card)}
      />
    );
  });

  // ---- ROUND OVER OVERLAY ----
  const roundOverContent = isRoundOver ? (
    <div className="rounded-3xl bg-zinc-950/95 backdrop-blur-xl border border-white/10 p-6 text-center space-y-4 shadow-2xl">
      <div className="text-4xl">🏆</div>
      <h2 className="text-xl font-black text-zinc-50">
        {isMatchFinished ? t.matchChampion : t.roundWinner}
      </h2>
      {room.roundResultSummary && (
        <p className="text-sm font-bold text-amber-200 max-w-xl mx-auto">
          {room.roundResultSummary}
        </p>
      )}

      {/* Revealed hands */}
      <div className="grid gap-2 sm:grid-cols-2 pt-2">
        {room.players.map((player) => (
          <div key={player.id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-left">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-sm text-white">{player.displayName}</span>
              <span className="font-mono font-bold text-sm text-red-400">{player.score} pts</span>
            </div>
            {player.hand && player.hand.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {player.hand.map((c) => (
                  <UnoCardView key={c.id} card={c} size="sm" />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {selfPlayer.isHost && (
        <div className="pt-3 max-w-xs mx-auto">
          {isMatchFinished ? (
            <button
              type="button"
              disabled={busy}
              onClick={onReplay}
              className="w-full rounded-2xl bg-zinc-100 px-6 py-3 text-sm font-bold text-zinc-900 hover:bg-white transition cursor-pointer shadow-lg"
            >
              🔄 {t.playAgain}
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={onNextRound}
              className="w-full rounded-2xl bg-red-600 px-6 py-3 text-sm font-bold text-white hover:bg-red-500 transition cursor-pointer shadow-lg shadow-red-600/20"
            >
              ⏭️ {t.nextRound}
            </button>
          )}
        </div>
      )}
    </div>
  ) : undefined;

  // ---- WILD COLOR PICKER MODAL ----
  const wildModal = wildCardPending ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-3xl bg-zinc-900 border-2 border-white/20 p-6 shadow-2xl text-center space-y-4">
        <h3 className="text-base font-extrabold text-white">{t.chooseColor}</h3>
        <div className="grid grid-cols-2 gap-3">
          {UNO_COLORS.map((color) => {
            const info = UNO_COLOR_NAMES[color];
            return (
              <button
                key={color}
                type="button"
                onClick={() => onSelectWildColor(color)}
                className="p-4 rounded-2xl font-black text-white text-base shadow-lg hover:scale-105 active:scale-95 transition cursor-pointer flex flex-col items-center gap-1"
                style={{ backgroundColor: info.hex }}
              >
                <span>{lang === "ar" ? info.ar : info.en}</span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setWildCardPending(null)}
          className="mt-2 text-xs font-semibold text-zinc-400 hover:text-white"
        >
          Cancel
        </button>
      </div>
    </div>
  ) : null;

  // ---- DRAWER CONTENT ----
  const drawerContent = (
    <>
      {/* Language */}
      <div className="rounded-xl bg-white/5 border border-white/10 p-3">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
          {t.language}
        </span>
        <div className="flex items-center gap-2">
          <Link
            className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
              lang === "en"
                ? "border-red-500 bg-red-500/20 text-red-300"
                : "border-white/10 text-zinc-400 hover:bg-white/10"
            }`}
            href={links.en}
          >
            English
          </Link>
          <Link
            className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
              lang === "ar"
                ? "border-red-500 bg-red-500/20 text-red-300"
                : "border-white/10 text-zinc-400 hover:bg-white/10"
            }`}
            href={links.ar}
          >
            العربية
          </Link>
        </div>
      </div>

      {/* Scoreboard */}
      <div className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-2">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
          {t.scoreboard}
        </span>
        {room.players.map((p) => {
          const isTurn = p.id === room.currentTurnPlayerId && room.status === "PLAYING";
          const isSelf = p.id === selfPlayer.id;
          return (
            <div
              key={p.id}
              className={`flex items-center justify-between rounded-lg p-2 text-xs transition ${
                isTurn
                  ? "bg-red-500/15 border border-red-500/30"
                  : "bg-white/5 border border-white/5"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className={`font-bold ${isSelf ? "text-amber-300" : "text-white"}`}>
                  {p.displayName}
                  {isSelf && (lang === "ar" ? " (أنت)" : " (You)")}
                </span>
                {p.hasCalledUno && (
                  <span className="rounded-full bg-red-600 text-white font-black text-[8px] px-1 py-0.5">
                    UNO!
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-400">🎴 {p.cardsCount}</span>
                <span className="font-mono font-bold text-red-400">{p.score}/{room.scoreLimit}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Event Log */}
      <div className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-2">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
          {t.tableLog}
        </span>
        <div className="max-h-48 overflow-y-auto space-y-1.5">
          {room.actions.length === 0 ? (
            <p className="text-[10px] text-zinc-500 italic">No moves logged yet.</p>
          ) : (
            room.actions.map((act) => (
              <div
                key={act.id}
                className="rounded-lg bg-white/5 p-2 text-[10px] text-zinc-400"
              >
                {act.details}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );

  return (
    <GameTableShell
      theme="uno"
      lang={lang}
      lobbyHref={links.lobby}
      roomCode={roomCode}
      isMyTurn={selfPlayer.isMyTurn}
      onLeave={onLeaveRoom}
      topBar={topBarContent}
      dock={dockCards}
      dockHeader={dockHeaderContent}
      drawerContent={drawerContent}
      isRoundOver={isRoundOver}
      roundOverContent={roundOverContent}
      error={error}
      busy={busy}
      modals={wildModal}
    >
      {/* CENTER ARENA: Opponents + Draw/Discard Piles */}
      <div className="absolute inset-0 flex flex-col z-0">
        {/* Opponents Around Table (top area) */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 px-2 z-10">
          {opponents.map((opp) => {
            const isTurn = opp.id === room.currentTurnPlayerId;
            const canCatch =
              opp.cardsCount === 1 && !opp.hasCalledUno && room.status === "PLAYING";

            return (
              <div
                key={opp.id}
                className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 transition text-[10px] ${
                  isTurn
                    ? "bg-amber-400 text-zinc-950 font-bold shadow-lg ring-1 ring-amber-300 scale-105"
                    : "bg-black/50 text-white border border-white/10"
                }`}
              >
                <span className="font-bold truncate max-w-[50px]">{opp.displayName}</span>
                <div className="flex items-center gap-0.5">
                  <UnoCardView faceDown size="sm" />
                  <span className="font-mono font-bold">×{opp.cardsCount}</span>
                </div>

                {opp.hasCalledUno && (
                  <span className="rounded-full bg-red-600 text-white font-black text-[8px] px-1 py-0.5 animate-bounce">
                    UNO!
                  </span>
                )}

                {canCatch && (
                  <button
                    type="button"
                    onClick={() => onCatchPlayer(opp.id)}
                    className="rounded-md bg-red-600 hover:bg-red-500 text-white font-black text-[8px] px-1.5 py-0.5 shadow cursor-pointer animate-pulse"
                  >
                    🚨
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Center: Draw Deck & Discard Pile */}
        <div className="flex-1 flex items-center justify-center gap-6 sm:gap-10 z-10">
          {/* Draw Pile */}
          <div className="flex flex-col items-center gap-1.5">
            <div
              onClick={canDraw ? onDrawCard : undefined}
              className={`relative transition ${
                canDraw ? "cursor-pointer hover:scale-105 active:scale-95 ring-4 ring-amber-400 rounded-xl" : "opacity-80"
              }`}
              title={canDraw ? t.drawCard : undefined}
            >
              <div className="absolute top-1 left-1 w-18 h-26 rounded-xl bg-zinc-900 border border-white/40 -rotate-3" />
              <div className="absolute top-0.5 left-0.5 w-18 h-26 rounded-xl bg-zinc-900 border border-white/40 rotate-2" />
              <UnoCardView faceDown size="md" countBadge={room.drawDeckCount} />
            </div>
            <span className="text-[9px] font-bold text-zinc-300">
              {t.drawPile} ({room.drawDeckCount})
            </span>
          </div>

          {/* Discard Pile */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="relative">
              {room.topCard ? (
                <UnoCardView card={room.topCard} size="md" className="shadow-2xl rotate-2" />
              ) : (
                <div className="w-18 h-26 rounded-xl border-2 border-dashed border-white/30 flex items-center justify-center text-[10px] text-white/50">
                  Empty
                </div>
              )}
            </div>
            <span className="text-[9px] font-bold text-zinc-300">
              {t.discardPile} ({room.discardPileCount})
            </span>
          </div>
        </div>
      </div>
    </GameTableShell>
  );
}
