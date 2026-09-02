"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type RoomSummary = {
  id: string;
  roomCode: string;
  title: string;
  status: "WAITING" | "PLAYING" | "FINISHED";
  roundsTotal: number;
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
  matchRounds: string;
  roundsDesc: string;
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
    title: "Estimation (استميشن) - Table Lobby",
    subtitle: "The king of Egyptian cafe card games! 4 players, 13 tricks, strategic bidding, trumps, and exact trick execution.",
    howToPlay: "Rules & How to Play Estimation",
    howToPlayRules:
      "1. Table & Deal: Exactly 4 players seated. Standard 52 cards, 13 cards dealt to each player.\n" +
      "2. 📣 Bidding Phase (الـ Call): Each player predicts the exact number of tricks (0 to 13) they will take. Bidding 0 is 'Dash'!\n" +
      "3. 👑 Trump Suit: The highest bidder selects the Trump suit: Spades ♠, Hearts ♥, Diamonds ♦, Clubs ♣, or No-Trump (صن).\n" +
      "4. 🃏 Trick Rules: The leader plays a card. Other players MUST follow suit if they hold that suit. Otherwise, you can Trump (قطع) or discard. Highest Trump wins, or highest card of the lead suit.\n" +
      "5. 📊 Egyptian Cafe Scoring:\n" +
      "   - Made Call (Exact Tricks): 10 + (Bid × 10) points. (e.g. Call of 3 made = 40 pts). Successful Dash = +30 pts!\n" +
      "   - Missed Call (Under or Over): -(Difference × 10) points. Failed Dash = -30 pts!\n" +
      "6. Match Winner: The player with the highest total points on the Score Sheet after all rounds wins the tournament!",
    createRoom: "Open Estimation Table",
    roomTitle: "Table Name",
    visibility: "Visibility",
    publicRoom: "Public Table",
    privateRoom: "Private Table (Password)",
    roomPassword: "Table Password",
    matchRounds: "Match Length (Rounds)",
    roundsDesc: "Standard Cafe Match is 4 or 8 rounds.",
    create: "Open & Sit at Table",
    joinByCode: "Join by 6-digit Code",
    roomCode: "Table Code",
    join: "Take a Seat",
    availableRooms: "Available Public Tables",
    openRoom: "Join Table",
    playersLabel: "players",
    statusWaiting: "Waiting for 4 players",
    statusPlaying: "Match in progress",
    statusFinished: "Finished",
    language: "Language",
    english: "English",
    arabic: "العربية",
  },
  ar: {
    title: "لعبة استميشن (Estimation) - قائمة الطاولات",
    subtitle: "ملكة ألعاب القهاوي المصرية! ٤ لاعبين، ١٣ لمّة، مزايدة ذكية، اختيار الحُكم، وحساب الدوشات والسكور شيت.",
    howToPlay: "قواعد وطريقة لعب استميشن الأصلية",
    howToPlayRules:
      "١. الطاولة والتوزيع: ٤ لاعبين بالتمام. ٥٢ ورقة كوتشينة، كل لاعب يحصل على ١٣ ورقة.\n" +
      "٢. 📣 مرحلة المزايدة (الكول): يتوقع كل لاعب عدد اللمّات بالظبط التي يستطيع جمعها (من ٠ إلى ١٣). طلب ٠ لمّة يُسمى 'داش'!\n" +
      "٣. 👑 صاحب أعلى كول: يختار لون الحُكم للمباراة: بيك ♠ أو كبة ♥ أو كاروه ♦ أو سنتر ♣ أو صن (بدون حُكم).\n" +
      "٤. 🃏 قواعد اللمّة: يُلزم كل لاعب باتباع نفس لون أول ورقة ملعوبة (إجبار اللون). إذا لم يكن معك اللون، يمكنك القطع بالحكم أو كش ورقة أخرى. أعلى حُكم يكسب اللمة، أو أعلى ورقة من نفس اللون.\n" +
      "٥. 📊 حساب السكور والدوشات المصرية:\n" +
      "   - اللي يجيب الكول بالظبط: يحصل على ١٠ + (الكول × ١٠) نقط (مثال: كول ٣ = ٤٠ نقطة). الداش الناجح = +٣٠ نقطة!\n" +
      "   - اللي يدوّش (أقل أو أزيد): يُخصم منه (فرق اللمّات × ١٠) نقط. الداش الفاشل = -٣٠ نقطة!\n" +
      "٦. بطل الطاولة: اللاعب الحاصل على أعلى مجموع نقط في السكور شيت بعد انتهاء الجولات يتوج بطلاً للمباراة!",
    createRoom: "فتح طاولة استميشن جديدة",
    roomTitle: "اسم الطاولة",
    visibility: "نوع الطاولة",
    publicRoom: "طاولة عامة",
    privateRoom: "طاولة خاصة (بكلمة سر)",
    roomPassword: "كلمة سر الطاولة",
    matchRounds: "عدد جولات المباراة",
    roundsDesc: "مباراة القهوة الكلاسيكية ٤ أو ٨ جولات كاملة.",
    create: "إنشاء وجلوس على الطاولة",
    joinByCode: "الانضمام برمز الطاولة",
    roomCode: "رمز الطاولة",
    join: "أخذ كرسي",
    availableRooms: "طاولات استميشن المتاحة",
    openRoom: "جلوس على الطاولة",
    playersLabel: "لاعبين",
    statusWaiting: "في انتظار ٤ لاعبين",
    statusPlaying: "المباراة جارية",
    statusFinished: "انتهت المباراة",
    language: "اللغة",
    english: "English",
    arabic: "العربية",
  },
};

