"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

type PublicRoom = {
  roomCode: string;
  title: string;
  status: "WAITING" | "PLAYING" | "FINISHED";
  scoreLimit: number;
  roundNumber: number;
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
    title: "غمازة (Blink / Wink Murder) - Lobby",
    subtitle: "A psychological social deduction game played in real life with your phones.",
    howToPlay: "Game Rules & Flow",
    howToPlayRules:
      "1. The game secretly assigns 1 player as the Blinker (الغماز).\n2. Each player secretly reveals their role on their phone.\n3. The Blinker winks at players in real life without getting caught.\n4. Winked players click 'I got winked!'. The Blinker also has this button to stay disguised!\n5. When 1 innocent player is left, they must guess who the Blinker is!\n6. Correct guess = Survivor gets +1 point. Wrong guess = Blinker gets +1 point.\n7. First to reach the score limit wins the match!",
    createRoom: "Create Blink Room",
    roomTitle: "Room Title",
    visibility: "Visibility",
    publicRoom: "Public",
    privateRoom: "Private (with password)",
    roomPassword: "Password",
    scoreThreshold: "Winning Score Threshold",
    thresholdDesc: "First player to reach this score wins the match",
    create: "Create & Enter Room",
    joinByCode: "Join by 6-digit Code",
    roomCode: "Room Code",
    join: "Join Room",
    availableRooms: "Available Public Rooms",
    openRoom: "Join Room",
    playersLabel: "players",
    statusWaiting: "Waiting for players",
    statusPlaying: "In progress",
    statusFinished: "Finished",
    language: "Language",
    english: "English",
    arabic: "العربية",
  },
  ar: {
    title: "لعبة غمازة (Blink) - قائمة الغرف",
    subtitle: "لعبة خداع وغمز واقعية بالكافيه مع أصدقائك عبر الهواتف.",
    howToPlay: "طريقة وقواعد اللعبة",
    howToPlayRules:
      "١. اللعبة تختار لاعباً واحداً عشوائياً ليكون (الغماز) سراً.\n٢. كل لاعب يضغط لكشف دوره بسرية على هاتفه.\n٣. الغماز يغمز للاعبين في الواقع دون أن يلاحظه أحد.\n٤. اللاعب المغموز يضغط زر 'انغمزت!' (الزر متاح للغماز أيضاً للتمويه!).\n٥. عندما يتبقى لاعب بريء واحد فقط، يدخل مرحلة التخمين ويكشف الغماز!\n٦. إذا خمن صح = البريء يأخذ +1 نقطة. إذا خمن خطأ = الغماز يأخذ +1 نقطة.\n٧. أول لاعب يصل لحد النقاط يفوز بالمباراة بأكملها!",
    createRoom: "إنشاء غرفة غمازة",
    roomTitle: "اسم الغرفة",
    visibility: "نوع الغرفة",
    publicRoom: "عامة للجميع",
    privateRoom: "خاصة (بكلمة سر)",
    roomPassword: "كلمة مرور الغرفة",
    scoreThreshold: "حد نقاط الفوز بالمباراة",
    thresholdDesc: "أول لاعب يصل لهذا المجموع من النقاط يفوز بالمباراة",
    create: "إنشاء ودخول الغرفة",
    joinByCode: "الانضمام برمز الغرفة",
    roomCode: "رمز الغرفة (6 خانات)",
    join: "انضمام للغرفة",
    availableRooms: "الغرف العامة المتاحة",
    openRoom: "دخول الغرفة",
    playersLabel: "لاعبين",
    statusWaiting: "في انتظار اللاعبين",
    statusPlaying: "المباراة جارية",
    statusFinished: "منتهية",
    language: "اللغة",
    english: "English",
    arabic: "العربية",
  },
};

