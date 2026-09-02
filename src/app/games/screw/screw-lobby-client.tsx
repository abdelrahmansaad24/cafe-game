"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

type PublicRoom = {
  roomCode: string;
  title: string;
  status: "WAITING" | "PLAYING" | "FINISHED";
  cardsPerPlayer: number;
  scoreLimit: number;
  playerCount: number;
};

type Dictionary = {
  title: string;
  subtitle: string;
  howToPlay: string;
  howToPlayRules: string;
  createRoom: string;
  roomTitle: string;
  visibility: string;
  publicRoom: string;
  privateRoom: string;
  roomPassword: string;
  cardsLayout: string;
  fourCards: string;
  sixCards: string;
  scoreThreshold: string;
  thresholdDesc: string;
  create: string;
  joinByCode: string;
  roomCode: string;
  join: string;
  availableRooms: string;
  openRoom: string;
  playersLabel: string;
  statusWaiting: string;
  statusPlaying: string;
  statusFinished: string;
  language: string;
  english: string;
  arabic: string;
};

const DICTIONARY: Record<"en" | "ar", Dictionary> = {
  en: {
    title: "سكرو (Screw) - Lobby",
    subtitle: "The ultimate memory & bluffing card game! Swap cards, play Ping Pong, and shout 'Screw!'",
    howToPlay: "Screw Rules & Cards",
    howToPlayRules:
      "1. Goal: Have the LOWEST total score when someone calls 'Screw!'.\n" +
      "2. Memory Setup: 4 cards (or 6 cards) dealt face-down. At the start, secretly peek at your bottom 2 cards. Once you press Ready, ALL CARDS FLIP FACE-DOWN! You must remember them from memory!\n" +
      "3. On Your Turn:\n" +
      "   - Draw from Deck (see it privately) OR take top card from Discard Pile.\n" +
      "   - Swap the drawn card into any slot in your grid (discarding old card face-up),\n" +
      "   - OR discard drawn card directly. If it has an action, activate it!\n" +
      "4. Special Action Cards:\n" +
      "   - Peek Self (7 & 8): Look privately at one of your own face-down cards.\n" +
      "   - Peek Opponent (9 & 10): Look privately at one of an opponent's cards.\n" +
      "   - Blind Swap (خد وهات): Blindly swap one of your cards with an opponent's card without looking.\n" +
      "   - 🏓 Ping Pong (بينج بونج): Compare your card and an opponent's card, then choose whether to swap them or keep them!\n" +
      "   - 🦹 The Thief (الحرامي): Peek at an opponent's card, steal it into your grid, and give them your unwanted card!\n" +
      "   - 👑 Red King: -1 Point (Best card in game!).\n" +
      "   - 💀 Black King: +20 Points penalty (Get rid of it immediately!).\n" +
      "5. Calling 'Screw!': When you believe your cards have the lowest sum, call 'Screw!'. Everyone else gets ONE final turn. If you have the lowest, you get 0 points! If you fail, you suffer penalty points!\n" +
      "6. Modes & Rules: Support for Solo or 2v2 Teams play, turn timers, and double final round points.",
    createRoom: "Open Screw Table",
    roomTitle: "Table Title",
    visibility: "Visibility",
    publicRoom: "Public",
    privateRoom: "Private (with password)",
    roomPassword: "Table Password",
    cardsLayout: "Player Cards Layout",
    fourCards: "4 Cards (Classic 2x2)",
    sixCards: "6 Cards (Extended 2x3)",
    scoreThreshold: "Match Penalty Threshold",
    thresholdDesc: "Game ends when someone reaches this score. Lowest cumulative score wins!",
    create: "Create & Enter Table",
    joinByCode: "Join by 6-digit Code",
    roomCode: "Table Code",
    join: "Take Seat",
    availableRooms: "Available Public Tables",
    openRoom: "Join Table",
    playersLabel: "players",
    statusWaiting: "Waiting for players",
    statusPlaying: "Game in progress",
    statusFinished: "Finished",
    language: "Language",
    english: "English",
    arabic: "العربية",
  },
  ar: {
    title: "لعبة سكرو (Screw) - قائمة الطاولات",
    subtitle: "لعبة الذاكرة والذكاء الأشهر في القهاوي! بدّل كروتك، العب بينج بونج، واصرخ 'سكرو!'",
    howToPlay: "قواعد وكروت لعبة سكرو",
    howToPlayRules:
      "١. الهدف: امتلاك أقل مجموع نقاط ممكن عندما يقول أحد اللاعبين 'سكرو!'.\n" +
      "٢. الذاكرة والبداية: يُوزع لكل لاعب 4 كروت (أو 6 كروت) مقلوبة. في بداية الجولة، يُسمح لك برؤية آخر كرتين بالأسفل لحفظهما، وبمجرد الضغط على زر الجاهزية تُقلب الكروت جميعها على ظهرها ويجب تذكرها من الذاكرة!\n" +
      "٣. في دورك:\n" +
      "   - تسحب كرت من الكومة المغطاة (تشوفه لوحدك) أو تأخذ الكرت المكشوف من كومة اللعب.\n" +
      "   - تبدل الكرت المسحوب مع أي كرت عندك (وترمي القديم مكشوفاً في الكومة)،\n" +
      "   - أو ترمي الكرت المسحوب فوراً في الكومة؛ وإذا كان كرت خاص تفعل خاصيته!\n" +
      "٤. كروت الخواص المميزة:\n" +
      "   - 👁️ بص في ورقتك (٧ و ٨): اكشف أحد كروتك في السر.\n" +
      "   - 🕵️ بص في ورقة غيرك (٩ و ١٠): اكشف كرت من عند أي خصم في السر.\n" +
      "   - 🔁 خد وهات: بدّل كرت من عندك مع كرت خصم على عماك دون كشف.\n" +
      "   - 🏓 بينج بونج (Ping Pong): اكشف كرتك وكرت خصمك معاً، وقرر هل تبدلهم أو تتركهم!\n" +
      "   - 🦹 الحرامي: اكشف كرت من عند أي خصم واسرقه لشبكتك واعطيه كرتك الوحش!\n" +
      "   - 👑 شايب أحمر: -1 نقطة (أفضل كرت باللعبة!).\n" +
      "   - 💀 شايب أسود: +20 نقطة عقوبة (تخلص منه فوراً!).\n" +
      "٥. صرخة 'سكرو!': عندما تتوقع أن مجموعك هو الأقل، تقول 'سكرو!'. كل لاعب يأخذ دور أخير واحد فقط. إذا كان مجموعك هو الأقل تكسب 0 نقط! إذا خسرت، تنزل عليك العقوبة!\n" +
      "٦. خيارات الطاولة: لعب فردي أو لعب فرق (٢ ضد ٢)، مع عداد وقت للدور وقوانين مضاعفة الجولة الأخيرة.",
    createRoom: "فتح طاولة سكرو جديدة",
    roomTitle: "اسم الطاولة",
    visibility: "نوع الطاولة",
    publicRoom: "عامة للجميع",
    privateRoom: "خاصة (بكلمة سر)",
    roomPassword: "كلمة سر الطاولة",
    cardsLayout: "عدد كروت كل لاعب",
    fourCards: "٤ كروت (الشكل الكلاسيكي ٢×٢)",
    sixCards: "٦ كروت (الشكل الموسع ٢×٣)",
    scoreThreshold: "نقط نهاية المباراة (حد العقوبة)",
    thresholdDesc: "تنتهي المباراة عندما يصل أي لاعب لهذا المجموع، وصاحب أقل نقط يفوز!",
    create: "إنشاء ودخول الطاولة",
    joinByCode: "الانضمام برمز الطاولة",
    roomCode: "رمز الطاولة (6 خانات)",
    join: "جلوس على الطاولة",
    availableRooms: "طاولات سكرو المتاحة",
    openRoom: "دخول الطاولة",
    playersLabel: "لاعبين",
    statusWaiting: "في انتظار اللاعبين",
    statusPlaying: "المباراة جارية",
    statusFinished: "منتهية",
    language: "اللغة",
    english: "English",
    arabic: "العربية",
  },
};