export default function EstimationLobbyClient() {
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
  const [title, setTitle] = useState("طاولة استميشن الحريفة");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [password, setPassword] = useState("");
  const [roundsTotal, setRoundsTotal] = useState(4);
  const [joinCode, setJoinCode] = useState("");
  const [joinPassword, setJoinPassword] = useState("");

  const links = useMemo(
    () => ({
      en: `/games/estimation?lang=en`,
      ar: `/games/estimation?lang=ar`,
    }),
    [],
  );

  const fetchRooms = async () => {
    try {
      const response = await fetch("/api/games/estimation/rooms", { cache: "no-store" });
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
      const res = await fetch("/api/games/estimation/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          visibility,
          password: visibility === "PRIVATE" ? password : undefined,
          roundsTotal,
        }),
      });

      const data = (await res.json()) as { roomCode?: string; error?: string };
      if (!res.ok || !data.roomCode) {
        setError(data.error ?? "Failed to create table.");
        setCreating(false);
        return;
      }

      router.push(`/games/estimation/${data.roomCode}?lang=${lang}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create table.");
      setCreating(false);
    }
  };

  const handleJoin = async (targetCode: string, targetPassword?: string) => {
    setJoining(true);
    setError(null);

    try {
      const res = await fetch(`/api/games/estimation/rooms/${targetCode}/join`, {
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

      router.push(`/games/estimation/${data.roomCode}?lang=${lang}`);
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
            <span className="text-3xl animate-bounce">♠️</span>
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

      {/* Create Table and Direct Join Grid */}
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
                  {t.matchRounds}
                </label>
                <select
                  value={roundsTotal}
                  onChange={(e) => setRoundsTotal(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value={4}>4 Rounds</option>
                  <option value={8}>8 Rounds (Double Match)</option>
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

            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              👥 {t.roundsDesc} (Exactly 4 players required to start).
            </p>

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
                  placeholder="e.g. EST123"
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

          <div className="mt-6 p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800/80 text-center flex justify-center gap-4 text-2xl">
            <span className="text-zinc-900 dark:text-zinc-100">♠️</span>
            <span className="text-red-500">♥️</span>
            <span className="text-red-500">♦️</span>
            <span className="text-zinc-900 dark:text-zinc-100">♣️</span>
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
                    👥 {room._count.players}/4 {t.playersLabel} · 🏁 {room.roundsTotal} rounds
                  </p>
                </div>

                <button
                  type="button"
                  disabled={joining || room.status === "FINISHED" || room._count.players >= 4}
                  onClick={() => handleJoin(room.roomCode)}
                  className="mt-4 w-full rounded-xl bg-amber-600 px-3 py-2 text-xs font-bold text-white hover:bg-amber-500 transition disabled:opacity-50 cursor-pointer text-center"
                >
                  {room._count.players >= 4 ? "Table Full" : t.openRoom}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
