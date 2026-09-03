"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PlayerBadge } from "@/components/player-badge";
import { DominoTileView } from "@/components/domino-tile";
import { DominoSnakeBoard } from "@/components/domino-snake-board";
import { MobileTableRotation } from "@/components/mobile-table-rotation";
import {
  BoardTile,
  DominoTile,
  isTilePlayable,
} from "@/lib/games/domino-types";

type DominoPlayer = {
  id: string;
  userId: string;
  displayName: string;
  seatIndex: number;
  team: "TEAM_A" | "TEAM_B" | null;
  score: number;
  tilesCount: number;
  hand: DominoTile[] | null;
  pipSum: number | null;
  isHost: boolean;
};

type DominoRoomState = {
  id: string;
  roomCode: string;
  title: string;
  visibility: "PUBLIC" | "PRIVATE";
  scoreLimit: number;
  mode: "SOLO" | "TEAMS";
  status: "WAITING" | "PLAYING" | "FINISHED";
  currentPhase: "PLAYING" | "ROUND_OVER" | "FINISHED";
  roundNumber: number;
  currentTurnPlayerId: string | null;
  leftEnd: number | null;
  rightEnd: number | null;
  boardTiles: BoardTile[];
  boneyardCount: number;
  roundWinnerId: string | null;
  winningTeam: "TEAM_A" | "TEAM_B" | null;
  roundResultSummary: string | null;
  createdById: string;
  winnerId: string | null;
  teamAScore: number;
  teamBScore: number;
  players: DominoPlayer[];
  actions: Array<{
    id: string;
    type: string;
    value: string | null;
    details: string | null;
    createdAt: string;
  }>;
};

type SelfPlayer = {
  id: string;
  userId: string;
  displayName: string;
  seatIndex: number;
  team: "TEAM_A" | "TEAM_B" | null;
  score: number;
  hand: DominoTile[];
  isHost: boolean;
  isMyTurn: boolean;
};

type RoomPayload = {
  room: DominoRoomState;
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
  startTable: string;
  nextRound: string;
  playAgain: string;
  leaveRoom: string;
  yourTurn: string;
  drawTile: string;
  passTurn: string;
  boneyard: string;
  leftEndBadge: string;
  rightEndBadge: string;
  boardEmpty: string;
  playOnTablePrompt: string;
  playLeft: string;
  playRight: string;
  playStart: string;
  selectedTilePrompt: string;
  cancel: string;
  dominoWin: string;
  matchWinner: string;
  players: string;
  actions: string;
  loading: string;
  language: string;
  english: string;
  arabic: string;
  teamA: string;
  teamB: string;
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
    minPlayersNotice: "Requires at least 2 players (or exactly 4 for 2v2 Teams).",
    startTable: "Start Domino Table",
    nextRound: "Start Next Round",
    playAgain: "Play Again (Reset Scores)",
    leaveRoom: "Leave Table",
    yourTurn: "It's your turn to play!",
    drawTile: "Draw from Boneyard",
    passTurn: "Pass Turn (باص)",
    boneyard: "Boneyard (Draw Pile)",
    leftEndBadge: "Left End",
    rightEndBadge: "Right End",
    boardEmpty: "Table is empty. Select a tile below, then tap the table target to open!",
    playOnTablePrompt: "Tap the glowing target on the table (Left or Right) to place this tile!",
    playLeft: "Play Left",
    playRight: "Play Right",
    playStart: "Play First Tile Here",
    selectedTilePrompt: "Selected Tile",
    cancel: "Cancel",
    dominoWin: "Round Winner",
    matchWinner: "🏆 MATCH CHAMPION 🏆",
    players: "Players & Scoreboard",
    actions: "Table Event Log",
    loading: "Loading table...",
    language: "Language",
    english: "English",
    arabic: "العربية",
    teamA: "Team 1 (Seats 1 & 3)",
    teamB: "Team 2 (Seats 2 & 4)",
  },
  ar: {
    back: "العودة للقائمة",
    room: "الطاولة",
    waiting: "في انتظار اكتمال اللاعبين",
    playing: "الجولة جارية",
    finished: "انتهت المباراة",
    round: "الجولة",
    threshold: "الهدف",
    minPlayersNotice: "تحتاج إلى لاعبين اثنين على الأقل (أو 4 بالضبط في لعب الفرق).",
    startTable: "بدء اللعب على الطاولة",
    nextRound: "بدء الجولة التالية",
    playAgain: "لعب طاولة جديدة (تصفير النقط)",
    leaveRoom: "مغادرة الطاولة",
    yourTurn: "دورك الآن في النزول!",
    drawTile: "اسحب حبة من البلاطة",
    passTurn: "باص (تمرير الدور)",
    boneyard: "البلاطة (السحب)",
    leftEndBadge: "الطرف الأيسر",
    rightEndBadge: "الطرف الأيمن",
    boardEmpty: "الطاولة خالية. اختر حبة من يدك بالأسفل ثم انقر على الطاولة للنزول!",
    playOnTablePrompt: "المس الطرف المضاء على الطاولة (يسار أو يمين) لإنزال هذه الحبة!",
    playLeft: "نزول يسار",
    playRight: "نزول يمين",
    playStart: "انزل بالحبة الأولى هنا",
    selectedTilePrompt: "الحبة المختارة",
    cancel: "إلغاء",
    dominoWin: "فائز الجولة",
    matchWinner: "🏆 بطل الطاولة 🏆",
    players: "اللاعبون ولوحة النقط",
    actions: "سجل أحداث الطاولة",
    loading: "جارٍ تحميل الطاولة...",
    language: "اللغة",
    english: "English",
    arabic: "العربية",
    teamA: "فريق ١ (مقاعد ١ و٣)",
    teamB: "فريق ٢ (مقاعد ٢ و٤)",
  },
};

