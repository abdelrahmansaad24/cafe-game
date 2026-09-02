"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type RoomSummary = {
  id: string;
  roomCode: string;
  title: string;
  status: "WAITING" | "PLAYING" | "FINISHED";
  scoreLimit: number;
  roundNumber: number;
  _count: { players: number };
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
  turnTimer: string;
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
    title: "Pingo (بينجو) - Tables Lobby",
    subtitle: "The classic 5x5 number scratching game! Form 5 lines to complete P-I-N-G-O and shout for victory!",
    howToPlay: "Pingo Rules & How to Play",
    howToPlayRules:
      "1. Setup: Each player gets a 5x5 grid containing numbers 1 to 25. You can click 'Randomize' or arrange your own numbers.\n" +
      "2. Calling Numbers: Players take turns calling out a number from 1 to 25.\n" +
      "3. Scratching: When any number is called, ALL players mark that number off on their own card!\n" +
      "4. Line Completion: Each completed row, column, or diagonal scratches off one letter of P - I - N - G - O:\n" +
      "   - 1st line: Letter 'P'\n" +
      "   - 2nd line: Letter 'I'\n" +
      "   - 3rd line: Letter 'N'\n" +
      "   - 4th line: Letter 'G'\n" +
      "   - 5th line: Letter 'O' -> PINGO Complete!\n" +
      "5. Shouting PINGO: The first player to complete all 5 lines presses the 'PINGO!' button to win the round! First to reach the target round wins takes the match!",
    createRoom: "Open Pingo Table",
    roomTitle: "Table Title",
    visibility: "Visibility",
    publicRoom: "Public",
    privateRoom: "Private (with password)",
    roomPassword: "Table Password",
    scoreThreshold: "Match Target Wins",
    thresholdDesc: "First player to win this number of rounds wins the entire match!",
    turnTimer: "Turn Countdown Timer",
    create: "Create & Take Seat",
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
    title: "لعبة بينجو (Pingo) - قائمة الطاولات",
    subtitle: "لعبة شطب الأرقام الشهيرة! أكمل 5 خطوط لتشطب حروف P - I - N - G - O واصرخ بينجو للفوز!",
    howToPlay: "قواعد وطريقة لعب بينجو",
    howToPlayRules:
      "١. شبكة الأرقام: يحصل كل لاعب على شبكة ٥×٥ تحتوي على الأرقام من ١ إلى ٢٥. يمكنك الضغط على 'ترتيب عشوائي' أو ترتيب أرقامك كما تحب.\n" +
      "٢. نداء الأرقام: يتناوب اللاعبون في دورهم على نداء رقم من ١ إلى ٢٥ لم يُنادَ عليه من قبل.\n" +
      "٣. الشطب الجماعي: بمجرد نداء أي رقم، يشطب جميع اللاعبين ذلك الرقم من شبكتهم في نفس اللحظة!\n" +
      "٤. الخطوط والحروف: كل خط يكتمل شطبه (صف أفقي، أو عمود رأسي، أو قطر مائل) يفتح لك حرفاً من كلمة P - I - N - G - O:\n" +
      "   - الخط الأول: حرف 'P'\n" +
      "   - الخط الثاني: حرف 'I'\n" +
      "   - الخط الثالث: حرف 'N'\n" +
      "   - الخط الرابع: حرف 'G'\n" +
      "   - الخط الخامس: حرف 'O' -> اكتمال كلمة بينجو!\n" +
      "٥. صرخة بينجو!: أول لاعب يكمل شطب الـ 5 خطوط يضغط فوراً زر 'بينجو!' ليفوز بالجولة! وأول من يصل لعدد الجولات المطلوب يفوز بالمباراة!",
    createRoom: "فتح طاولة بينجو جديدة",
    roomTitle: "اسم الطاولة",
    visibility: "نوع الطاولة",
    publicRoom: "عامة للجميع",
    privateRoom: "خاصة (بكلمة سر)",
    roomPassword: "كلمة سر الطاولة",
    scoreThreshold: "عدد الجولات للفوز بالمباراة",
    thresholdDesc: "أول لاعب يحقق هذا العدد من الجولات يفوز بالمباراة!",
    turnTimer: "عداد وقت الدور",
    create: "إنشاء ودخول الطاولة",
    joinByCode: "الانضمام برمز الطاولة",
    roomCode: "رمز الطاولة",
    join: "دخول الطاولة",
    availableRooms: "طاولات بينجو المتاحة",
    openRoom: "انضمام للطاولة",
    playersLabel: "لاعبين",
    statusWaiting: "في انتظار اللاعبين",
    statusPlaying: "الجولة جارية",
    statusFinished: "انتهت المباراة",
    language: "اللغة",
    english: "English",
    arabic: "العربية",
  },
};

