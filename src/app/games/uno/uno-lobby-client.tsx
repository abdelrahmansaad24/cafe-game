"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

type PublicRoom = {
  roomCode: string;
  title: string;
  status: "WAITING" | "PLAYING" | "FINISHED";
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
    title: "أونو (UNO) - Lobby",
    subtitle: "The world-famous card shedding party game! Match colors, reverse turns, and shout UNO!",
    howToPlay: "UNO Rules & Cards",
    howToPlayRules:
      "1. Deal: 7 cards dealt to each player (2 to 8 players).\n" +
      "2. Match: Play a card matching the active color OR number/symbol of the top discard card.\n" +
      "3. Action Cards:\n" +
      "   - Skip (🚫): Next player skips their turn.\n" +
      "   - Reverse (⇄): Reverses play direction (or skips in 2-player game).\n" +
      "   - Draw Two (+2): Next player draws 2 cards and skips turn.\n" +
      "   - Wild (★): Play on any card and choose the new active color.\n" +
      "   - Wild Draw Four (+4): Next player draws 4 cards and skips, and you pick the color!\n" +
      "4. Shout UNO: When you play your second-to-last card (leaving 1 card), you MUST shout UNO! If caught before the next turn, you draw 2 penalty cards!\n" +
      "5. Scoring: Empty your hand to win the round! Winner scores points from all opponents' remaining cards. First to reach the score threshold wins the match!",
    createRoom: "Open UNO Table",
    roomTitle: "Table Title",
    visibility: "Visibility",
    publicRoom: "Public",
    privateRoom: "Private (with password)",
    roomPassword: "Table Password",
    scoreThreshold: "Target Match Points",
    thresholdDesc: "First player to accumulate this score wins the championship",
    create: "Create & Enter Table",
    joinByCode: "Join by 6-digit Code",
    roomCode: "Table Code",
    join: "Take Seat",
    availableRooms: "Available Public Tables",
    openRoom: "Join Table",
    playersLabel: "players",
    statusWaiting: "Waiting for players",
    statusPlaying: "Match in progress",
    statusFinished: "Finished",
    language: "Language",
    english: "English",
    arabic: "العربية",
  },
  ar: {
    title: "لعبة أونو (UNO) - قائمة الطاولات",
    subtitle: "لعبة الكروت الجماعية الأشهر في العالم! طابق الألوان والأرقام، اقلب الدور واصرخ أونو!",
    howToPlay: "قواعد وكروت لعبة أونو",
    howToPlayRules:
      "١. التوزيع: 7 كروت لكل لاعب (من ٢ إلى ٨ لاعبين).\n" +
      "٢. اللعب: انزل بكرت يطابق اللون الحالي أو الرقم/الرمز لكرت الساحة.\n" +
      "٣. الكروت الخاصة:\n" +
      "   - تخطي (🚫): اللاعب التالي يتخطى دوره.\n" +
      "   - عكس (⇄): يعكس اتجاه اللعب (أو يتخطى في لعب الـ 2 لاعبين).\n" +
      "   - اسحب 2 (+2): اللاعب التالي يسحب كرتين ويتخطى دوره.\n" +
      "   - الجوكر (★): يُنزل على أي كرت وتختار اللون القادم.\n" +
      "   - جوكر اسحب 4 (+4): التالي يسحب 4 كروت ويتخطى، وأنت تختار اللون!\n" +
      "٤. صرخة أونو: عندما يتبقى في يدك كرت واحد فقط، يجب أن تضغط زر 'أونو!' فوراً. إذا قفشك أحد الخصوم قبل بداية الدور التالي، تسحب كرتين جزاء!\n" +
      "٥. النقط: من يُنهي كروته يفوز بالجولة ويحسب مجموع نقاط كروت الخصوم المتبقية. أول من يصل لحد النقاط يفوز بالبطولة!",
    createRoom: "فتح طاولة أونو جديدة",
    roomTitle: "اسم الطاولة",
    visibility: "نوع الطاولة",
    publicRoom: "عامة للجميع",
    privateRoom: "خاصة (بكلمة سر)",
    roomPassword: "كلمة سر الطاولة",
    scoreThreshold: "نقط الفوز بالبطولة",
    thresholdDesc: "أول لاعب يصل لهذا المجموع من النقاط يفوز بالمباراة",
    create: "إنشاء ودخول الطاولة",
    joinByCode: "الانضمام برمز الطاولة",
    roomCode: "رمز الطاولة (6 خانات)",
    join: "جلوس على الطاولة",
    availableRooms: "طاولات أونو المتاحة",
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

export default function UnoLobbyClient() {
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
      en: "/games/uno?lang=en",
      ar: "/games/uno?lang=ar",
    }),
    [],
  );

  async function loadRooms() {
    try {
      const response = await fetch("/api/games/uno/rooms", { cache: "no-store" });
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
    const scoreLimit = Number(formData.get("scoreLimit") ?? 250);

    const payload = {
      title,
      visibility: selectedVisibility,
      password: selectedVisibility === "PRIVATE" ? password : undefined,
      scoreLimit,
    };

    const response = await fetch("/api/games/uno/rooms", {
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

    router.push(`/games/uno/${data.roomCode}?lang=${lang}`);
  }

  async function onJoinByCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittingJoin(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const roomCode = String(formData.get("roomCode") ?? "").trim().toUpperCase();
    const password = String(formData.get("joinPassword") ?? "") || undefined;

    const response = await fetch(`/api/games/uno/rooms/${roomCode}/join`, {
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

    router.push(`/games/uno/${roomCode}?lang=${lang}`);
  }

  async function joinPublicRoom(roomCode: string) {
    setError(null);
    const response = await fetch(`/api/games/uno/rooms/${roomCode}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(data.error ?? "Could not join table.");
      return;
    }
    router.push(`/games/uno/${roomCode}?lang=${lang}`);
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
            <span className="text-3xl">🎴</span>
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
                  ? "border-red-600 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 font-bold"
                  : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
              href={languageLinks.en}
            >
              EN
            </Link>
            <Link
              className={`rounded-lg border px-2.5 py-1 transition ${
                lang === "ar"
                  ? "border-red-600 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 font-bold"
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
        <div className="rounded-3xl border border-red-500/30 bg-red-500/5 p-5 sm:p-6 text-sm">
          <h2 className="text-base font-bold text-red-700 dark:text-red-300 mb-2">
            🎴 {t.howToPlay}
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
              placeholder="e.g. Crazy UNO Champions"
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-red-500"
            />
          </label>

          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
            <span className="mb-1.5 block">{t.visibility}</span>
            <select
              name="visibility"
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-red-500"
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
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-red-500"
              />
            </label>
          )}

          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
            <span className="mb-1.5 block">{t.scoreThreshold}</span>
            <div className="grid grid-cols-4 gap-2">
              {[100, 250, 500, 750].map((score) => (
                <label
                  key={score}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 hover:border-red-500 cursor-pointer has-[:checked]:border-red-500 has-[:checked]:bg-red-500/10 has-[:checked]:text-red-600 transition"
                >
                  <input
                    type="radio"
                    name="scoreLimit"
                    value={score}
                    defaultChecked={score === 250}
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
            className="w-full rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 px-4 py-3 text-sm font-bold text-white hover:opacity-95 transition disabled:opacity-50 cursor-pointer shadow-md shadow-red-600/20"
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
                placeholder="e.g. 7U3N1O"
                className="w-full font-mono uppercase tracking-widest rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-lg font-extrabold text-zinc-900 dark:text-zinc-100 outline-none focus:border-red-500 text-center"
              />
            </label>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              <span className="mb-1.5 block">{t.roomPassword} (Optional)</span>
              <input
                type="password"
                name="joinPassword"
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-red-500"
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
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
          </div>
        ) : rooms.length === 0 ? (
          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            No public UNO tables active right now. Open a table above to play with friends!
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <div
                key={room.roomCode}
                className="flex flex-col justify-between rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 p-4 shadow-sm hover:border-red-500 transition"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-red-600 dark:text-red-400">
                      #{room.roomCode}
                    </span>
                    <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                      {room.status === "WAITING" ? t.statusWaiting : t.statusPlaying}
                    </span>
                  </div>
                  <h3 className="mt-2 font-bold text-zinc-900 dark:text-zinc-100 truncate">{room.title}</h3>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    👥 {room.playerCount}/8 {t.playersLabel} · 🎯 {room.scoreLimit} pts
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => joinPublicRoom(room.roomCode)}
                  className="mt-4 w-full rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-500 transition cursor-pointer"
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
