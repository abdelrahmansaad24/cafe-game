"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

type PublicRoom = {
  roomCode: string;
  title: string;
  status: "WAITING" | "PLAYING" | "FINISHED";
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
    title: "بنك الحظ (Bank El Hazz / Monopoly) - Lobby",
    subtitle: "Classic Arab World Bank El Hazz with authentic Arab cities, Egyptian landmarks, buildings & mobile rotation.",
    howToPlay: "Bank El Hazz Rules",
    howToPlayRules:
      "1. Board: 40 tiles featuring famous Arab cities (Khartoum, Casablanca, Damascus, Beirut, Baghdad, Manama, Doha, Kuwait, Medina, Mecca, Riyadh, Abu Dhabi, Dubai) and Egypt's iconic cities (Cairo, Alexandria, Luxor, New Valley)!\n" +
      "2. Money & Movement: Each player starts with 1500 EGP. Roll two dice to move around the board. Doubles award another turn; 3 consecutive doubles send you to Jail!\n" +
      "3. Passing GO: Receive 200 EGP salary whenever you pass or land on GO (محطة البداية).\n" +
      "4. Buying & Monopolies: Land on unowned cities to buy them. Owning all cities in a country or color group gives you a Monopoly and doubles base rent!\n" +
      "5. Buildings (عمارات وفنادق): With a full monopoly, build up to 4 Houses (عمارات) and 1 Hotel (فندق) per property to multiply rent exponentially!\n" +
      "6. Transit & Utilities: International Airports (Cairo, Dubai, Jeddah, Beirut) and Electricity/Water utilities offer extra income!\n" +
      "7. Jail & Bail: If jailed, roll doubles, pay a 50 EGP bail fine, or use a Get Out of Jail Free card!\n" +
      "8. Victory: Outsmart your opponents, avoid bankruptcy, and become the Bank El Hazz Tycoon!",
    createRoom: "Create Bank El Hazz Table",
    roomTitle: "Table Title",
    visibility: "Visibility",
    publicRoom: "Public",
    privateRoom: "Private (Password)",
    roomPassword: "Password",
    create: "Start New Table",
    joinByCode: "Join by 6-character Code",
    roomCode: "Room Code",
    join: "Join Table",
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
    title: "بنك الحظ (Bank El Hazz) - صالة اللعب",
    subtitle: "لعبة بنك الحظ الأصلية بأشهر عواصم ومدن العالم العربي، ومدن مصر الأيقونية، وبناء العمارات والفنادق وتدوير الشاشة.",
    howToPlay: "قوانين لعبة بنك الحظ",
    howToPlayRules:
      "١. الرقعة: ٤٠ خانة تضم أشهر المدن العربية (الخرطوم، الدار البيضاء، تونس، عمّان، دمشق، بيروت، بغداد، المنامة، الدوحة، الكويت، المدينة، مكة، الرياض، أبو ظبي، دبي) بالإضافة لمدن مصر التاريخية (القاهرة، الإسكندرية، الأقصر، الوادي الجديد)!\n" +
      "٢. البداية والحركة: يبدأ كل لاعب برصيد ١٥٠٠ جنيه. ارمِ حجري النرد للتحرك، والتطابق (Doubles) يمنحك رمية إضافية (٣ تطابقات متتالية تُدخلك السجن فوراً)!\n" +
      "٣. محطة ابدأ: عند المرور أو الوقوف على ابدأ تقبض راتب ٢٠٠ جنيه.\n" +
      "٤. الشراء والاحتكار: يمكنك شراء المدن غير المملوكة. امتلاك جميع مدن الدولة أو المجموعة الواحدة يمنحك احتكاراً ويضاعف الإيجار الأساسي!\n" +
      "٥. العمارات والفنادق (Buildings): عند تحقيق الاحتكار، يمكنك تشييد حتى ٤ عمارات ثم فندق فخم على كل مدينة لمضاعفة الإيجار أضعافاً مضاعفة!\n" +
      "٦. المطارات والخدمات: ٤ مطارات دولية (القاهرة، دبي، جدة، بيروت) وشركتي الكهرباء والمياه لزيادة الأرباح.\n" +
      "٧. السجن والخروج: ارمِ نردين متطابقين للخروج، أو ادفع كفالة ٥٠ جنيه، أو استخدم كارت العفو المجاني.\n" +
      "٨. الفوز: صمد باستثماراتك وتجنب الإفلاس لتكون صاحب أكبر ثروة وملك بنك الحظ!",
    createRoom: "إنشاء طاولة بنك الحظ",
    roomTitle: "اسم الطاولة",
    visibility: "الخصوصية",
    publicRoom: "عامة (تظهر في القائمة)",
    privateRoom: "خاصة (بكلمة سر)",
    roomPassword: "كلمة السر",
    create: "إنشاء الطاولة",
    joinByCode: "دخول بكود الغرفة",
    roomCode: "كود الغرفة",
    join: "انضمام للطاولة",
    availableRooms: "طاولات بنك الحظ المتاحة",
    openRoom: "دخول الطاولة",
    playersLabel: "لاعبين",
    statusWaiting: "في انتظار اللاعبين",
    statusPlaying: "المباراة جارية",
    statusFinished: "انتهت",
    language: "اللغة",
    english: "English",
    arabic: "العربية",
  },
};