export default function PingoLobbyClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") === "ar" ? "ar" : "en";
  const t = DICTIONARY[lang];

  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  // Form states
  const [title, setTitle] = useState("طاولة بينجو الحريفة");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [password, setPassword] = useState("");
  const [scoreLimit, setScoreLimit] = useState(3);
  const [turnTimerSeconds, setTurnTimerSeconds] = useState(30);
  const [joinCode, setJoinCode] = useState("");
  const [joinPassword, setJoinPassword] = useState("");

  const links = useMemo(
    () => ({
      en: `/games/pingo?lang=en`,
      ar: `/games/pingo?lang=ar`,
    }),
    [],
  );

  const fetchRooms = async () => {
    try {
      const response = await fetch("/api/games/pingo/rooms", { cache: "no-store" });
      const data = (await response.json()) as { rooms?: RoomSummary[] };
      if (response.ok && data.rooms) {
        setRooms(data.rooms);
      }
    } catch {
      // Ignore background poll errors
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/games/pingo/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          visibility,
          password: visibility === "PRIVATE" ? password : undefined,
          scoreLimit,
          turnTimerSeconds,
        }),
      });

      const data = (await res.json()) as { roomCode?: string; error?: string };
      if (!res.ok || !data.roomCode) {
        setError(data.error ?? "Failed to create table.");
        setCreating(false);
        return;
      }

      router.push(`/games/pingo/${data.roomCode}?lang=${lang}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create table.");
      setCreating(false);
    }
  };

  const handleJoin = async (targetCode: string, targetPassword?: string) => {
    setJoining(true);
    setError(null);

    try {
      const res = await fetch(`/api/games/pingo/rooms/${targetCode}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: targetPassword }),
      });

      const data = (await res.json()) as { roomCode?: string; error?: string };
      if (!res.ok || !data.roomCode) {
        setError(data.error ?? "Failed to join table.");
        setJoining(false);
        return;
      }

      router.push(`/games/pingo/${data.roomCode}?lang=${lang}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join table.");
      setJoining(false);
    }
  };

  return (
    <main
      className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 sm:px-6 py-8"
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-3xl animate-bounce">🎱</span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
              {t.title}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            {t.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
              lang === "en"
                ? "border-amber-600 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300"
                : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
            }`}
            href={links.en}
          >
            {t.english}
          </Link>
          <Link
            className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
              lang === "ar"
                ? "border-amber-600 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300"
                : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
            }`}
            href={links.ar}
          >
            {t.arabic}
          </Link>
        </div>
      </div>

      {/* Rules Banner */}
      <section className="rounded-3xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/20 p-5 shadow-sm">
        <h2 className="text-base font-black text-amber-900 dark:text-amber-200 flex items-center gap-2">
          <span>📜</span>
          <span>{t.howToPlay}</span>
        </h2>
        <pre className="mt-3 whitespace-pre-wrap font-sans text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
          {t.howToPlayRules}
        </pre>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-3.5 text-xs text-red-700 dark:text-red-300 font-bold">
          {error}
        </div>
      )}

      {/* Table Creation and Direct Join Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Create Table Card */}
        <section className="rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 p-5 shadow-sm backdrop-blur-md">
          <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <span>✨</span>
            <span>{t.createRoom}</span>
          </h2>

          <form onSubmit={handleCreate} className="mt-4 space-y-4">
            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                {t.roomTitle}
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  {t.visibility}
                </label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as "PUBLIC" | "PRIVATE")}
                  className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="PUBLIC">{t.publicRoom}</option>
                  <option value="PRIVATE">{t.privateRoom}</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  {t.turnTimer}
                </label>
                <select
                  value={turnTimerSeconds}
                  onChange={(e) => setTurnTimerSeconds(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value={15}>15s</option>
                  <option value={30}>30s</option>
                  <option value={45}>45s</option>
                  <option value={60}>60s</option>
                </select>
              </div>
            </div>

            {visibility === "PRIVATE" && (
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  {t.roomPassword}
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  {t.scoreThreshold}
                </label>
                <span className="font-mono text-xs font-black text-amber-600 dark:text-amber-400">
                  {scoreLimit} Wins
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={7}
                step={1}
                value={scoreLimit}
                onChange={(e) => setScoreLimit(Number(e.target.value))}
                className="mt-2 w-full accent-amber-500 cursor-pointer"
              />
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                {t.thresholdDesc}
              </p>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 px-5 py-3 text-xs font-black text-white hover:opacity-95 transition shadow-lg shadow-amber-600/20 disabled:opacity-50 cursor-pointer"
            >
              {creating ? "..." : t.create}
            </button>
          </form>
        </section>

        {/* Join by Code Card */}
        <section className="rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 p-5 shadow-sm backdrop-blur-md flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <span>🔑</span>
              <span>{t.joinByCode}</span>
            </h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (joinCode.trim()) handleJoin(joinCode.trim(), joinPassword.trim() || undefined);
              }}
              className="mt-4 space-y-4"
            >
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  {t.roomCode}
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="e.g. X9K2LM"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="mt-1 w-full font-mono uppercase tracking-widest text-center text-lg font-black rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  {t.roomPassword} (if private)
                </label>
                <input
                  type="password"
                  value={joinPassword}
                  onChange={(e) => setJoinPassword(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={joining || joinCode.length < 6}
                className="w-full rounded-2xl bg-zinc-900 dark:bg-zinc-100 px-5 py-3 text-xs font-black text-white dark:text-zinc-900 hover:opacity-90 transition disabled:opacity-50 cursor-pointer shadow-md"
              >
                {joining ? "..." : t.join}
              </button>
            </form>
          </div>

          <div className="mt-6 p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800/80 text-center">
            <span className="text-2xl font-black text-amber-500">P - I - N - G - O</span>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
              5 lines = PINGO Victory!
            </p>
          </div>
        </section>
      </div>

      {/* Available Public Tables List */}
      <section className="rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 p-5 shadow-sm backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <span>🌐</span>
            <span>{t.availableRooms}</span>
          </h2>
          <span className="text-xs text-zinc-400 font-mono">
            {rooms.length} tables
          </span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-zinc-500">Loading tables...</div>
        ) : rooms.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500">
            No public tables available. Create one to get started!
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="flex flex-col justify-between rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/70 p-4 transition hover:border-amber-400"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-lg">
                      #{room.roomCode}
                    </span>
                    <span
                      className={`text-[10px] font-black rounded-full px-2 py-0.5 ${
                        room.status === "WAITING"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          : room.status === "PLAYING"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
                      }`}
                    >
                      {room.status === "WAITING"
                        ? t.statusWaiting
                        : room.status === "PLAYING"
                        ? t.statusPlaying
                        : t.statusFinished}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mt-2 truncate">
                    {room.title}
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                    👥 {room._count.players}/8 {t.playersLabel} · 🎯 {room.scoreLimit} Wins
                  </p>
                </div>

                <button
                  type="button"
                  disabled={joining || room.status === "FINISHED"}
                  onClick={() => handleJoin(room.roomCode)}
                  className="mt-4 w-full rounded-xl bg-amber-600 px-3 py-2 text-xs font-bold text-white hover:bg-amber-500 transition disabled:opacity-50 cursor-pointer text-center"
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
