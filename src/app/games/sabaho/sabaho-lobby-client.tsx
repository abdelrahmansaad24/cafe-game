"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type RoomSummary = {
  id: string;
  roomCode: string;
  title: string;
  status: "WAITING" | "PLAYING" | "FINISHED";
  gameMode: "MIXED" | "AUCTION" | "CAREER_PATH" | "SPEED" | "PASSWORD";
  isTeamPlay: boolean;
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
  gameMode: string;
  modeMixed: string;
  modeAuction: string;
  modeCareer: string;
  modeSpeed: string;
  playStyle: string;
  teamsPlay: string;
  soloPlay: string;
  visibility: string;
  publicRoom: string;
  privateRoom: string;
  roomPassword: string;
  roundsTotal: string;
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
  modePassword: string;
  team1Label: string;
  team2Label: string;
  language: string;
  english: string;
  arabic: string;
};

const DICTIONARY: Record<"en" | "ar", Dictionary> = {
  en: {
    title: "Sabaho Tahadi (صباحو تحدي) - Lobby",
    subtitle: "The ultimate football challenge! Auction bidding, player career path reveals, rapid speed rounds, Password game, and 2-team cafe showdowns.",
    howToPlay: "Rules & How to Play Sabaho Tahadi",
    howToPlayRules:
      "1. 🔥 المزاد (The Auction): A football topic is displayed. Players bid how many items they can name. The highest bidder has 30 seconds to name them!\n" +
      "2. 🎽 مسيرة اللاعب (Career Path): A secret player's clubs are revealed one by one. Hit the BUZZER to stop the clock and name the player!\n" +
      "3. 🔐 لعبة كلمة السر (Password Game): Give a 1-WORD hint to your teammate to guess the secret football card in 60s!\n" +
      "4. ⚡ تحدي السرعة (Speed Challenge): 5 to 10 seconds to name 3 players or clubs under pressure!\n" +
      "5. 👥 Custom Teams & Solo: The host sets custom team names (e.g. Al Ahly vs Zamalek or Real Madrid vs Barca) and players battle for cafe glory!",
    createRoom: "Open Sabaho Tahadi Room",
    roomTitle: "Room Title",
    gameMode: "Challenge Mode",
    modeMixed: "Mixed Challenges (Auction + Career + Password + Speed)",
    modeAuction: "المزاد فقط (Auction Only)",
    modeCareer: "مسيرة اللاعب فقط (Career Path Only)",
    modePassword: "لعبة كلمة السر فقط (Password Only)",
    modeSpeed: "تحدي السرعة فقط (Speed Only)",
    playStyle: "Play Style",
    teamsPlay: "2 Teams (Team 1 vs Team 2)",
    soloPlay: "Solo (Free For All)",
    team1Label: "Team 1 Name (Red)",
    team2Label: "Team 2 Name (White)",
    visibility: "Visibility",
    publicRoom: "Public Room",
    privateRoom: "Private Room (Password)",
    roomPassword: "Room Password",
    roundsTotal: "Total Rounds",
    create: "Create & Enter Room",
    joinByCode: "Join by 6-digit Code",
    roomCode: "Room Code",
    join: "Join Room",
    availableRooms: "Available Public Rooms",
    openRoom: "Join Room",
    playersLabel: "players",
    statusWaiting: "Waiting for players",
    statusPlaying: "Match in progress",
    statusFinished: "Finished",
    language: "Language",
    english: "English",
    arabic: "العربية",
  },
  ar: {
    title: "لعبة صباحو تحدي (Sabaho Tahadi) - قائمة التحديات",
    subtitle: "تحدي الكورة وقعدات القهاوي الأول! المزاد، مسيرة اللاعب، كلمة السر (الباسورد)، تحدي السرعة، ومواجهات الفرق الحماسية.",
    howToPlay: "قواعد وطريقة لعب صباحو تحدي",
    howToPlayRules:
      "١. 🔥 المزاد (The Auction): يظهر موضوع كروي (مثال: أندية كسبت دوري الأبطال). يتزايد اللاعبون: 'أقول ٣' .. 'أقول ٥' .. 'أقول ٨!'. صاحب أعلى رقم يدخل مؤقت ٣٠ ثانية ليقولهم كلهم!\n" +
      "٢. 🎽 مسيرة اللاعب (Career Path): تظهر محطات أندية اللاعب التاريخية محطة تلو الأخرى. أول من يدوس على 'البزر' يوقف الوقت ويخمن اللاعب!\n" +
      "٣. 🔐 لعبة كلمة السر (Password Game): زميلك يشوف كارت اللاعب أو النادي ويقولك كلمة واحدة فقط كتلميح لتخمن أكبر عدد من الكلمات في ٦٠ ثانية!\n" +
      "٤. ⚡ تحدي السرعة (Speed Challenge): ٥ إلى ١٠ ثوانٍ فقط لذكر ٣ لاعبين أو أندية تحقق شرط التحدي!\n" +
      "٥. 👥 أسماء الفرق المخصصة: يحدد الأدمن أسماء الفريقين (مثال: الأهلي ضد الزمالك، أو ريال مدريد ضد برشلونة) ويتنافس الفريقان على البطولة!",
    createRoom: "فتح غرفة صباحو تحدي جديدة",
    roomTitle: "اسم الغرفة",
    gameMode: "نوع التحديات",
    modeMixed: "ميكس تحديات (مزاد + مسيرة لاعب + باسورد + سرعة)",
    modeAuction: "المزاد فقط (The Auction)",
    modeCareer: "مسيرة اللاعب فقط (Career Path)",
    modePassword: "لعبة كلمة السر فقط (Password Game)",
    modeSpeed: "تحدي السرعة فقط (Speed Challenge)",
    playStyle: "نظام اللعب",
    teamsPlay: "نظام فريقين (تخصيص أسماء الفرق)",
    soloPlay: "فردي (كل لاعب لنفسه)",
    team1Label: "اسم الفريق الأول (الأحمر)",
    team2Label: "اسم الفريق الثاني (الأبيض)",
    visibility: "نوع الغرفة",
    publicRoom: "غرفة عامة",
    privateRoom: "غرفة خاصة (بكلمة سر)",
    roomPassword: "كلمة سر الغرفة",
    roundsTotal: "عدد جولات التحدي",
    create: "إنشاء ودخول التحدي",
    joinByCode: "الانضمام برمز الغرفة",
    roomCode: "رمز الغرفة",
    join: "دخول التحدي",
    availableRooms: "غرف صباحو تحدي المتاحة",
    openRoom: "دخول الغرفة",
    playersLabel: "لاعبين",
    statusWaiting: "في انتظار اللاعبين",
    statusPlaying: "التحدي جاري",
    statusFinished: "انتهى التحدي",
    language: "اللغة",
    english: "English",
    arabic: "العربية",
  },
};