export default function BankLobbyClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") === "ar" ? "ar" : "en";
  const t = DICTIONARY[lang];

  const [publicRooms, setPublicRooms] = useState<PublicRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState(lang === "ar" ? "طاولة بنك الحظ" : "Bank El Hazz Table");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [password, setPassword] = useState("");
  const [turnTimerSeconds, setTurnTimerSeconds] = useState(30);
  const [creating, setCreating] = useState(false);

  const [joinCode, setJoinCode] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [joining, setJoining] = useState(false);
  const [joiningRoomCode, setJoiningRoomCode] = useState<string | null>(null);

  const links = useMemo(
    () => ({
      en: "/games/bank?lang=en",
      ar: "/games/bank?lang=ar",
    }),
    [],
  );

  useEffect(() => {
    let active = true;

    const fetchRooms = async () => {
      try {
        const response = await fetch("/api/games/bank/rooms", { cache: "no-store" });
        const data = await response.json();
        if (active) {
          if (response.ok && Array.isArray(data.rooms)) {
            setPublicRooms(data.rooms);
          }
          setLoadingRooms(false);
        }
      } catch {
        if (active) setLoadingRooms(false);
      }
    };

    fetchRooms();
    const timer = setInterval(fetchRooms, 3000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const handleCreateRoom = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setCreating(true);

    try {
      const response = await fetch("/api/games/bank/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          visibility,
          password: visibility === "PRIVATE" ? password : undefined,
          turnTimerSeconds,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.roomCode) {
        throw new Error(data.error || "Failed to create room.");
      }

      router.push(`/games/bank/${data.roomCode}?lang=${lang}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating room.");
      setCreating(false);
    }
  };

  const handleJoinPublicRoom = async (code: string) => {
    setError(null);
    setJoiningRoomCode(code);
    try {
      const response = await fetch(`/api/games/bank/rooms/${code}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || (lang === "ar" ? "تعذر الانضمام للطاولة." : "Could not join table."));
      }

      router.push(`/games/bank/${code}?lang=${lang}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : (lang === "ar" ? "تعذر الانضمام للطاولة." : "Could not join table."));
      setJoiningRoomCode(null);
    }
  };

  const handleJoinByCode = async (e: FormEvent) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) {
      setError(lang === "ar" ? "كود الغرفة يجب أن يتكون من 6 خانات." : "Code must be 6 characters.");
      return;
    }

    setJoining(true);
    setError(null);

    try {
      const response = await fetch(`/api/games/bank/rooms/${code}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: joinPassword.trim() || undefined }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || (lang === "ar" ? "تعذر الانضمام للطاولة." : "Could not join table."));
      }

      router.push(`/games/bank/${code}?lang=${lang}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : (lang === "ar" ? "تعذر الانضمام للطاولة." : "Error joining table."));
      setJoining(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-8" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-4xl">🎲</span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
              {t.title}
            </h1>
          </div>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t.subtitle}</p>
        </div>

        {/* Lang switch */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href={links.ar}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              lang === "ar"
                ? "bg-amber-600 text-white shadow"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            العربية
          </Link>
          <Link
            href={links.en}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              lang === "en"
                ? "bg-amber-600 text-white shadow"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            English
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-4 text-xs sm:text-sm font-semibold text-red-700 dark:text-red-300">
          ⚠️ {error}
        </div>
      )}

      {/* Rules Banner */}
      <details className="group rounded-3xl border border-amber-200 dark:border-amber-900/50 bg-amber-500/10 dark:bg-amber-950/20 p-5 shadow-sm transition">
        <summary className="flex cursor-pointer items-center justify-between font-bold text-amber-900 dark:text-amber-200 text-sm sm:text-base">
          <span className="flex items-center gap-2">
            <span>📜</span>
            <span>{t.howToPlay}</span>
          </span>
          <span className="text-xs text-amber-700 dark:text-amber-400 font-mono group-open:rotate-180 transition">
            ▼
          </span>
        </summary>
        <p className="mt-4 whitespace-pre-line text-xs sm:text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 border-t border-amber-500/20 pt-3">
          {t.howToPlayRules}
        </p>
      </details>

      <div className="grid gap-8 md:grid-cols-2">
        {/* CREATE ROOM CARD */}
        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>🏰</span>
              <span>{t.createRoom}</span>
            </h2>

            <form onSubmit={handleCreateRoom} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  {t.roomTitle}
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  {t.visibility}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setVisibility("PUBLIC")}
                    className={`rounded-xl px-3 py-2 text-xs font-bold border transition ${
                      visibility === "PUBLIC"
                        ? "border-amber-600 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                        : "border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    🌐 {t.publicRoom}
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibility("PRIVATE")}
                    className={`rounded-xl px-3 py-2 text-xs font-bold border transition ${
                      visibility === "PRIVATE"
                        ? "border-amber-600 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                        : "border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    🔒 {t.privateRoom}
                  </button>
                </div>
              </div>

              {visibility === "PRIVATE" && (
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    {t.roomPassword}
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  ⏱️ {lang === "ar" ? "مؤقت حركة اللاعب (لكل دور)" : "Player Turn Timer"}
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 text-xs font-bold">
                  {[
                    { sec: 15, label: lang === "ar" ? "١٥ ثانية" : "15s" },
                    { sec: 30, label: lang === "ar" ? "٣٠ ثانية" : "30s" },
                    { sec: 60, label: lang === "ar" ? "٦٠ ثانية" : "60s" },
                    { sec: 90, label: lang === "ar" ? "٩٠ ثانية" : "90s" },
                    { sec: 0, label: lang === "ar" ? "♾️ لا نهائي" : "♾️ Infinite" },
                  ].map((item) => (
                    <button
                      key={item.sec}
                      type="button"
                      onClick={() => setTurnTimerSeconds(item.sec)}
                      className={`rounded-xl py-2 px-1 text-center border transition ${
                        turnTimerSeconds === item.sec
                          ? "border-amber-500 bg-amber-500/20 text-amber-700 dark:text-amber-300 font-extrabold"
                          : "border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full mt-4 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-amber-600/30 hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-50"
              >
                {creating ? "..." : t.create}
              </button>
            </form>
          </div>
        </div>

        {/* JOIN BY CODE & AVAILABLE ROOMS */}
        <div className="space-y-6">
          {/* JOIN BY CODE */}
          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-6 shadow-sm">
            <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>🔑</span>
              <span>{t.joinByCode}</span>
            </h2>

            <form onSubmit={handleJoinByCode} className="mt-4 space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="ABC123"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="flex-1 font-mono tracking-widest text-center uppercase font-black rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2.5 text-base text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="submit"
                  disabled={joining}
                  className="rounded-xl bg-zinc-900 dark:bg-zinc-100 px-5 py-2.5 text-xs font-bold text-white dark:text-zinc-900 hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
                >
                  {joining ? "..." : t.join}
                </button>
              </div>
              <input
                type="password"
                placeholder={lang === "ar" ? "كلمة السر (إن وجدت)" : "Password (if private table)"}
                value={joinPassword}
                onChange={(e) => setJoinPassword(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </form>
          </div>

          {/* PUBLIC ROOMS LIST */}
          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-6 shadow-sm">
            <h2 className="text-base font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-4">
              <span>🌐</span>
              <span>{t.availableRooms}</span>
            </h2>

            {loadingRooms ? (
              <p className="text-xs text-zinc-400 py-4 text-center">...</p>
            ) : publicRooms.length === 0 ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 py-6 text-center">
                {lang === "ar"
                  ? "لا توجد طاولات مفتوحة حالياً، أنشئ أول طاولة الآن!"
                  : "No public tables available right now. Create one!"}
              </p>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto no-scrollbar">
                {publicRooms.map((r) => (
                  <div
                    key={r.roomCode}
                    className="flex items-center justify-between rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 p-3 hover:bg-amber-500/5 transition"
                  >
                    <div>
                      <h3 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">
                        {r.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-500">
                        <span className="font-mono font-bold text-amber-600">{r.roomCode}</span>
                        <span>•</span>
                        <span>
                          {r.playerCount} {t.playersLabel}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={joiningRoomCode === r.roomCode}
                      onClick={() => handleJoinPublicRoom(r.roomCode)}
                      className="rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-amber-500 transition shadow disabled:opacity-50 cursor-pointer"
                    >
                      {joiningRoomCode === r.roomCode ? "..." : `${t.openRoom} →`}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
