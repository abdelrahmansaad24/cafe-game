"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ScrewCardView } from "@/components/screw-card";
import { GameTableShell } from "@/components/game-table-shell";
import {
  calculateGridPoints,
  SCREW_ACTION_DETAILS,
  ScrewCard,
  ScrewCardType,
} from "@/lib/games/screw-types";

type RoomPayload = {
  room: {
    id: string;
    roomCode: string;
    title: string;
    visibility: "PUBLIC" | "PRIVATE";
    mode: "SOLO" | "TEAMS";
    cardsPerPlayer: number;
    scoreLimit: number;
    turnTimerSeconds: number;
    turnStartedAt: string | null;
    doubleFinalRound: boolean;
    screwPenaltyType: string;
    status: "WAITING" | "PLAYING" | "FINISHED";
    currentPhase: "PEEKING" | "PLAYING" | "FINAL_TURNS" | "ROUND_OVER" | "FINISHED";
    roundNumber: number;
    currentTurnPlayerId: string | null;
    screwCallerId: string | null;
    finalTurnsRemaining: number;
    topDiscardCard: ScrewCard | null;
    drawDeckCount: number;
    discardPileCount: number;
    activeDrawnCard: ScrewCard | null;
    activeDrawnFrom: "DECK" | "DISCARD" | null;
    pendingAction: { type: ScrewCardType; [key: string]: unknown } | null;
    roundWinnerId: string | null;
    roundResultSummary: string | null;
    createdById: string;
    winnerId: string | null;
    players: Array<{
      id: string;
      userId: string;
      displayName: string;
      seatIndex: number;
      team: "TEAM_A" | "TEAM_B" | null;
      score: number;
      initialPeekDone: boolean;
      grid: Array<{
        id: string;
        slotIndex: number;
        card: ScrewCard | null;
        isKnownToMe: boolean;
      }>;
      cardsCount: number;
      totalPoints: number | null;
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
    team: "TEAM_A" | "TEAM_B" | null;
    score: number;
    initialPeekDone: boolean;
    isHost: boolean;
    isMyTurn: boolean;
  };
};

type Dictionary = {
  back: string;
  room: string;
  waiting: string;
  peekingPhase: string;
  playing: string;
  finalTurns: string;
  finished: string;
  round: string;
  threshold: string;
  minPlayersNotice: string;
  startTable: string;
  nextRound: string;
  playAgain: string;
  leaveRoom: string;
  yourTurn: string;
  drawFromDeck: string;
  drawFromDiscard: string;
  drawnCardTitle: string;
  swapWithGrid: string;
  discardDrawn: string;
  shoutScrew: string;
  screwCalledBanner: string;
  peekingNotice: string;
  memorizeDone: string;
  scoreboard: string;
  tableLog: string;
  loading: string;
  language: string;
  pingPongTitle: string;
  pingPongDesc: string;
  doSwap: string;
  keepCards: string;
  thiefTitle: string;
  thiefDesc: string;
  stealButton: string;
  peekModalTitle: string;
  dismiss: string;
  teamA: string;
  teamB: string;
};

const DICTIONARY: Record<"en" | "ar", Dictionary> = {
  en: {
    back: "Back to Lobby",
    room: "Table",
    waiting: "Waiting for Players",
    peekingPhase: "Memorizing Phase (Peek 2 cards)",
    playing: "Round in Progress",
    finalTurns: "Final Turn Round!",
    finished: "Match Finished",
    round: "Round",
    threshold: "Penalty Limit",
    minPlayersNotice: "Requires at least 2 players to start.",
    startTable: "Start Screw Game",
    nextRound: "Start Next Round",
    playAgain: "Play Again (Reset Scores)",
    leaveRoom: "Leave Table",
    yourTurn: "It's your turn!",
    drawFromDeck: "Draw from Deck",
    drawFromDiscard: "Take Discard Card",
    drawnCardTitle: "You drew:",
    swapWithGrid: "Swap with a card in your grid (click slot below)",
    discardDrawn: "Discard to pile & activate action",
    shoutScrew: "🚨 CALL SCREW! 🚨",
    screwCalledBanner: "called SCREW! One final turn for everyone!",
    peekingNotice: "Memorize your bottom 2 cards below. Once you press Ready, all cards flip face-down!",
    memorizeDone: "I Memorized My Cards (Ready!)",
    scoreboard: "Players & Scores",
    tableLog: "Table Activity Log",
    loading: "Loading Screw Table...",
    language: "Language",
    pingPongTitle: "🏓 Ping Pong Action!",
    pingPongDesc: "Compare your card and opponent's card below. Decide whether to swap them!",
    doSwap: "🔁 Swap Cards",
    keepCards: "❌ Keep Without Swapping",
    thiefTitle: "🦹 The Thief (الحرامي) Action!",
    thiefDesc: "You peeked at opponent's card below! Now select which card in your grid to exchange for it:",
    stealButton: "🦹 Steal This Card!",
    peekModalTitle: "👁️ Secret Card Peek",
    dismiss: "Got It (Dismiss)",
    teamA: "Team 1",
    teamB: "Team 2",
  },
  ar: {
    back: "العودة للقائمة",
    room: "الطاولة",
    waiting: "في انتظار اكتمال اللاعبين",
    peekingPhase: "مرحلة الحفظ (بص في كرتين)",
    playing: "الجولة جارية",
    finalTurns: "الدور الأخير للجميع!",
    finished: "انتهت المباراة",
    round: "الجولة",
    threshold: "حد العقوبة",
    minPlayersNotice: "تحتاج إلى لاعبين اثنين على الأقل لبدء اللعب.",
    startTable: "بدء مباراة سكرو",
    nextRound: "بدء الجولة التالية",
    playAgain: "لعب طاولة جديدة (تصفير النقط)",
    leaveRoom: "مغادرة الطاولة",
    yourTurn: "دورك الآن في اللعب!",
    drawFromDeck: "اسحب من الكومة المغطاة",
    drawFromDiscard: "خذ الكرت المكشوف",
    drawnCardTitle: "أنت سحبت الكرت التالي:",
    swapWithGrid: "بدّل مع كرت من كروتك (المس مكانه بالأسفل)",
    discardDrawn: "ارمِ في الكومة وفعل الخاصية",
    shoutScrew: "🚨 صرخة سكرو! (SCREW!) 🚨",
    screwCalledBanner: "صرخ سكرو! باقي دور أخير لكل لاعب!",
    peekingNotice: "احفظ كرتيك بالأسفل جيداً، بمجرد الضغط على جاهز ستقلب كل الكروت على ظهرها!",
    memorizeDone: "حفظت كروتي (أنا جاهز!)",
    scoreboard: "اللاعبون ولوحة النقط",
    tableLog: "سجل أحداث الطاولة",
    loading: "جارٍ تحميل طاولة سكرو...",
    language: "اللغة",
    pingPongTitle: "🏓 خاصية بينج بونج!",
    pingPongDesc: "قارن بين كرتك وكرت الخصم بالأسفل، وقرر هل تبدلهم أو تتركهم!",
    doSwap: "🔁 بدّل الكرتين",
    keepCards: "❌ اترك الكروت دون تبديل",
    thiefTitle: "🦹 خاصية الحرامي!",
    thiefDesc: "كشفت كرت الخصم بالأسفل! الآن اختر كرت من شبكتك لسرقته واعطائه كرتك:",
    stealButton: "🦹 اسرق الكرت الآن!",
    peekModalTitle: "👁️ كشف كرت في السر",
    dismiss: "فهمت وحفظت الكرت",
    teamA: "الفريق الأول",
    teamB: "الفريق الثاني",
  },
};

function playScrewSound(
  type:
    | "draw"
    | "swap"
    | "peek"
    | "pingpong"
    | "theif"
    | "screw"
    | "tick"
    | "basraSuccess"
    | "basraFail"
    | "win",
) {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === "draw") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.linearRampToValueAtTime(600, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === "swap") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.12);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === "theif") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(750, now + 0.2);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === "pingpong") {
      [800, 700].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.3, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.06);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.06);
      });
    } else if (type === "basraSuccess") {
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.07);
        gain.gain.setValueAtTime(0.3, now + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.07 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 0.2);
      });
    } else if (type === "basraFail") {
      [320, 240, 180].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, now + i * 0.12);
        gain.gain.setValueAtTime(0.3, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.12 + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.15);
      });
    } else if (type === "screw") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(880, now + 0.15);
      osc.frequency.linearRampToValueAtTime(440, now + 0.3);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === "peek") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(520, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
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

export default function ScrewRoomClient({ roomCode }: { roomCode: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") === "ar" ? "ar" : "en";
  const t = DICTIONARY[lang];

  const [roomData, setRoomData] = useState<RoomPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [selectedSelfSlot, setSelectedSelfSlot] = useState<number | null>(null);

  const [pingPongModalData, setPingPongModalData] = useState<{
    mySlotIndex: number;
    myCard: ScrewCard | null;
    oppPlayerId: string;
    oppSlotIndex: number;
    oppCard: ScrewCard | null;
  } | null>(null);

  const [thiefModalData, setThiefModalData] = useState<{
    oppPlayerId: string;
    oppSlotIndex: number;
    oppCard: ScrewCard | null;
    oppPlayerName: string;
  } | null>(null);

  const [peekInspection, setPeekInspection] = useState<{
    card: ScrewCard | null;
    title: string;
    desc: string;
  } | null>(null);

  const [basraMode, setBasraMode] = useState(false);
  const [basraFeedback, setBasraFeedback] = useState<{
    isMatch: boolean;
    message: string;
  } | null>(null);

  const links = useMemo(
    () => ({
      lobby: `/games/screw?lang=${lang}`,
      en: `/games/screw/${roomCode}?lang=en`,
      ar: `/games/screw/${roomCode}?lang=ar`,
    }),
    [lang, roomCode],
  );

  useEffect(() => {
    let running = true;

    const load = async () => {
      const response = await fetch(`/api/games/screw/rooms/${roomCode}`, {
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
        playScrewSound("tick");
      }

      if (remaining === 0 && roomData.selfPlayer.isMyTurn && !busy) {
        if (roomData.room.activeDrawnCard) {
          onDiscardDrawn();
        } else if (!roomData.room.pendingAction) {
          onDrawCard("DECK");
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
    busy,
  ]);

  async function callAction(payload: { type: string; [key: string]: unknown }) {
    setBusy(true);
    const response = await fetch(`/api/games/screw/rooms/${roomCode}/action`, {
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
    setSelectedSelfSlot(null);
    setPingPongModalData(null);
    setThiefModalData(null);

    const refreshRes = await fetch(`/api/games/screw/rooms/${roomCode}`, {
      cache: "no-store",
    });
    if (refreshRes.ok) {
      const refreshed = (await refreshRes.json()) as RoomPayload;
      setRoomData(refreshed);
    }
  }

  const onStartGame = async () => {
    setBusy(true);
    const response = await fetch(`/api/games/screw/rooms/${roomCode}/start`, {
      method: "POST",
    });
    const data = (await response.json()) as { error?: string; ok?: boolean };
    setBusy(false);
    if (!response.ok) {
      setError(data.error ?? "Could not start table.");
      return;
    }
    playScrewSound("draw");
  };

  const onFinishInitialPeek = () => {
    playScrewSound("peek");
    callAction({ type: "FINISH_INITIAL_PEEK" });
  };

  const onDrawCard = (source: "DECK" | "DISCARD") => {
    playScrewSound("draw");
    callAction({ type: "DRAW_CARD", source });
  };

  const onReplaceSlot = (slotIndex: number) => {
    playScrewSound("swap");
    callAction({ type: "REPLACE_SLOT", slotIndex });
  };

  const onDiscardDrawn = () => {
    playScrewSound("swap");
    callAction({ type: "DISCARD_DRAWN" });
  };

  const onCallScrew = () => {
    playScrewSound("screw");
    callAction({ type: "CALL_SCREW" });
  };

  const onDeclareBasra = async (slotIndex: number) => {
    setBasraMode(false);
    setBusy(true);
    const response = await fetch(`/api/games/screw/rooms/${roomCode}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "BASRA", slotIndex }),
    });
    const data = (await response.json()) as {
      error?: string;
      ok?: boolean;
      isMatch?: boolean;
      messageAr?: string;
      messageEn?: string;
    };
    setBusy(false);

    if (!response.ok) {
      setError(data.error ?? "Basra attempt failed.");
      return;
    }

    if (data.isMatch) {
      playScrewSound("basraSuccess");
    } else {
      playScrewSound("basraFail");
    }

    setBasraFeedback({
      isMatch: Boolean(data.isMatch),
      message: lang === "ar" ? data.messageAr || "" : data.messageEn || "",
    });

    setTimeout(() => {
      setBasraFeedback(null);
    }, 4500);

    const refreshRes = await fetch(`/api/games/screw/rooms/${roomCode}`, {
      cache: "no-store",
    });
    if (refreshRes.ok) {
      const refreshed = (await refreshRes.json()) as RoomPayload;
      setRoomData(refreshed);
    }
  };

  const onSelfSlotClick = (slotIndex: number) => {
    if (basraMode) {
      onDeclareBasra(slotIndex);
      return;
    }

    if (!roomData?.selfPlayer.isMyTurn) return;

    if (roomData.room.activeDrawnCard && !roomData.room.pendingAction) {
      onReplaceSlot(slotIndex);
      return;
    }

    const action = roomData.room.pendingAction;
    if (action) {
      if (action.type === "PEEK_SELF") {
        playScrewSound("peek");
        const myCard = myGrid[slotIndex]?.card ?? null;
        setPeekInspection({
          card: myCard,
          title: lang === "ar" ? "بص في ورقتك 👁️" : "Peek Self 👁️",
          desc: lang === "ar" ? `الكرت في الخانة #${slotIndex + 1} هو:` : `Card in slot #${slotIndex + 1} is:`,
        });
        callAction({
          type: "APPLY_ACTION",
          actionPayload: { type: "PEEK_SELF", selfSlotIndex: slotIndex },
        });
      } else if (action.type === "SWAP" || action.type === "PING_PONG") {
        setSelectedSelfSlot(slotIndex);
      }
    }
  };

  const onOpponentSlotClick = (targetPlayerId: string, slotIndex: number) => {
    if (!roomData?.selfPlayer.isMyTurn) return;
    const action = roomData.room.pendingAction;
    if (!action) return;

    const targetPlayer = roomData.room.players.find((p) => p.id === targetPlayerId);

    if (action.type === "PEEK_OTHER") {
      playScrewSound("peek");
      const oppCard = targetPlayer?.grid[slotIndex]?.card ?? null;
      setPeekInspection({
        card: oppCard,
        title: lang === "ar" ? `بص في ورقة ${targetPlayer?.displayName} 🕵️` : `Peeked ${targetPlayer?.displayName}'s card 🕵️`,
        desc: lang === "ar" ? `الكرت في الخانة #${slotIndex + 1} هو:` : `Card in slot #${slotIndex + 1} is:`,
      });
      callAction({
        type: "APPLY_ACTION",
        actionPayload: {
          type: "PEEK_OTHER",
          targetPlayerId,
          targetSlotIndex: slotIndex,
        },
      });
    } else if (action.type === "SWAP") {
      if (selectedSelfSlot === null) {
        setError(lang === "ar" ? "اختر كرت من كروتك أولاً، ثم كرت الخصم!" : "Select your card first, then opponent's!");
        return;
      }
      playScrewSound("swap");
      callAction({
        type: "APPLY_ACTION",
        actionPayload: {
          type: "SWAP",
          selfSlotIndex: selectedSelfSlot,
          targetPlayerId,
          targetSlotIndex: slotIndex,
        },
      });
    } else if (action.type === "PING_PONG") {
      if (selectedSelfSlot === null) {
        setError(lang === "ar" ? "اختر كرت من كروتك أولاً، ثم كرت الخصم!" : "Select your card first, then opponent's!");
        return;
      }
      const myCard = myGrid[selectedSelfSlot]?.card ?? null;
      const oppCard = targetPlayer?.grid[slotIndex]?.card ?? null;

      playScrewSound("pingpong");
      setPingPongModalData({
        mySlotIndex: selectedSelfSlot,
        myCard,
        oppPlayerId: targetPlayerId,
        oppSlotIndex: slotIndex,
        oppCard,
      });
    } else if (action.type === "THE_THIEF") {
      playScrewSound("theif");
      const oppCard = targetPlayer?.grid[slotIndex]?.card ?? null;
      setThiefModalData({
        oppPlayerId: targetPlayerId,
        oppSlotIndex: slotIndex,
        oppCard,
        oppPlayerName: targetPlayer?.displayName || "Opponent",
      });
    }
  };

  const onConfirmPingPong = (doSwap: boolean) => {
    if (!pingPongModalData) return;
    playScrewSound("pingpong");
    callAction({
      type: "APPLY_ACTION",
      actionPayload: {
        type: "PING_PONG",
        selfSlotIndex: pingPongModalData.mySlotIndex,
        targetPlayerId: pingPongModalData.oppPlayerId,
        targetSlotIndex: pingPongModalData.oppSlotIndex,
        doSwap,
      },
    });
  };

  const onConfirmThiefSteal = (selfSlotIndex: number) => {
    if (!thiefModalData) return;
    playScrewSound("theif");
    callAction({
      type: "APPLY_ACTION",
      actionPayload: {
        type: "THE_THIEF",
        selfSlotIndex,
        targetPlayerId: thiefModalData.oppPlayerId,
        targetSlotIndex: thiefModalData.oppSlotIndex,
      },
    });
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
  const isPeekingPhase = room.status === "PLAYING" && room.currentPhase === "PEEKING";
  const isRoundOver = room.currentPhase === "ROUND_OVER" || room.status === "FINISHED";
  const isMatchFinished = room.status === "FINISHED";

  const myGrid = room.players.find((p) => p.id === selfPlayer.id)?.grid || [];
  const screwCallerPlayer = room.players.find((p) => p.id === room.screwCallerId);

  const isTeams = room.mode === "TEAMS";
  const teamAPlayers = room.players.filter((p) => p.team === "TEAM_A");
  const teamBPlayers = room.players.filter((p) => p.team === "TEAM_B");
  const teamAScore = teamAPlayers.reduce((sum, p) => sum + p.score, 0);
  const teamBScore = teamBPlayers.reduce((sum, p) => sum + p.score, 0);

  const getSlotLabel = (idx: number, total: number) => {
    if (total === 6) {
      return idx < 3
        ? lang === "ar" ? `أعلى ${idx + 1}` : `Top ${idx + 1}`
        : lang === "ar" ? `أسفل ${idx + 1}` : `Btm ${idx + 1}`;
    }
    const labelsAr = ["أعلى يسار #1", "أعلى يمين #2", "أسفل يسار #3", "أسفل يمين #4"];
    const labelsEn = ["Top Left #1", "Top Right #2", "Btm Left #3", "Btm Right #4"];
    return lang === "ar" ? labelsAr[idx] || `#${idx + 1}` : labelsEn[idx] || `#${idx + 1}`;
  };

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
            <button type="button" onClick={onLeaveRoom}
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
                <span className="text-2xl">🔩</span>
                <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-50">{room.title}</h1>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {t.round} {room.roundNumber} · 🎴 {room.cardsPerPlayer} Cards · {t.threshold}: <strong className="text-zinc-900 dark:text-zinc-100">{room.scoreLimit} pts</strong>
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4 text-center py-6">
            <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-3xl">
              🔩
            </div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{t.waiting}</h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
              Share code <strong className="font-mono text-amber-600 dark:text-amber-400">#{room.roomCode}</strong> with friends.
              <span className="block mt-1 text-amber-600 dark:text-amber-400 font-semibold">⚠️ {t.minPlayersNotice}</span>
            </p>
            {selfPlayer.isHost && (
              <div className="pt-2 max-w-sm mx-auto">
                <button type="button" disabled={busy || !canStart} onClick={onStartGame}
                  className="w-full rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 px-6 py-3.5 font-bold text-white hover:opacity-95 transition disabled:opacity-50 cursor-pointer shadow-lg shadow-amber-600/20"
                >
                  {t.startTable} ({playerCount}/{isTeams ? "4" : "8"} Players)
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

  // ---- TOP BAR ----
  const topBarContent = (
    <>
      {/* Phase indicator */}
      <span className={`rounded-lg px-2 py-0.5 text-[10px] font-black ${
        room.currentPhase === "PEEKING"
          ? "bg-sky-500/30 text-sky-200 animate-pulse"
          : room.currentPhase === "FINAL_TURNS"
          ? "bg-red-500/30 text-red-200 animate-bounce"
          : "bg-emerald-500/20 text-emerald-200"
      }`}>
        {room.currentPhase === "PEEKING" ? "👁️ PEEK"
          : room.currentPhase === "FINAL_TURNS" ? `🚨 FINAL (${room.finalTurnsRemaining})`
          : `R${room.roundNumber}`}
      </span>

      {/* Score */}
      <span className="rounded-lg bg-black/50 px-2 py-0.5 text-[10px] font-bold text-white border border-white/10">
        {selfPlayer.score}/{room.scoreLimit}
      </span>

      {/* Timer */}
      {secondsRemaining !== null && (
        <span className={`rounded-lg px-2 py-0.5 text-[10px] font-black font-mono ${
          secondsRemaining <= 5
            ? "bg-red-500 text-white animate-bounce"
            : secondsRemaining <= 10
            ? "bg-amber-500 text-zinc-950"
            : "bg-white/10 text-white"
        }`}>
          ⏱️ {secondsRemaining}s
        </span>
      )}

      {/* Deck count */}
      <span className="rounded-lg bg-black/50 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-white/10">
        🎴 {room.drawDeckCount}
      </span>
    </>
  );

  // ---- DOCK HEADER ----
  const dockHeaderContent = (
    <div className="flex flex-wrap items-center justify-between gap-2 px-1">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase text-amber-300/90 tracking-wider">
          {lang === "ar" ? "شبكتك" : "Your Grid"}
        </span>
        {selfPlayer.isMyTurn && (
          <span className="rounded-full bg-amber-500 text-zinc-950 px-2 py-0.5 text-[10px] font-black animate-pulse">
            {t.yourTurn}
          </span>
        )}
        {basraMode && (
          <span className="rounded-full bg-yellow-400 text-zinc-950 px-2 py-0.5 text-[10px] font-black animate-pulse">
            ⚡ BASRA
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        {selfPlayer.isMyTurn && !room.screwCallerId && !room.activeDrawnCard && (
          <button type="button" disabled={busy} onClick={onCallScrew}
            className="rounded-lg bg-gradient-to-r from-red-600 to-amber-600 px-2.5 py-1 text-[10px] font-black text-white hover:opacity-90 transition cursor-pointer animate-pulse"
          >
            🚨 SCREW
          </button>
        )}
      </div>
    </div>
  );

  // ---- DOCK: Player's Card Grid ----
  const dockGrid = (
    <div className={`grid gap-2 ${room.cardsPerPlayer === 6 ? "grid-cols-3" : "grid-cols-2"}`}>
      {myGrid.map((slot) => {
        const isSelected = selectedSelfSlot === slot.slotIndex;
        const isSelectable =
          basraMode ||
          (selfPlayer.isMyTurn &&
            (Boolean(room.activeDrawnCard) || Boolean(room.pendingAction)));

        return (
          <div key={slot.id} className="flex flex-col items-center gap-0.5">
            <ScrewCardView
              card={slot.card}
              faceDown={!slot.card}
              isKnownToMe={slot.isKnownToMe}
              size="md"
              isSelected={isSelected}
              isSelectable={isSelectable}
              className={basraMode ? "ring-2 ring-yellow-400 shadow-lg shadow-yellow-400/40 animate-pulse" : ""}
              onClick={() => onSelfSlotClick(slot.slotIndex)}
            />
            <span className={`text-[8px] font-bold ${basraMode ? "text-yellow-400" : "text-zinc-400"}`}>
              {getSlotLabel(slot.slotIndex, room.cardsPerPlayer)}
            </span>
          </div>
        );
      })}
    </div>
  );

  // ---- ROUND OVER OVERLAY ----
  const roundOverContent = isRoundOver ? (
    <div className="rounded-3xl bg-zinc-950/95 backdrop-blur-xl border border-white/10 p-6 text-center space-y-4 shadow-2xl">
      <div className="text-4xl">🏆</div>
      <h2 className="text-xl font-black text-zinc-50">
        {isMatchFinished ? "🏆 SCREW MATCH CHAMPION 🏆" : "Round Result"}
      </h2>
      {room.roundResultSummary && (
        <p className="text-sm font-bold text-amber-200 max-w-xl mx-auto">{room.roundResultSummary}</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 pt-2">
        {room.players.map((player) => (
          <div key={player.id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-left">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-sm text-white">{player.displayName}</span>
              <span className="font-mono font-bold text-sm text-amber-400">
                {player.totalPoints} pts
              </span>
            </div>
            <div className={`grid gap-1 ${room.cardsPerPlayer === 6 ? "grid-cols-3" : "grid-cols-2"}`}>
              {player.grid.map((slot) => (
                <ScrewCardView key={slot.id} card={slot.card} size="sm" />
              ))}
            </div>
          </div>
        ))}
      </div>

      {selfPlayer.isHost && (
        <div className="pt-3 max-w-xs mx-auto">
          {isMatchFinished ? (
            <button type="button" disabled={busy} onClick={onReplay}
              className="w-full rounded-2xl bg-zinc-100 px-6 py-3 text-sm font-bold text-zinc-900 hover:bg-white transition cursor-pointer shadow-lg"
            >
              🔄 {t.playAgain}
            </button>
          ) : (
            <button type="button" disabled={busy} onClick={onNextRound}
              className="w-full rounded-2xl bg-amber-600 px-6 py-3 text-sm font-bold text-white hover:bg-amber-500 transition cursor-pointer shadow-lg shadow-amber-600/20"
            >
              ⏭️ {t.nextRound}
            </button>
          )}
        </div>
      )}
    </div>
  ) : undefined;

  // ---- MODALS (peek, ping pong, thief, basra feedback, peeking phase) ----
  const modals = (
    <>
      {/* Initial Peeking Phase Banner */}
      {isPeekingPhase && !selfPlayer.initialPeekDone && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-sky-950 border-2 border-sky-400/50 p-5 text-center space-y-3 mb-20 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
            <p className="text-sm font-black text-sky-200">👁️ {t.peekingNotice}</p>
            <button type="button" disabled={busy} onClick={onFinishInitialPeek}
              className="rounded-2xl bg-sky-600 px-6 py-3 font-bold text-white text-xs hover:bg-sky-500 transition shadow-lg cursor-pointer"
            >
              ✅ {t.memorizeDone}
            </button>
          </div>
        </div>
      )}

      {/* Screw Called Siren */}
      {room.screwCallerId && room.currentPhase === "FINAL_TURNS" && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90vw] rounded-2xl border-2 border-red-500/40 bg-red-950/95 p-3 text-red-200 text-xs font-black text-center animate-pulse shadow-2xl">
          🚨 {screwCallerPlayer?.displayName} {t.screwCalledBanner}
        </div>
      )}

      {/* Basra Feedback */}
      {basraFeedback && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90vw] rounded-2xl px-5 py-3 shadow-2xl border-2 flex items-center gap-3 animate-in fade-in zoom-in-95 duration-200 ${
          basraFeedback.isMatch
            ? "bg-emerald-950 border-emerald-400 text-emerald-100 ring-4 ring-emerald-500/30"
            : "bg-red-950 border-red-400 text-red-100 ring-4 ring-red-500/30"
        }`}>
          <span className="text-2xl animate-bounce">{basraFeedback.isMatch ? "💥" : "❌"}</span>
          <span className="text-xs font-black">{basraFeedback.message}</span>
        </div>
      )}

      {/* Action Instruction Banner */}
      {selfPlayer.isMyTurn && room.pendingAction && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90vw] rounded-2xl bg-amber-500/25 border-2 border-amber-400 text-amber-200 text-center text-[10px] font-black p-2.5 animate-pulse shadow-2xl">
          ⚡{" "}
          {room.pendingAction.type === "PEEK_SELF" && (lang === "ar" ? "اختر كرت من شبكتك بالأسفل لرؤيته!" : "Pick a card from your grid below to peek!")}
          {room.pendingAction.type === "PEEK_OTHER" && (lang === "ar" ? "اختر كرت من أي خصم بالأعلى!" : "Pick an opponent's card above to peek!")}
          {room.pendingAction.type === "SWAP" &&
            (selectedSelfSlot === null
              ? (lang === "ar" ? "اختر كرت من شبكتك أولاً!" : "Select your card first!")
              : (lang === "ar" ? "الآن اختر كرت من أي خصم!" : "Now pick opponent's card!"))}
          {room.pendingAction.type === "PING_PONG" &&
            (selectedSelfSlot === null
              ? (lang === "ar" ? "🏓 اختر كرت من شبكتك أولاً!" : "🏓 Select your card first!")
              : (lang === "ar" ? "الآن اختر كرت من أي خصم!" : "Now pick opponent's card!"))}
          {room.pendingAction.type === "THE_THIEF" &&
            (lang === "ar" ? "🦹 اختر كرت من أي خصم لكشفه وسرقته!" : "🦹 Pick opponent's card to steal!")}
        </div>
      )}

      {/* Peek Inspection Modal */}
      {peekInspection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-zinc-900 border-2 border-amber-400/40 p-6 shadow-2xl text-center space-y-4">
            <h3 className="text-base font-black text-white">{peekInspection.title}</h3>
            <p className="text-xs text-zinc-400">{peekInspection.desc}</p>
            <div className="flex justify-center py-2">
              <ScrewCardView card={peekInspection.card} size="lg" className="shadow-2xl" />
            </div>
            <button type="button" onClick={() => setPeekInspection(null)}
              className="w-full rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-amber-500 transition cursor-pointer"
            >
              {t.dismiss}
            </button>
          </div>
        </div>
      )}

      {/* Ping Pong Modal */}
      {pingPongModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-zinc-900 border-2 border-amber-400/40 p-6 shadow-2xl text-center space-y-4">
            <div className="text-3xl">🏓</div>
            <h3 className="text-lg font-black text-white">{t.pingPongTitle}</h3>
            <p className="text-xs text-zinc-400">{t.pingPongDesc}</p>
            <div className="flex items-center justify-center gap-6 py-2">
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-xs font-bold text-amber-400">Your Card</span>
                <ScrewCardView card={pingPongModalData.myCard} size="md" />
              </div>
              <span className="text-2xl font-black text-zinc-500">VS</span>
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-xs font-bold text-rose-400">Opponent Card</span>
                <ScrewCardView card={pingPongModalData.oppCard} size="md" />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button type="button" disabled={busy} onClick={() => onConfirmPingPong(true)}
                className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 px-5 py-2.5 text-xs font-black text-white hover:opacity-90 transition cursor-pointer shadow-lg"
              >
                {t.doSwap}
              </button>
              <button type="button" disabled={busy} onClick={() => onConfirmPingPong(false)}
                className="w-full sm:w-auto rounded-xl border border-zinc-700 bg-zinc-800 px-5 py-2.5 text-xs font-bold text-zinc-300 hover:text-white transition cursor-pointer"
              >
                {t.keepCards}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thief Modal */}
      {thiefModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-zinc-900 border-2 border-emerald-500/50 p-6 shadow-2xl text-center space-y-4">
            <div className="text-3xl">🦹</div>
            <h3 className="text-lg font-black text-white">{t.thiefTitle}</h3>
            <p className="text-xs text-zinc-300">
              {lang === "ar"
                ? `كشفت كرت ${thiefModalData.oppPlayerName}! اختر كرت من عندك لتبديل مكانه وسرقته:`
                : `You peeked at ${thiefModalData.oppPlayerName}'s card! Select which of your slots to exchange:`}
            </p>
            <div className="flex justify-center py-1">
              <ScrewCardView card={thiefModalData.oppCard} size="md" className="shadow-2xl ring-2 ring-emerald-400" />
            </div>
            <div className="pt-2">
              <span className="block text-xs font-bold text-amber-400 mb-2">
                {lang === "ar" ? "اضغط على خانة من كروتك:" : "Click your slot:"}
              </span>
              <div className={`grid gap-2 ${room.cardsPerPlayer === 6 ? "grid-cols-3" : "grid-cols-2"}`}>
                {myGrid.map((slot) => (
                  <button key={slot.id} type="button" disabled={busy}
                    onClick={() => onConfirmThiefSteal(slot.slotIndex)}
                    className="p-2.5 rounded-xl border border-zinc-700 bg-zinc-800 hover:border-emerald-500 hover:bg-emerald-500/10 text-xs font-bold text-zinc-200 transition cursor-pointer flex flex-col items-center"
                  >
                    <span>{getSlotLabel(slot.slotIndex, room.cardsPerPlayer)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // ---- DRAWER CONTENT ----
  const drawerContent = (
    <>
      {/* Language */}
      <div className="rounded-xl bg-white/5 border border-white/10 p-3">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">{t.language}</span>
        <div className="flex items-center gap-2">
          <Link className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
            lang === "en" ? "border-amber-500 bg-amber-500/20 text-amber-300" : "border-white/10 text-zinc-400 hover:bg-white/10"
          }`} href={links.en}>English</Link>
          <Link className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
            lang === "ar" ? "border-amber-500 bg-amber-500/20 text-amber-300" : "border-white/10 text-zinc-400 hover:bg-white/10"
          }`} href={links.ar}>العربية</Link>
        </div>
      </div>

      {/* Teams Score */}
      {isTeams && (
        <div className="rounded-xl bg-white/5 border border-white/10 p-3">
          <span className="text-[10px] font-bold text-zinc-400 uppercase block mb-2">Teams</span>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-2 text-center">
              <p className="text-[10px] font-bold text-sky-300">{t.teamA}</p>
              <p className="text-lg font-black text-white font-mono">{teamAScore}</p>
            </div>
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-center">
              <p className="text-[10px] font-bold text-amber-300">{t.teamB}</p>
              <p className="text-lg font-black text-white font-mono">{teamBScore}</p>
            </div>
          </div>
        </div>
      )}

      {/* Players */}
      <div className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-2">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{t.scoreboard}</span>
        {room.players.map((p) => {
          const isTurn = p.id === room.currentTurnPlayerId && room.status === "PLAYING";
          const isSelf = p.id === selfPlayer.id;
          return (
            <div key={p.id}
              className={`flex items-center justify-between rounded-lg p-2 text-xs transition ${
                isTurn ? "bg-amber-500/15 border border-amber-500/30" : "bg-white/5 border border-white/5"
              }`}
            >
              <span className={`font-bold ${isSelf ? "text-amber-300" : "text-white"}`}>
                {p.displayName} {isSelf && (lang === "ar" ? "(أنت)" : "(You)")}
              </span>
              <span className="font-mono font-bold text-amber-400">{p.score}/{room.scoreLimit}</span>
            </div>
          );
        })}
      </div>

      {/* Event Log */}
      <div className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-2">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{t.tableLog}</span>
        <div className="max-h-48 overflow-y-auto space-y-1.5">
          {room.actions.length === 0 ? (
            <p className="text-[10px] text-zinc-500 italic">No moves yet.</p>
          ) : (
            room.actions.map((act) => (
              <div key={act.id} className="rounded-lg bg-white/5 p-2 text-[10px] text-zinc-400">
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
      theme="screw"
      lang={lang}
      lobbyHref={links.lobby}
      roomCode={roomCode}
      isMyTurn={selfPlayer.isMyTurn}
      onLeave={onLeaveRoom}
      topBar={topBarContent}
      dock={dockGrid}
      dockHeader={dockHeaderContent}
      drawerContent={drawerContent}
      isRoundOver={isRoundOver}
      roundOverContent={roundOverContent}
      error={error}
      busy={busy}
      modals={modals}
    >
      {/* CENTER ARENA: Opponents + Draw/Discard */}
      <div className="absolute inset-0 flex flex-col z-0">
        {/* Opponents Area */}
        <div className="flex flex-wrap items-start justify-center gap-3 pt-2 px-2 z-10 max-h-[45%] overflow-y-auto">
          {opponents.map((opp) => {
            const isTurn = opp.id === room.currentTurnPlayerId;
            const isScrewCaller = opp.id === room.screwCallerId;
            const isTeammate = isTeams && opp.team === selfPlayer.team;

            return (
              <div key={opp.id}
                className={`flex flex-col items-center gap-1.5 rounded-xl p-2 transition ${
                  isTurn ? "bg-amber-400/20 ring-1 ring-amber-400 scale-105" : "bg-black/40 border border-white/10"
                }`}
              >
                <div className="flex items-center gap-1 text-[10px] text-white font-bold">
                  <span className="truncate max-w-[50px]">{opp.displayName}</span>
                  {isTeammate && <span className="text-[8px] text-sky-300">🤝</span>}
                  {isScrewCaller && <span className="text-red-400 text-[8px]">🚨</span>}
                </div>
                <div className={`grid gap-1 ${room.cardsPerPlayer === 6 ? "grid-cols-3" : "grid-cols-2"}`}>
                  {opp.grid.map((slot) => {
                    const isSelectableForAction = Boolean(
                      selfPlayer.isMyTurn &&
                        room.pendingAction &&
                        (room.pendingAction.type === "PEEK_OTHER" ||
                          room.pendingAction.type === "SWAP" ||
                          room.pendingAction.type === "PING_PONG" ||
                          room.pendingAction.type === "THE_THIEF"),
                    );
                    return (
                      <ScrewCardView
                        key={slot.id}
                        card={slot.card}
                        faceDown={!slot.card}
                        isKnownToMe={slot.isKnownToMe}
                        size="sm"
                        isSelectable={isSelectableForAction}
                        onClick={() => onOpponentSlotClick(opp.id, slot.slotIndex)}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Center: Draw Deck + Discard + Drawn Card + Basra */}
        <div className="flex-1 flex flex-wrap items-center justify-center gap-4 sm:gap-6 z-10 px-2">
          {/* Draw Deck */}
          <div className="flex flex-col items-center gap-1">
            <div
              onClick={
                selfPlayer.isMyTurn && !room.activeDrawnCard && !room.pendingAction
                  ? () => onDrawCard("DECK")
                  : undefined
              }
              className={`relative transition ${
                selfPlayer.isMyTurn && !room.activeDrawnCard && !room.pendingAction
                  ? "cursor-pointer hover:scale-105 ring-2 ring-amber-400 rounded-xl"
                  : "opacity-80"
              }`}
            >
              <ScrewCardView faceDown size="md" badge={String(room.drawDeckCount)} />
            </div>
            <span className="text-[8px] font-bold text-zinc-300">{t.drawFromDeck}</span>
          </div>

          {/* Discard Pile */}
          <div className="flex flex-col items-center gap-1">
            <div
              onClick={
                selfPlayer.isMyTurn && !room.activeDrawnCard && !room.pendingAction && room.topDiscardCard
                  ? () => onDrawCard("DISCARD")
                  : undefined
              }
              className={`relative transition ${
                selfPlayer.isMyTurn && !room.activeDrawnCard && !room.pendingAction && room.topDiscardCard
                  ? "cursor-pointer hover:scale-105 ring-2 ring-amber-400 rounded-xl"
                  : "opacity-80"
              }`}
            >
              {room.topDiscardCard ? (
                <ScrewCardView card={room.topDiscardCard} size="md" className="shadow-2xl" />
              ) : (
                <div className="w-16 h-22 rounded-xl border-2 border-dashed border-white/30 flex items-center justify-center text-[10px] text-white/50">
                  Empty
                </div>
              )}
            </div>
            <span className="text-[8px] font-bold text-zinc-300">{t.drawFromDiscard}</span>
          </div>

          {/* Basra Button */}
          {room.status === "PLAYING" && room.topDiscardCard && (
            <div className="flex flex-col items-center gap-1">
              <button type="button" disabled={busy}
                onClick={() => setBasraMode(!basraMode)}
                className={`rounded-xl px-3 py-2 text-[10px] font-black transition cursor-pointer shadow-xl flex items-center gap-1 ${
                  basraMode
                    ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-zinc-950 ring-2 ring-yellow-300 animate-pulse scale-105"
                    : "bg-amber-600/30 border border-amber-400/60 text-amber-200 hover:bg-amber-500 hover:text-zinc-950 hover:scale-105"
                }`}
              >
                <span className="text-sm animate-bounce">⚡</span>
                <span>{basraMode ? (lang === "ar" ? "اضغط كرتك!" : "Tap your slot!") : (lang === "ar" ? "بصرة!" : "Basra!")}</span>
              </button>
            </div>
          )}

          {/* Active Drawn Card */}
          {selfPlayer.isMyTurn && room.activeDrawnCard && (
            <div className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-amber-400/20 border border-amber-400/40 animate-in fade-in">
              <span className="text-[9px] font-black text-amber-300">{t.drawnCardTitle}</span>
              <ScrewCardView card={room.activeDrawnCard} size="md" className="shadow-2xl" />
              {room.activeDrawnFrom === "DECK" && (
                <button type="button" disabled={busy} onClick={onDiscardDrawn}
                  className="rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-[9px] px-2.5 py-1 shadow-md cursor-pointer transition"
                >
                  {t.discardDrawn}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </GameTableShell>
  );
}