export default function SabahoLobbyClient() {
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
  const [title, setTitle] = useState("تحدي كورة القهاوي");
  const [gameMode, setGameMode] = useState<"MIXED" | "AUCTION" | "CAREER_PATH" | "SPEED" | "PASSWORD">("MIXED");
  const [isTeamPlay, setIsTeamPlay] = useState(true);
  const [team1Name, setTeam1Name] = useState("فريق الأهلي");
  const [team2Name, setTeam2Name] = useState("فريق الزمالك");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [password, setPassword] = useState("");
  const [roundsTotal, setRoundsTotal] = useState(6);
  const [joinCode, setJoinCode] = useState("");
  const [joinPassword, setJoinPassword] = useState("");

  const links = useMemo(
    () => ({
      en: `/games/sabaho?lang=en`,
      ar: `/games/sabaho?lang=ar`,
    }),
    [],
  );

  const fetchRooms = async () => {
    try {
      const response = await fetch("/api/games/sabaho/rooms", { cache: "no-store" });
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
      const res = await fetch("/api/games/sabaho/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          gameMode,
          isTeamPlay,
          team1Name: isTeamPlay ? team1Name : undefined,
          team2Name: isTeamPlay ? team2Name : undefined,
          visibility,
          password: visibility === "PRIVATE" ? password : undefined,
          roundsTotal,
        }),
      });

      const data = (await res.json()) as { roomCode?: string; error?: string };
      if (!res.ok || !data.roomCode) {
        setError(data.error ?? "Failed to create room.");
        setCreating(false);
        return;
      }

      router.push(`/games/sabaho/${data.roomCode}?lang=${lang}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create room.");
      setCreating(false);
    }
  };

  const handleJoin = async (targetCode: string, targetPassword?: string) => {
    setJoining(true);
    setError(null);

    try {
      const res = await fetch(`/api/games/sabaho/rooms/${targetCode}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: targetPassword }),
      });

      const data = (await res.json()) as { roomCode?: string; error?: string };
      if (!res.ok || !data.roomCode) {
        setError(data.error ?? "Failed to join room.");
        setJoining(false);
        return;
      }

      router.push(`/games/sabaho/${data.roomCode}?lang=${lang}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join room.");
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
            <span className="text-3xl animate-bounce">⚽</span>
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
                ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
            }`}
            href={links.en}
          >
            {t.english}
          </Link>
          <Link
            className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
              lang === "ar"
                ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
            }`}
            href={links.ar}
          >
            {t.arabic}
          </Link>
        </div>
      </div>

      {/* Rules Banner */}
      <section className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-950/20 p-5 shadow-sm">
        <h2 className="text-base font-black text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
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

      {/* Create Room and Join by Code */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Create Room Card */}
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
                className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  {t.gameMode}
                </label>
                <select
                  value={gameMode}
                  onChange={(e) => setGameMode(e.target.value as "MIXED" | "AUCTION" | "CAREER_PATH" | "SPEED" | "PASSWORD")}
                  className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="MIXED">{t.modeMixed}</option>
                  <option value="AUCTION">{t.modeAuction}</option>
                  <option value="CAREER_PATH">{t.modeCareer}</option>
                  <option value="PASSWORD">{t.modePassword}</option>
                  <option value="SPEED">{t.modeSpeed}</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  {t.playStyle}
                </label>
                <select
                  value={isTeamPlay ? "teams" : "solo"}
                  onChange={(e) => setIsTeamPlay(e.target.value === "teams")}
                  className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="teams">{t.teamsPlay}</option>
                  <option value="solo">{t.soloPlay}</option>
                </select>
              </div>
            </div>

            {isTeamPlay && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-3 space-y-2.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-red-700 dark:text-red-300">
                      🔴 {t.team1Label}
                    </label>
                    <input
                      type="text"
                      required
                      value={team1Name}
                      onChange={(e) => setTeam1Name(e.target.value)}
                      placeholder="الأهلي"
                      className="mt-1 w-full rounded-xl border border-red-200 dark:border-red-900/40 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-sky-700 dark:text-sky-300">
                      ⚪ {t.team2Label}
                    </label>
                    <input
                      type="text"
                      required
                      value={team2Name}
                      onChange={(e) => setTeam2Name(e.target.value)}
                      placeholder="الزمالك"
                      className="mt-1 w-full rounded-xl border border-sky-200 dark:border-sky-900/40 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] text-zinc-500 font-bold">Presets:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setTeam1Name("فريق الأهلي");
                      setTeam2Name("فريق الزمالك");
                    }}
                    className="rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200"
                  >
                    الأهلي vs الزمالك
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTeam1Name("ريال مدريد");
                      setTeam2Name("برشلونة");
                    }}
                    className="rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200"
                  >
                    ريال مدريد vs برشلونة
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTeam1Name("الفراعنة 🇪🇬");
                      setTeam2Name("السامبا 🇧🇷");
                    }}
                    className="rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200"
                  >
                    الفراعنة vs السامبا
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  {t.visibility}
                </label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as "PUBLIC" | "PRIVATE")}
                  className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="PUBLIC">{t.publicRoom}</option>
                  <option value="PRIVATE">{t.privateRoom}</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  {t.roundsTotal}
                </label>
                <select
                  value={roundsTotal}
                  onChange={(e) => setRoundsTotal(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={3}>3 Rounds</option>
                  <option value={6}>6 Rounds (Standard)</option>
                  <option value={9}>9 Rounds</option>
                  <option value={12}>12 Rounds (Marathon)</option>
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
                  className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={creating}
              className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-500 px-5 py-3 text-xs font-black text-white hover:opacity-95 transition shadow-lg shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
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
                  placeholder="e.g. SBH123"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="mt-1 w-full font-mono uppercase tracking-widest text-center text-lg font-black rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                  className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
            <span>🔥</span>
            <span>⚽</span>
            <span>🎽</span>
            <span>⚡</span>
            <span>🏆</span>
          </div>
        </section>
      </div>

      {/* Available Public Rooms List */}
      <section className="rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 p-5 shadow-sm backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <span>🌐</span>
            <span>{t.availableRooms}</span>
          </h2>
          <span className="text-xs text-zinc-400 font-mono">
            {rooms.length} rooms
          </span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-zinc-500">Loading rooms...</div>
        ) : rooms.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500">
            No public challenge rooms open. Create one to get started!
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="flex flex-col justify-between rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/70 p-4 transition hover:border-emerald-400"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-lg">
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
                    👥 {room._count.players}/12 {t.playersLabel} · 🏁 {room.roundsTotal} rounds · {room.isTeamPlay ? "Teams" : "Solo"}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={joining || room.status === "FINISHED" || room._count.players >= 12}
                  onClick={() => handleJoin(room.roomCode)}
                  className="mt-4 w-full rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition disabled:opacity-50 cursor-pointer text-center"
                >
                  {room._count.players >= 12 ? "Room Full" : t.openRoom}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