// Web Audio sound effects for authentic domino table feel
function playDominoSound(type: "clack" | "draw" | "pass" | "win") {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === "clack") {
      // Wood/ivory table clack
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === "draw") {
      // Tile slide sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(250, now);
      osc.frequency.linearRampToValueAtTime(450, now + 0.1);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === "pass") {
      // Gentle knock / pass
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(180, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === "win") {
      // Winning fanfare
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.1);
      osc.frequency.setValueAtTime(783.99, now + 0.2);
      osc.frequency.setValueAtTime(1046.5, now + 0.35);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.6);
    }
  } catch {
    // Ignore audio errors
  }
}

export default function DominoRoomClient({ roomCode }: { roomCode: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") === "ar" ? "ar" : "en";
  const t = DICTIONARY[lang];

  const [roomData, setRoomData] = useState<RoomPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [selectedTile, setSelectedTile] = useState<DominoTile | null>(null);
  const [isTableRotated, setIsTableRotated] = useState(false);

  const links = useMemo(
    () => ({
      lobby: `/games/domino?lang=${lang}`,
      en: `/games/domino/${roomCode}?lang=en`,
      ar: `/games/domino/${roomCode}?lang=ar`,
    }),
    [lang, roomCode],
  );

  useEffect(() => {
    let running = true;

    const load = async () => {
      const response = await fetch(`/api/games/domino/rooms/${roomCode}`, {
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
    const response = await fetch(`/api/games/domino/rooms/${roomCode}/action`, {
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
    setSelectedTile(null);

    const refreshRes = await fetch(`/api/games/domino/rooms/${roomCode}`, {
      cache: "no-store",
    });
    if (refreshRes.ok) {
      const refreshed = (await refreshRes.json()) as RoomPayload;
      setRoomData(refreshed);
    }
  }

  const onStartGame = async () => {
    setBusy(true);
    const response = await fetch(`/api/games/domino/rooms/${roomCode}/start`, {
      method: "POST",
    });
    const data = (await response.json()) as { error?: string; ok?: boolean };
    setBusy(false);
    if (!response.ok) {
      setError(data.error ?? "Could not start table.");
      return;
    }
    playDominoSound("clack");
  };

  const onTileClick = (tile: DominoTile) => {
    if (!roomData?.selfPlayer.isMyTurn) return;

    const { isPlayable } = isTilePlayable(
      tile,
      roomData.room.leftEnd,
      roomData.room.rightEnd,
    );

    if (!isPlayable) return;

    // Toggle selection: if already selected, deselect
    if (selectedTile && selectedTile[0] === tile[0] && selectedTile[1] === tile[1]) {
      setSelectedTile(null);
      return;
    }

    setSelectedTile(tile);
  };

  const onPlaySelectedSide = (side: "LEFT" | "RIGHT") => {
    if (!selectedTile) return;
    playDominoSound("clack");
    callAction({ type: "PLAY_TILE", tile: selectedTile, side });
    setSelectedTile(null);
  };

  const onDrawTile = () => {
    playDominoSound("draw");
    callAction({ type: "DRAW_TILE" });
  };

  const onPassTurn = () => {
    playDominoSound("pass");
    callAction({ type: "PASS_TURN" });
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

  const canStart =
    selfPlayer.isHost &&
    room.status === "WAITING" &&
    ((room.mode === "SOLO" && playerCount >= 2 && playerCount <= 4) ||
      (room.mode === "TEAMS" && playerCount === 4));

  const isRoundOver = room.currentPhase === "ROUND_OVER" || room.status === "FINISHED";
  const isMatchFinished = room.status === "FINISHED";

  // Check if player has any playable tile in hand
  const hasPlayableTile = selfPlayer.hand.some(
    (tile) => isTilePlayable(tile, room.leftEnd, room.rightEnd).isPlayable,
  );

  const canDraw = selfPlayer.isMyTurn && !hasPlayableTile && room.boneyardCount > 0;
  const canPass = selfPlayer.isMyTurn && !hasPlayableTile && room.boneyardCount === 0;

  const selectedPlayability = selectedTile
    ? isTilePlayable(selectedTile, room.leftEnd, room.rightEnd)
    : null;
  const canSelectedPlayLeft = selectedPlayability?.canPlayLeft ?? false;
  const canSelectedPlayRight = selectedPlayability?.canPlayRight ?? false;

  return (
    <main
      className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-5 px-4 sm:px-6 py-8"
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
                ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold"
                : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
            href={links.en}
          >
            EN
          </Link>
          <Link
            className={`rounded-lg border px-2.5 py-1 transition ${
              lang === "ar"
                ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold"
                : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
            href={links.ar}
          >
            عربي
          </Link>
        </div>
      </div>

      {/* Main Table Banner & Score */}
      <section className="rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 p-5 sm:p-6 shadow-sm backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🀄</span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
                {room.title}
              </h1>
            </div>
            <p className="mt-1 font-mono text-xs text-zinc-500 dark:text-zinc-400">
              {t.room}: <span className="font-bold text-emerald-600 dark:text-emerald-400">#{room.roomCode}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-200">
              {room.mode === "TEAMS" ? "👥 Teams 2v2" : "👤 Solo"}
            </span>
            <span className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 text-xs font-bold text-zinc-800 dark:text-zinc-200">
              {t.round} {room.roundNumber} · 🎯 {t.threshold}: {room.scoreLimit} pts
            </span>
          </div>
        </div>

        {/* Teams Match Scoreboard */}
        {room.mode === "TEAMS" && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-3 text-center">
              <p className="text-xs font-bold uppercase text-indigo-700 dark:text-indigo-300">{t.teamA}</p>
              <p className="text-2xl font-extrabold text-indigo-950 dark:text-indigo-100 font-mono">
                {room.teamAScore} <span className="text-xs font-normal opacity-70">/ {room.scoreLimit} pts</span>
              </p>
            </div>
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-center">
              <p className="text-xs font-bold uppercase text-amber-700 dark:text-amber-300">{t.teamB}</p>
              <p className="text-2xl font-extrabold text-amber-950 dark:text-amber-100 font-mono">
                {room.teamBScore} <span className="text-xs font-normal opacity-70">/ {room.scoreLimit} pts</span>
              </p>
            </div>
          </div>
        )}

        {/* LOBBY / WAITING STATE */}
        {room.status === "WAITING" && (
          <div className="mt-5 space-y-4 text-center py-6">
            <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-3xl">
              🀄
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
                  className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3.5 font-bold text-white hover:from-emerald-500 hover:to-teal-500 transition disabled:opacity-50 cursor-pointer shadow-lg shadow-emerald-600/20"
                >
                  {t.startTable} ({playerCount} Players)
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ACTIVE DOMINO FELT TABLE BOARD & INTEGRATED PLAYER DOCK */}
      {room.status !== "WAITING" && (
        <>
          <MobileTableRotation
            lang={lang}
            isRotated={isTableRotated}
            onToggleRotate={() => setIsTableRotated(!isTableRotated)}
            gameName="Domino"
          />

          <section
            className={`relative rounded-3xl border-4 border-yellow-400/80 bg-gradient-to-b from-[#153a7f] via-[#1a449c] to-[#0d2252] shadow-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 w-full h-[calc(100dvh-100px)] min-h-[520px] max-h-[840px] select-none ${
              isTableRotated ? "table-force-landscape" : ""
            }`}
            style={{
              backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.08) 0%, transparent 80%), radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.05) 0%, transparent 60%)`,
            }}
          >
            {/* TOP BAR: Scoreboard & Opponent Rack (Exact match to image aesthetic) */}
            <div className="z-10 bg-[#0c1f47]/90 backdrop-blur-md border-b-2 border-yellow-400/90 px-3 py-2 flex flex-col">
              <div className="flex items-center justify-between gap-2">
                {/* Left: Back / Exit table button */}
                <Link
                  href={links.lobby}
                  className="rounded-xl bg-white/10 hover:bg-white/20 p-2 text-white text-xs font-bold transition flex items-center gap-1 border border-white/15"
                  title={t.back}
                >
                  <span>⚙️</span>
                  <span className="hidden sm:inline">{t.back}</span>
                </Link>

                {/* Center: Score Display: YOU [score] - [score] OPPONENT */}
                {(() => {
                  const opponents = room.players.filter((p) => p.id !== selfPlayer.id);
                  const primaryOpp = opponents[0];
                  const oppScore =
                    room.mode === "TEAMS"
                      ? selfPlayer.team === "TEAM_A"
                        ? room.teamBScore
                        : room.teamAScore
                      : primaryOpp?.score ?? 0;
                  const oppName =
                    room.mode === "TEAMS"
                      ? selfPlayer.team === "TEAM_A"
                        ? t.teamB
                        : t.teamA
                      : primaryOpp?.displayName ?? (lang === "ar" ? "الخصم" : "PLAYER 2");
                  const myScore =
                    room.mode === "TEAMS"
                      ? selfPlayer.team === "TEAM_A"
                        ? room.teamAScore
                        : room.teamBScore
                      : selfPlayer.score;

                  return (
                    <div className="flex items-center gap-3 sm:gap-5 px-3 py-1 rounded-2xl bg-black/40 border border-yellow-400/30 font-mono shadow-inner">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-yellow-300">YOU</span>
                        <span className="text-xl sm:text-2xl font-black text-white">{myScore}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] uppercase font-bold text-yellow-400/80">
                          {room.roundNumber}st
                        </span>
                        <span className="text-sm font-black text-yellow-400 leading-none">—</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xl sm:text-2xl font-black text-white">{oppScore}</span>
                        <span className="text-[11px] font-bold text-zinc-300 max-w-[80px] sm:max-w-[120px] truncate">
                          {oppName}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Right: Boneyard status & Table rotation */}
                <div className="flex items-center gap-2">
                  <span className="rounded-xl bg-black/40 border border-white/15 px-2.5 py-1 text-xs text-yellow-300 font-bold font-mono">
                    🀄 {room.boneyardCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsTableRotated(!isTableRotated)}
                    className="rounded-xl bg-white/10 hover:bg-white/20 p-2 text-white text-xs font-bold transition border border-white/15 cursor-pointer"
                    title="Rotate Table"
                  >
                    🔄
                  </button>
                </div>
              </div>

              {/* Opponent's Hand Rack Peeking Under the Gold Bar */}
              <div className="flex items-center justify-center gap-1.5 pt-1.5 pb-0.5 overflow-hidden">
                {room.players
                  .filter((p) => p.id !== selfPlayer.id)
                  .map((opp) => (
                    <div key={opp.id} className="flex items-center gap-1">
                      {Array.from({ length: Math.min(opp.tilesCount, 7) }).map((_, i) => (
                        <div
                          key={i}
                          className="w-5 h-7 sm:w-6 sm:h-8 rounded-sm sm:rounded bg-gradient-to-b from-white to-slate-200 border border-slate-400 shadow-md flex items-center justify-center"
                        >
                          <div className="w-2.5 h-3.5 border border-slate-300 rounded-[1px] bg-slate-50/60" />
                        </div>
                      ))}
                      {opp.tilesCount > 7 && (
                        <span className="text-[10px] font-mono text-yellow-300 font-bold">
                          +{opp.tilesCount - 7}
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {/* CENTER ARENA: Auto-Turning Domino Snake Board (ZERO SCROLL) */}
            <div className="flex-1 min-h-0 relative p-2 sm:p-4 overflow-hidden flex items-center justify-center">
              <DominoSnakeBoard
                boardTiles={room.boardTiles}
                selectedTile={selectedTile}
                canPlayLeft={canSelectedPlayLeft}
                canPlayRight={canSelectedPlayRight}
                leftEnd={room.leftEnd}
                rightEnd={room.rightEnd}
                isMyTurn={selfPlayer.isMyTurn}
                busy={busy}
                onPlaySide={onPlaySelectedSide}
                lang={lang}
              />
            </div>

            {/* BOTTOM DOCK: Player's Hand on the Table (Exact match to image aesthetic) */}
            <div className="z-10 bg-[#091a3e]/90 backdrop-blur-md border-t-2 border-yellow-400/80 p-2 sm:p-3 flex flex-col items-center">
              {/* Turn Announcement & Actions Header */}
              <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-2 px-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-yellow-300/90">
                    {lang === "ar" ? "أوراقك" : "Your Hand"} ({selfPlayer.hand.length})
                  </span>
                  {selfPlayer.isMyTurn && (
                    <span className="rounded-full bg-emerald-500 text-white px-2.5 py-0.5 text-[10px] font-black animate-pulse shadow-md">
                      {t.yourTurn}
                    </span>
                  )}
                </div>

                {/* Draw / Pass Actions */}
                {selfPlayer.isMyTurn && (
                  <div className="flex items-center gap-2">
                    {canDraw && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={onDrawTile}
                        className="rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 px-3 py-1.5 text-xs font-black text-zinc-950 hover:brightness-110 active:scale-95 transition cursor-pointer shadow-lg"
                      >
                        📥 {t.drawTile} ({room.boneyardCount})
                      </button>
                    )}
                    {canPass && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={onPassTurn}
                        className="rounded-xl bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-xs font-black text-white active:scale-95 transition cursor-pointer border border-white/20 shadow-md"
                      >
                        ⏭️ {t.passTurn}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Selected Tile Helper Indicator */}
              {selfPlayer.isMyTurn && selectedTile && (
                <div className="w-full mb-2 flex items-center justify-between px-3 py-1.5 rounded-xl bg-yellow-400/20 border border-yellow-400/40 text-xs text-yellow-200">
                  <div className="flex items-center gap-2 font-bold truncate">
                    <span>🎯 {t.selectedTilePrompt}:</span>
                    <span className="font-mono font-black text-sm bg-black/40 px-2 py-0.5 rounded text-yellow-300">
                      [{selectedTile[0]}|{selectedTile[1]}]
                    </span>
                    <span className="font-normal opacity-90 hidden sm:inline">— {t.playOnTablePrompt}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedTile(null)}
                    className="shrink-0 px-2 py-0.5 rounded-lg border border-yellow-400/40 hover:bg-yellow-400/20 text-xs font-semibold cursor-pointer transition"
                  >
                    {t.cancel}
                  </button>
                </div>
              )}

              {/* Domino Tiles in Player's Hand (All fit in one row, ZERO scroll) */}
              <div className="w-full flex items-center justify-center gap-1.5 sm:gap-2.5 pb-1 overflow-x-hidden">
                {selfPlayer.hand.map((tile, idx) => {
                  const playability = isTilePlayable(tile, room.leftEnd, room.rightEnd);
                  const playableNow = selfPlayer.isMyTurn && playability.isPlayable;
                  const isSelected =
                    selectedTile !== null &&
                    selectedTile[0] === tile[0] &&
                    selectedTile[1] === tile[1];

                  return (
                    <DominoTileView
                      key={idx}
                      tile={tile}
                      orientation="vertical"
                      size="responsive"
                      isPlayable={playableNow}
                      isSelected={isSelected}
                      onClick={() => onTileClick(tile)}
                    />
                  );
                })}
              </div>
            </div>
          </section>
        </>
      )}

      {/* ROUND OVER / MATCH CHAMPION NOTIFICATION */}
      {isRoundOver && (
        <section className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-6 text-center space-y-4 shadow-xl">
          {isMatchFinished ? (
            <div className="space-y-3">
              <div className="text-5xl">🏆👑🎉</div>
              <h2 className="text-2xl sm:text-3xl font-black text-amber-900 dark:text-amber-200">
                {t.matchWinner}
              </h2>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">
                {room.roundResultSummary}
              </p>
              {selfPlayer.isHost && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={onReplay}
                  className="mt-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 font-bold text-white hover:opacity-95 transition cursor-pointer shadow-md"
                >
                  {t.playAgain}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-4xl">🏁</div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                Round {room.roundNumber} Complete!
              </h3>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 font-medium max-w-lg mx-auto">
                {room.roundResultSummary}
              </p>
              {selfPlayer.isHost && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={onNextRound}
                  className="mt-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 font-bold text-white hover:from-emerald-500 hover:to-teal-500 transition cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  {t.nextRound} →
                </button>
              )}
            </div>
          )}
        </section>
      )}

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
            {playerCount} Players
          </span>
        </div>

        <div className="grid gap-2.5">
          {room.players.map((player) => {
            const isSelf = player.id === selfPlayer.id;
            const isTurn = player.id === room.currentTurnPlayerId;

            return (
              <div
                key={player.id}
                className={`flex items-center justify-between rounded-2xl border p-3.5 text-sm transition ${
                  isTurn
                    ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500"
                    : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs text-zinc-400">Seat {player.seatIndex + 1}</span>
                  <PlayerBadge
                    name={player.displayName}
                    playerId={player.id}
                    userId={player.userId}
                    isSelf={isSelf}
                    isHost={player.isHost}
                    size="md"
                    lang={lang}
                  />
                  {player.team && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                      {player.team === "TEAM_A" ? "Team 1" : "Team 2"}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* Remaining tiles or revealed pip count if round over */}
                  {isRoundOver && player.pipSum !== null ? (
                    <span className="text-xs font-bold text-zinc-500">
                      [{player.pipSum} pips]
                    </span>
                  ) : (
                    <span className="text-xs font-mono text-zinc-500">
                      🀄 {player.tilesCount} tiles
                    </span>
                  )}

                  <div className="flex items-center gap-1.5 font-mono font-bold text-xs">
                    <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                      {player.score}
                    </span>
                    <span className="opacity-60">/ {room.scoreLimit} pts</span>
                  </div>

                  {isTurn && <span className="text-sm animate-bounce">🎯</span>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Live Event Log */}
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
                <span className="ml-1.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {action.value}
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