export default function BlinkLobbyClient() {
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
      en: "/games/blink?lang=en",
      ar: "/games/blink?lang=ar",
    }),
    [],
  );

  async function loadRooms() {
    try {
      const response = await fetch("/api/games/blink/rooms", { cache: "no-store" });
      const data = (await response.json()) as { rooms?: PublicRoom[]; error?: string };
      if (!response.ok || !data.rooms) {
        setError(data.error ?? "Could not load rooms.");
      } else {
        setRooms(data.rooms);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load rooms.");
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
    const scoreLimit = Number(formData.get("scoreLimit") ?? 3);

    const payload = {
      title,
      visibility: selectedVisibility,
      password: selectedVisibility === "PRIVATE" ? password : undefined,
      scoreLimit,
    };

    const response = await fetch("/api/games/blink/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as { roomCode?: string; error?: string };

    setSubmittingCreate(false);
    if (!response.ok || !data.roomCode) {
      setError(data.error ?? "Room creation failed.");
      return;
    }

    router.push(`/games/blink/${data.roomCode}?lang=${lang}`);
  }

  async function onJoinByCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittingJoin(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const roomCode = String(formData.get("roomCode") ?? "").trim().toUpperCase();
    const password = String(formData.get("joinPassword") ?? "") || undefined;

    const response = await fetch(`/api/games/blink/rooms/${roomCode}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    const data = (await response.json()) as { error?: string };
    setSubmittingJoin(false);
    if (!response.ok) {
      setError(data.error ?? "Could not join room.");
      return;
    }

    router.push(`/games/blink/${roomCode}?lang=${lang}`);
  }

  async function joinPublicRoom(roomCode: string) {
    setError(null);
    const response = await fetch(`/api/games/blink/rooms/${roomCode}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(data.error ?? "Could not join room.");
      return;
    }
    router.push(`/games/blink/${roomCode}?lang=${lang}`);
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
            <span className="text-3xl">😉</span>
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
                  ? "border-rose-600 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-bold"
                  : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
              href={languageLinks.en}
            >
              EN
            </Link>
            <Link
              className={`rounded-lg border px-2.5 py-1 transition ${
                lang === "ar"
                  ? "border-rose-600 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-bold"
                  : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
              href={languageLinks.ar}
            >
              عربي
            </Link>
          </div>
        </div>
      </div>

      {/* Rules Explainer collapsible */}
      {showRules && (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/5 p-5 sm:p-6 text-sm">
          <h2 className="text-base font-bold text-rose-700 dark:text-rose-300 mb-2">
            😉 {t.howToPlay}
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

      {/* Create & Join Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Create Room Form */}
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
              placeholder="e.g. Costa Coffee Squad"
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-rose-500"
            />
          </label>

          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
            <span className="mb-1.5 block">{t.visibility}</span>
            <select
              name="visibility"
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-rose-500"
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
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-rose-500"
              />
            </label>
          )}

          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
            <span className="mb-1.5 block">{t.scoreThreshold}</span>
            <div className="grid grid-cols-4 gap-2">
              {[1, 3, 5, 10].map((score) => (
                <label
                  key={score}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 hover:border-rose-500 cursor-pointer has-[:checked]:border-rose-500 has-[:checked]:bg-rose-500/10 has-[:checked]:text-rose-600 transition"
                >
                  <input
                    type="radio"
                    name="scoreLimit"
                    value={score}
                    defaultChecked={score === 3}
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
            className="w-full rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 px-4 py-3 text-sm font-bold text-white hover:from-rose-500 hover:to-pink-500 transition disabled:opacity-50 cursor-pointer shadow-md shadow-rose-600/20"
          >
            {submittingCreate ? "Creating..." : t.create}
          </button>
        </form>

        {/* Join by Code Form */}
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
                placeholder="e.g. 9B3K7Q"
                className="w-full font-mono uppercase tracking-widest rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-lg font-extrabold text-zinc-900 dark:text-zinc-100 outline-none focus:border-rose-500 text-center"
              />
            </label>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              <span className="mb-1.5 block">{t.roomPassword} (Optional)</span>
              <input
                type="password"
                name="joinPassword"
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-rose-500"
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

      {/* Available Public Rooms Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{t.availableRooms}</h2>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-rose-600 border-t-transparent" />
          </div>
        ) : rooms.length === 0 ? (
          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            No public Blink rooms active right now. Create one above to play with friends!
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <div
                key={room.roomCode}
                className="flex flex-col justify-between rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 p-4 shadow-sm hover:border-rose-500 transition"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
                      #{room.roomCode}
                    </span>
                    <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                      {room.status === "WAITING" ? t.statusWaiting : t.statusPlaying}
                    </span>
                  </div>
                  <h3 className="mt-2 font-bold text-zinc-900 dark:text-zinc-100 truncate">{room.title}</h3>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    👥 {room.playerCount} {t.playersLabel} · 🎯 First to {room.scoreLimit} pts
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => joinPublicRoom(room.roomCode)}
                  className="mt-4 w-full rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-500 transition cursor-pointer"
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
