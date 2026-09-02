"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

type PublicRoom = {
  roomCode: string;
  title: string;
  status: "WAITING" | "PLAYING" | "FINISHED";
  scoreLimit: number;
  turnTimerSeconds?: number | null;
  playerCount: number;
};

type Dictionary = {
  title: string;
  subtitle: string;
  createRoom: string;
  roomTitle: string;
  visibility: string;
  publicRoom: string;
  privateRoom: string;
  roomPassword: string;
  scoreLimit: string;
  turnTimer: string;
  turnTimer30: string;
  turnTimer15: string;
  turnTimer60: string;
  turnTimerUnlimited: string;
  create: string;
  joinByCode: string;
  roomCode: string;
  join: string;
  availableRooms: string;
  openRoom: string;
  gameLabel: string;
  statusWaiting: string;
  statusPlaying: string;
  statusFinished: string;
  language: string;
  english: string;
  arabic: string;
};

const DICTIONARY: Record<"en" | "ar", Dictionary> = {
  en: {
    title: "Quarter Monkey - Lobby",
    subtitle: "Create a room or join by 6-digit room code.",
    createRoom: "Create Room",
    roomTitle: "Room title",
    visibility: "Visibility",
    publicRoom: "Public",
    privateRoom: "Private (with password)",
    roomPassword: "Room password",
    scoreLimit: "Penalty limit (Quarters)",
    turnTimer: "Turn Timer",
    turnTimer30: "30 seconds (Default)",
    turnTimer15: "15 seconds (Fast)",
    turnTimer60: "60 seconds",
    turnTimerUnlimited: "Unlimited (No timer)",
    create: "Create room",
    joinByCode: "Join by code",
    roomCode: "Room code",
    join: "Join room",
    availableRooms: "Available Public Rooms",
    openRoom: "Join Room",
    gameLabel: "Players",
    statusWaiting: "Waiting for players",
    statusPlaying: "In progress",
    statusFinished: "Finished",
    language: "Language",
    english: "English",
    arabic: "العربية",
  },
  ar: {
    title: "لعبة ربع قرد - قائمة الغرف",
    subtitle: "أنشئ غرفة أو انضم برمز مكون من 6 خانات.",
    createRoom: "إنشاء غرفة جديدة",
    roomTitle: "اسم الغرفة",
    visibility: "نوع الغرفة",
    publicRoom: "عامة",
    privateRoom: "خاصة (بكلمة سر)",
    roomPassword: "كلمة مرور الغرفة",
    scoreLimit: "حد عقوبات القرد",
    turnTimer: "مؤقت الدور",
    turnTimer30: "30 ثانية (الافتراضي)",
    turnTimer15: "15 ثانية (سريع)",
    turnTimer60: "60 ثانية",
    turnTimerUnlimited: "بدون وقت (غير محدود)",
    create: "إنشاء الغرفة",
    joinByCode: "الانضمام برمز الغرفة",
    roomCode: "رمز الغرفة",
    join: "انضمام للغرفة",
    availableRooms: "الغرف العامة المتاحة",
    openRoom: "دخول الغرفة",
    gameLabel: "لاعبين",
    statusWaiting: "في انتظار اللاعبين",
    statusPlaying: "جارية الآن",
    statusFinished: "منتهية",
    language: "اللغة",
    english: "English",
    arabic: "العربية",
  },
};

export default function QuarterMonkeyLobbyClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") === "ar" ? "ar" : "en";
  const t = DICTIONARY[lang];

  const [rooms, setRooms] = useState<PublicRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [submittingJoin, setSubmittingJoin] = useState(false);

  const languageLinks = useMemo(
    () => ({
      en: "/games/quarter-monkey?lang=en",
      ar: "/games/quarter-monkey?lang=ar",
    }),
    [],
  );

  async function loadRooms() {
    try {
      const response = await fetch("/api/games/quarter-monkey/rooms", { cache: "no-store" });
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
    const interval = window.setInterval(loadRooms, 4000);
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
    const rawTimer = String(formData.get("turnTimer") ?? "30");
    const turnTimerSeconds = rawTimer === "0" ? null : Number(rawTimer);

    const payload = {
      title,
      visibility: selectedVisibility,
      password: selectedVisibility === "PRIVATE" ? password : undefined,
      scoreLimit,
      turnTimerSeconds,
    };

    const response = await fetch("/api/games/quarter-monkey/rooms", {
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

    router.push(`/games/quarter-monkey/${data.roomCode}?lang=${lang}`);
  }

  async function onJoinByCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittingJoin(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const roomCode = String(formData.get("roomCode") ?? "").trim().toUpperCase();
    const password = String(formData.get("joinPassword") ?? "") || undefined;

    const response = await fetch(`/api/games/quarter-monkey/rooms/${roomCode}/join`, {
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

    router.push(`/games/quarter-monkey/${roomCode}?lang=${lang}`);
  }

  async function joinPublicRoom(roomCode: string) {
    setError(null);
    const response = await fetch(`/api/games/quarter-monkey/rooms/${roomCode}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(data.error ?? "Could not join room.");
      return;
    }
    router.push(`/games/quarter-monkey/${roomCode}?lang=${lang}`);
  }

  return (
    <main
      className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 sm:px-6 py-10"
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-3xl">🐒</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">{t.title}</h1>
          </div>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium">
          <span className="text-zinc-500 dark:text-zinc-400">{t.language}:</span>
          <Link
            className={`rounded-lg border px-3 py-1.5 transition ${
              lang === "en"
                ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold"
                : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
            href={languageLinks.en}
          >
            EN
          </Link>
          <Link
            className={`rounded-lg border px-3 py-1.5 transition ${
              lang === "ar"
                ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold"
                : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
            href={languageLinks.ar}
          >
            عربي
          </Link>
        </div>
      </div>

      {error && (
        <p className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-4 text-sm text-red-700 dark:text-red-300 font-medium">
          {error}
        </p>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Create Room */}
        <form
          onSubmit={onCreateRoom}
          className="space-y-4 rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 p-6 shadow-sm backdrop-blur-md"
        >
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{t.createRoom}</h2>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
            <span className="mb-1.5 block">{t.roomTitle}</span>
            <input
              name="title"
              required
              minLength={2}
              maxLength={80}
              placeholder="e.g. Cairo Friends Table"
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-500"
            />
          </label>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
            <span className="mb-1.5 block">{t.visibility}</span>
            <select
              name="visibility"
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-500"
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
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-500"
              />
            </label>
          )}

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              <span className="mb-1.5 block">{t.scoreLimit}</span>
              <input
                type="number"
                name="scoreLimit"
                min={1}
                max={10}
                defaultValue={3}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-500"
              />
            </label>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              <span className="mb-1.5 block">{t.turnTimer}</span>
              <select
                name="turnTimer"
                defaultValue="30"
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-500"
              >
                <option value="30">{t.turnTimer30}</option>
                <option value="15">{t.turnTimer15}</option>
                <option value="60">{t.turnTimer60}</option>
                <option value="0">{t.turnTimerUnlimited}</option>
              </select>
            </label>
          </div>

          <button
            type="submit"
            disabled={submittingCreate}
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-500 transition disabled:opacity-50 cursor-pointer shadow-md shadow-indigo-600/20"
          >
            {submittingCreate ? "Creating..." : t.create}
          </button>
        </form>

        {/* Join by Code */}
        <div className="space-y-6">
          <form
            onSubmit={onJoinByCode}
            className="space-y-4 rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 p-6 shadow-sm backdrop-blur-md"
          >
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{t.joinByCode}</h2>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              <span className="mb-1.5 block">{t.roomCode}</span>
              <input
                name="roomCode"
                required
                maxLength={6}
                placeholder="e.g. 7K2M9X"
                className="w-full font-mono uppercase tracking-widest rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-lg font-bold text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-500"
              />
            </label>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              <span className="mb-1.5 block">{t.roomPassword} (Optional)</span>
              <input
                type="password"
                name="joinPassword"
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-500"
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

      {/* Available Public Rooms */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{t.availableRooms}</h2>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          </div>
        ) : rooms.length === 0 ? (
          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            No public rooms active right now. Create one above to get started!
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <div
                key={room.roomCode}
                className="flex flex-col justify-between rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 p-4 shadow-sm hover:border-indigo-500 transition"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      #{room.roomCode}
                    </span>
                    <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                      {room.status === "WAITING" ? t.statusWaiting : t.statusPlaying}
                    </span>
                  </div>
                  <h3 className="mt-2 font-bold text-zinc-900 dark:text-zinc-100 truncate">{room.title}</h3>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    👥 {room.playerCount} {t.gameLabel} · 🐒 {room.scoreLimit} limit
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => joinPublicRoom(room.roomCode)}
                  className="mt-4 w-full rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition cursor-pointer"
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