export default function ScrewLobbyClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") === "ar" ? "ar" : "en";
  const t = DICTIONARY[lang];

  const [rooms, setRooms] = useState<PublicRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [showRules, setShowRules] = useState(false);
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [submittingJoin, setSubmittingJoin] = useState(false);

  const languageLinks = useMemo(
    () => ({
      en: "/games/screw?lang=en",
      ar: "/games/screw?lang=ar",
    }),
    [],
  );

  async function loadRooms() {
    try {
      const response = await fetch("/api/games/screw/rooms", { cache: "no-store" });
      const data = (await response.json()) as { rooms?: PublicRoom[]; error?: string };
      if (!response.ok || !data.rooms) {
        setError(data.error ?? "Could not load tables.");
      } else {
        setRooms(data.rooms);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load tables.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRooms();
    const interval = window.setInterval(loadRooms, 3500);
    return () => window.clearInterval(interval);
  }, []);

  async function onCreateRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittingCreate(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    const selectedVisibility = String(formData.get("visibility") ?? "PUBLIC") as "PUBLIC" | "PRIVATE";
    const password = String(formData.get("password") ?? "") || undefined;
    const mode = String(formData.get("mode") ?? "SOLO") as "SOLO" | "TEAMS";
    const cardsPerPlayer = Number(formData.get("cardsPerPlayer") ?? 4);
    const scoreLimit = Number(formData.get("scoreLimit") ?? 100);
    const turnTimerSeconds = Number(formData.get("turnTimerSeconds") ?? 30);
    const doubleFinalRound = formData.get("doubleFinalRound") === "on";
    const screwPenaltyType = String(formData.get("screwPenaltyType") ?? "PLUS_30") as "PLUS_30" | "DOUBLE_SCORE";

    const payload = {
      title,
      visibility: selectedVisibility,
      password: selectedVisibility === "PRIVATE" ? password : undefined,
      mode,
      cardsPerPlayer,
      scoreLimit,
      turnTimerSeconds,
      doubleFinalRound,
      screwPenaltyType,
    };

    const response = await fetch("/api/games/screw/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as { roomCode?: string; error?: string };

    setSubmittingCreate(false);
    if (!response.ok || !data.roomCode) {
      setError(data.error ?? "Table creation failed.");
      return;
    }

    router.push(`/games/screw/${data.roomCode}?lang=${lang}`);
  }

  async function onJoinByCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittingJoin(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const roomCode = String(formData.get("roomCode") ?? "").trim().toUpperCase();
    const password = String(formData.get("joinPassword") ?? "") || undefined;

    const response = await fetch(`/api/games/screw/rooms/${roomCode}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    const data = (await response.json()) as { error?: string };
    setSubmittingJoin(false);
    if (!response.ok) {
      setError(data.error ?? "Could not join table.");
      return;
    }

    router.push(`/games/screw/${roomCode}?lang=${lang}`);
  }

  async function joinPublicRoom(roomCode: string) {
    setError(null);
    const response = await fetch(`/api/games/screw/rooms/${roomCode}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(data.error ?? "Could not join table.");
      return;
    }
    router.push(`/games/screw/${roomCode}?lang=${lang}`);
  }

  return (
    <main
      className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 sm:px-6 py-10"
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-3xl">🔩</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">{t.title}</h1>
          </div>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowRules(!showRules)}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            📖 {t.howToPlay}
          </button>
          <div className="flex items-center gap-1 text-xs font-medium">
            <Link
              className={`rounded-lg border px-2.5 py-1 transition ${
                lang === "en"
                  ? "border-amber-600 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-bold"
                  : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
              href={languageLinks.en}
            >
              EN
            </Link>
            <Link
              className={`rounded-lg border px-2.5 py-1 transition ${
                lang === "ar"
                  ? "border-amber-600 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-bold"
                  : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
              href={languageLinks.ar}
            >
              عربي
            </Link>
          </div>
        </div>
      </div>

      {/* Rules Explainer */}
      {showRules && (
        <div className="rounded-3xl border border-amber-500/30 bg-amber-500/5 p-5 sm:p-6 text-sm">
          <h2 className="text-base font-bold text-amber-700 dark:text-amber-300 mb-2">
            🔩 {t.howToPlay}
          </h2>
          <pre className="whitespace-pre-line font-sans text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
            {t.howToPlayRules}
          </pre>
        </div>
      )}

      {error && (
        <p className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-4 text-sm text-red-700 dark:text-red-300 font-medium">
          {error}
        </p>
      )}

      {/* Create Table & Join Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Create Table Form */}
        <form
          onSubmit={onCreateRoom}
          className="space-y-4 rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 p-6 shadow-sm backdrop-blur-md"
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{t.createRoom}</h2>
          </div>

          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
            <span className="mb-1.5 block">{t.roomTitle}</span>
            <input
              name="title"
              required
              minLength={2}
              maxLength={80}
              placeholder="e.g. Masters of Screw Table"
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-amber-500"
            />
          </label>

          {/* Game Mode: Solo vs 2v2 Teams */}
          <div className="space-y-1.5">
            <span className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              {lang === "ar" ? "نظام اللعب" : "Game Mode"}
            </span>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center justify-center p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 hover:border-amber-500 cursor-pointer has-[:checked]:border-amber-500 has-[:checked]:bg-amber-500/10 has-[:checked]:text-amber-700 dark:has-[:checked]:text-amber-300 transition text-xs font-bold">
                <input type="radio" name="mode" value="SOLO" defaultChecked className="sr-only" />
                <span>{lang === "ar" ? "👤 فردي (Solo)" : "👤 Solo"}</span>
              </label>
              <label className="flex items-center justify-center p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 hover:border-amber-500 cursor-pointer has-[:checked]:border-amber-500 has-[:checked]:bg-amber-500/10 has-[:checked]:text-amber-700 dark:has-[:checked]:text-amber-300 transition text-xs font-bold">
                <input type="radio" name="mode" value="TEAMS" className="sr-only" />
                <span>{lang === "ar" ? "👥 فرق (2v2 Teams)" : "👥 2v2 Teams"}</span>
              </label>
            </div>
          </div>

          {/* Cards Layout Option: 4 Cards or 6 Cards */}
          <div className="space-y-1.5">
            <span className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              {t.cardsLayout}
            </span>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center justify-center p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 hover:border-amber-500 cursor-pointer has-[:checked]:border-amber-500 has-[:checked]:bg-amber-500/10 has-[:checked]:text-amber-700 dark:has-[:checked]:text-amber-300 transition text-xs font-bold">
                <input
                  type="radio"
                  name="cardsPerPlayer"
                  value={4}
                  defaultChecked
                  className="sr-only"
                />
                <span>{t.fourCards}</span>
              </label>

              <label className="flex items-center justify-center p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 hover:border-amber-500 cursor-pointer has-[:checked]:border-amber-500 has-[:checked]:bg-amber-500/10 has-[:checked]:text-amber-700 dark:has-[:checked]:text-amber-300 transition text-xs font-bold">
                <input
                  type="radio"
                  name="cardsPerPlayer"
                  value={6}
                  className="sr-only"
                />
                <span>{t.sixCards}</span>
              </label>
            </div>
          </div>

          {/* Turn Timer */}
          <div className="space-y-1.5">
            <span className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              ⏱️ {lang === "ar" ? "عداد وقت الدور" : "Turn Timer"}
            </span>
            <div className="grid grid-cols-5 gap-2">
              {[
                { val: 15, label: "15s" },
                { val: 30, label: "30s" },
                { val: 45, label: "45s" },
                { val: 60, label: "60s" },
                { val: 0, label: lang === "ar" ? "بدون" : "Off" },
              ].map((timer) => (
                <label
                  key={timer.val}
                  className="flex items-center justify-center p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 hover:border-amber-500 cursor-pointer has-[:checked]:border-amber-500 has-[:checked]:bg-amber-500/10 has-[:checked]:text-amber-700 dark:has-[:checked]:text-amber-300 transition text-xs font-bold"
                >
                  <input
                    type="radio"
                    name="turnTimerSeconds"
                    value={timer.val}
                    defaultChecked={timer.val === 30}
                    className="sr-only"
                  />
                  <span>{timer.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Cafe Rules Toggles */}
          <div className="space-y-2.5 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3.5">
            <span className="block text-xs font-black text-amber-700 dark:text-amber-300 uppercase tracking-wider">
              ⚙️ {lang === "ar" ? "قوانين القهوة الخاصة" : "Cafe Custom Rules"}
            </span>
            <label className="flex items-center gap-2.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 cursor-pointer">
              <input
                type="checkbox"
                name="doubleFinalRound"
                className="rounded border-zinc-400 text-amber-600 focus:ring-amber-500"
              />
              <span>
                🔥 {lang === "ar" ? "الجولة الأخيرة دبل (Double Final Round)" : "Double points on final round"}
              </span>
            </label>
            <div className="pt-1">
              <span className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                {lang === "ar" ? "عقوبة خسارة صرخة سكرو:" : "Failed Screw penalty:"}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center justify-center p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs font-bold cursor-pointer has-[:checked]:border-amber-500 has-[:checked]:bg-amber-500/10">
                  <input type="radio" name="screwPenaltyType" value="PLUS_30" defaultChecked className="sr-only" />
                  <span>+30 pts</span>
                </label>
                <label className="flex items-center justify-center p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs font-bold cursor-pointer has-[:checked]:border-amber-500 has-[:checked]:bg-amber-500/10">
                  <input type="radio" name="screwPenaltyType" value="DOUBLE_SCORE" className="sr-only" />
                  <span>{lang === "ar" ? "2x الدبل" : "2x Double"}</span>
                </label>
              </div>
            </div>
          </div>

          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
            <span className="mb-1.5 block">{t.visibility}</span>
            <select
              name="visibility"
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-amber-500"
              value={visibility}
              onChange={(event) => setVisibility(event.target.value as "PUBLIC" | "PRIVATE")}
            >
              <option value="PUBLIC">{t.publicRoom}</option>
              <option value="PRIVATE">{t.privateRoom}</option>
            </select>
          </label>

          {visibility === "PRIVATE" && (
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              <span className="mb-1.5 block">{t.roomPassword}</span>
              <input
                type="password"
                name="password"
                required
                minLength={4}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-amber-500"
              />
            </label>
          )}

          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
            <span className="mb-1.5 block">{t.scoreThreshold}</span>
            <div className="grid grid-cols-4 gap-2">
              {[50, 100, 150, 200].map((score) => (
                <label
                  key={score}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 hover:border-amber-500 cursor-pointer has-[:checked]:border-amber-500 has-[:checked]:bg-amber-500/10 has-[:checked]:text-amber-700 dark:has-[:checked]:text-amber-300 transition"
                >
                  <input
                    type="radio"
                    name="scoreLimit"
                    value={score}
                    defaultChecked={score === 100}
                    className="sr-only"
                  />
                  <span className="text-base font-extrabold">{score}</span>
                  <span className="text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-400">pts</span>
                </label>
              ))}
            </div>
            <span className="mt-1.5 block text-[11px] font-normal text-zinc-500 dark:text-zinc-400">
              {t.thresholdDesc}
            </span>
          </label>

          <button
            type="submit"
            disabled={submittingCreate}
            className="w-full rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 px-4 py-3 text-sm font-bold text-white hover:opacity-95 transition disabled:opacity-50 cursor-pointer shadow-md shadow-amber-600/20"
          >
            {submittingCreate ? "Creating Table..." : t.create}
          </button>
        </form>

        {/* Join Table Form */}
        <div className="space-y-6">
          <form
            onSubmit={onJoinByCode}
            className="space-y-4 rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 p-6 shadow-sm backdrop-blur-md"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">🔑</span>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{t.joinByCode}</h2>
            </div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              <span className="mb-1.5 block">{t.roomCode}</span>
              <input
                name="roomCode"
                required
                maxLength={6}
                placeholder="e.g. 5C2R9W"
                className="w-full font-mono uppercase tracking-widest rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-lg font-extrabold text-zinc-900 dark:text-zinc-100 outline-none focus:border-amber-500 text-center"
              />
            </label>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              <span className="mb-1.5 block">{t.roomPassword} (Optional)</span>
              <input
                type="password"
                name="joinPassword"
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-amber-500"
              />
            </label>
            <button
              type="submit"
              disabled={submittingJoin}
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-900 dark:bg-zinc-100 px-4 py-3 text-sm font-bold text-white dark:text-zinc-900 hover:opacity-90 transition disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {submittingJoin ? "Joining..." : t.join}
            </button>
          </form>
        </div>
      </div>

      {/* Available Public Tables */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{t.availableRooms}</h2>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          </div>
        ) : rooms.length === 0 ? (
          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            No public Screw tables active right now. Open a table above to play with friends!
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <div
                key={room.roomCode}
                className="flex flex-col justify-between rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 p-4 shadow-sm hover:border-amber-500 transition"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                      #{room.roomCode}
                    </span>
                    <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                      {room.status === "WAITING" ? t.statusWaiting : t.statusPlaying}
                    </span>
                  </div>
                  <h3 className="mt-2 font-bold text-zinc-900 dark:text-zinc-100 truncate">{room.title}</h3>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    👥 {room.playerCount}/8 {t.playersLabel} · 🎴 {room.cardsPerPlayer} Cards · 🎯 {room.scoreLimit} pts
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => joinPublicRoom(room.roomCode)}
                  className="mt-4 w-full rounded-xl bg-amber-600 px-3 py-2 text-xs font-bold text-white hover:bg-amber-500 transition cursor-pointer"
                >
                  {t.openRoom}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
