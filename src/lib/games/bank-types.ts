export type TileType =
  | "PROPERTY"
  | "RAILROAD"
  | "UTILITY"
  | "CHANCE"
  | "COMMUNITY"
  | "TAX"
  | "CORNER"
  | "SPECIAL";

export type ColorGroup =
  | "PALESTINE" // القدس، غزة (رمادي / فحم)
  | "RED_CAPITALS" // بيروت، الرياض، بغداد (أحمر)
  | "YELLOW_LEVANT" // بنغازي، عمان، البحرين (أصفر ذهبي)
  | "MAGHREB_GREEN" // تونس، الجزائر (أخضر مغاربي)
  | "HISTORIC_ORANGE" // الإسكندرية، حلب (برتقالي / أحمر قرميدي)
  | "OLIVE_ELITE" // أسوان، دمشق، القاهرة (زيتوني / ذهبي)
  | "NILE_BROWN" // الخرطوم، عُمان (بني / كهرماني)
  | "EGYPT_BLACK" // الأقصر، بورسعيد (أسود كلاسيكي)
  | "PINK_YEMEN" // صنعاء (وردي)
  | "GULF_BLUE" // الكويت، قطر (أزرق سماوي)
  | "TRANSPORT" // الترامواي السريع
  | "UTILITY" // محطة بنزين / اللاسلكي
  | "SPECIAL";

export interface BoardTile {
  index: number;
  id: string;
  nameAr: string;
  nameEn: string;
  country: string;
  countryFlag: string;
  type: TileType;
  colorGroup: ColorGroup;
  price: number; // 0 for corners/special
  baseRent: number;
  rentTiers: [number, number, number, number, number, number]; // [base, 1 house, 2 houses, 3 houses, 4 houses, hotel]
  houseCost: number;
  mortgageValue: number;
  icon?: string;
}

export interface PropertyState {
  ownerId: string;
  houses: number; // 0 to 4 houses, 5 = hotel
  isMortgaged: boolean;
}

export type PropertiesStateMap = Record<number, PropertyState>;

export interface LuckCard {
  id: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  action:
    | "COLLECT_MONEY"
    | "PAY_MONEY"
    | "MOVE_TO"
    | "MOVE_STEPS"
    | "GO_TO_JAIL"
    | "GET_OUT_OF_JAIL"
    | "COLLECT_FROM_PLAYERS";
  amount?: number;
  targetIndex?: number;
  steps?: number;
}

export const JAIL_TILE_INDEX = 23; // سجن القلعة
export const GO_TO_JAIL_TILE_INDEX = 30; // محاكمة (تحويل إلى سجن القلعة)
export const START_TILE_INDEX = 0; // البداية

/**
 * Authentic 33-Tile Egyptian Bank El Hazz Board ("جولد ستار")
 * 11 columns x 8 rows rectangular perimeter starting at Bottom-Left (0: البداية)
 * moving counter-clockwise upward along the left side.
 */
export const BANK_TILES: BoardTile[] = [
  // 0: Bottom-Left Corner
  {
    index: 0,
    id: "tile-0",
    nameAr: "البداية",
    nameEn: "START",
    country: "عام",
    countryFlag: "🚩",
    type: "CORNER",
    colorGroup: "SPECIAL",
    price: 0,
    baseRent: 0,
    rentTiers: [0, 0, 0, 0, 0, 0],
    houseCost: 0,
    mortgageValue: 0,
    icon: "🚩",
  },
  // 1: Left Column
  {
    index: 1,
    id: "tile-1",
    nameAr: "القدس",
    nameEn: "Jerusalem",
    country: "فلسطين",
    countryFlag: "🇵🇸",
    type: "PROPERTY",
    colorGroup: "PALESTINE",
    price: 300,
    baseRent: 26,
    rentTiers: [26, 130, 390, 900, 1100, 1300],
    houseCost: 150,
    mortgageValue: 150,
  },
  // 2: Left Column
  {
    index: 2,
    id: "tile-2",
    nameAr: "غزة",
    nameEn: "Gaza",
    country: "فلسطين",
    countryFlag: "🇵🇸",
    type: "PROPERTY",
    colorGroup: "PALESTINE",
    price: 250,
    baseRent: 22,
    rentTiers: [22, 110, 330, 800, 975, 1150],
    houseCost: 150,
    mortgageValue: 125,
  },
  // 3: Left Column
  {
    index: 3,
    id: "tile-3",
    nameAr: "حظك",
    nameEn: "Chance",
    country: "عام",
    countryFlag: "❓",
    type: "CHANCE",
    colorGroup: "SPECIAL",
    price: 0,
    baseRent: 0,
    rentTiers: [0, 0, 0, 0, 0, 0],
    houseCost: 0,
    mortgageValue: 0,
    icon: "🎲",
  },
  // 4: Left Column
  {
    index: 4,
    id: "tile-4",
    nameAr: "بيروت",
    nameEn: "Beirut",
    country: "لبنان",
    countryFlag: "🇱🇧",
    type: "PROPERTY",
    colorGroup: "RED_CAPITALS",
    price: 200,
    baseRent: 16,
    rentTiers: [16, 80, 220, 600, 800, 1000],
    houseCost: 100,
    mortgageValue: 100,
  },
  // 5: Left Column
  {
    index: 5,
    id: "tile-5",
    nameAr: "الرياض",
    nameEn: "Riyadh",
    country: "السعودية",
    countryFlag: "🇸🇦",
    type: "PROPERTY",
    colorGroup: "RED_CAPITALS",
    price: 250,
    baseRent: 22,
    rentTiers: [22, 110, 330, 800, 975, 1150],
    houseCost: 150,
    mortgageValue: 125,
  },
  // 6: Left Column
  {
    index: 6,
    id: "tile-6",
    nameAr: "بغداد",
    nameEn: "Baghdad",
    country: "العراق",
    countryFlag: "🇮🇶",
    type: "PROPERTY",
    colorGroup: "RED_CAPITALS",
    price: 250,
    baseRent: 22,
    rentTiers: [22, 110, 330, 800, 975, 1150],
    houseCost: 150,
    mortgageValue: 125,
  },
  // 7: Top-Left Corner
  {
    index: 7,
    id: "tile-7",
    nameAr: "نادي الصيد",
    nameEn: "Shooting Club",
    country: "عام",
    countryFlag: "🎯",
    type: "CORNER",
    colorGroup: "SPECIAL",
    price: 0,
    baseRent: 0,
    rentTiers: [0, 0, 0, 0, 0, 0],
    houseCost: 0,
    mortgageValue: 0,
    icon: "🎯",
  },
  // 8: Top Row
  {
    index: 8,
    id: "tile-8",
    nameAr: "بنغازي",
    nameEn: "Benghazi",
    country: "ليبيا",
    countryFlag: "🇱🇾",
    type: "PROPERTY",
    colorGroup: "YELLOW_LEVANT",
    price: 150,
    baseRent: 12,
    rentTiers: [12, 60, 180, 500, 700, 900],
    houseCost: 100,
    mortgageValue: 75,
  },
  // 9: Top Row
  {
    index: 9,
    id: "tile-9",
    nameAr: "عمان",
    nameEn: "Amman",
    country: "الأردن",
    countryFlag: "🇯🇴",
    type: "PROPERTY",
    colorGroup: "YELLOW_LEVANT",
    price: 100,
    baseRent: 8,
    rentTiers: [8, 40, 100, 300, 450, 600],
    houseCost: 50,
    mortgageValue: 50,
  },
  // 10: Top Row
  {
    index: 10,
    id: "tile-10",
    nameAr: "محاكمة",
    nameEn: "Court Fine",
    country: "عام",
    countryFlag: "⚖️",
    type: "TAX",
    colorGroup: "SPECIAL",
    price: 50,
    baseRent: 50,
    rentTiers: [50, 0, 0, 0, 0, 0],
    houseCost: 0,
    mortgageValue: 0,
    icon: "⚖️",
  },
  // 11: Top Row
  {
    index: 11,
    id: "tile-11",
    nameAr: "البحرين",
    nameEn: "Bahrain",
    country: "البحرين",
    countryFlag: "🇧🇭",
    type: "PROPERTY",
    colorGroup: "YELLOW_LEVANT",
    price: 90,
    baseRent: 6,
    rentTiers: [6, 30, 90, 270, 400, 550],
    houseCost: 50,
    mortgageValue: 45,
  },
  // 12: Top Row
  {
    index: 12,
    id: "tile-12",
    nameAr: "حظك",
    nameEn: "Chance",
    country: "عام",
    countryFlag: "❓",
    type: "CHANCE",
    colorGroup: "SPECIAL",
    price: 0,
    baseRent: 0,
    rentTiers: [0, 0, 0, 0, 0, 0],
    houseCost: 0,
    mortgageValue: 0,
    icon: "🎲",
  },
  // 13: Top Row
  {
    index: 13,
    id: "tile-13",
    nameAr: "محطة بنزين / اللاسلكي",
    nameEn: "Gas Station / Wireless",
    country: "عام",
    countryFlag: "⛽",
    type: "UTILITY",
    colorGroup: "UTILITY",
    price: 50,
    baseRent: 10,
    rentTiers: [10, 10, 10, 10, 10, 10],
    houseCost: 0,
    mortgageValue: 25,
    icon: "⛽",
  },
  // 14: Top Row
  {
    index: 14,
    id: "tile-14",
    nameAr: "تونس",
    nameEn: "Tunis",
    country: "تونس",
    countryFlag: "🇹🇳",
    type: "PROPERTY",
    colorGroup: "MAGHREB_GREEN",
    price: 100,
    baseRent: 8,
    rentTiers: [8, 40, 100, 300, 450, 600],
    houseCost: 50,
    mortgageValue: 50,
  },
  // 15: Top Row
  {
    index: 15,
    id: "tile-15",
    nameAr: "الجزائر",
    nameEn: "Algiers",
    country: "الجزائر",
    countryFlag: "🇩🇿",
    type: "PROPERTY",
    colorGroup: "MAGHREB_GREEN",
    price: 200,
    baseRent: 16,
    rentTiers: [16, 80, 220, 600, 800, 1000],
    houseCost: 100,
    mortgageValue: 100,
  },
  // 16: Top-Right Corner (Double-width corner)
  {
    index: 16,
    id: "tile-16",
    nameAr: "الترامواي السريع",
    nameEn: "Express Tramway",
    country: "عام",
    countryFlag: "🚊",
    type: "CORNER",
    colorGroup: "TRANSPORT",
    price: 0,
    baseRent: 0,
    rentTiers: [0, 0, 0, 0, 0, 0],
    houseCost: 0,
    mortgageValue: 0,
    icon: "🚊",
  },
  // 17: Right Column
  {
    index: 17,
    id: "tile-17",
    nameAr: "الإسكندرية",
    nameEn: "Alexandria",
    country: "مصر",
    countryFlag: "🇪🇬",
    type: "PROPERTY",
    colorGroup: "HISTORIC_ORANGE",
    price: 250,
    baseRent: 22,
    rentTiers: [22, 110, 330, 800, 975, 1150],
    houseCost: 150,
    mortgageValue: 125,
  },
  // 18: Right Column
  {
    index: 18,
    id: "tile-18",
    nameAr: "حلب",
    nameEn: "Aleppo",
    country: "سوريا",
    countryFlag: "🇸🇾",
    type: "PROPERTY",
    colorGroup: "HISTORIC_ORANGE",
    price: 200,
    baseRent: 16,
    rentTiers: [16, 80, 220, 600, 800, 1000],
    houseCost: 100,
    mortgageValue: 100,
  },
  // 19: Right Column
  {
    index: 19,
    id: "tile-19",
    nameAr: "محاكمة",
    nameEn: "Court Fine",
    country: "عام",
    countryFlag: "⚖️",
    type: "TAX",
    colorGroup: "SPECIAL",
    price: 50,
    baseRent: 50,
    rentTiers: [50, 0, 0, 0, 0, 0],
    houseCost: 0,
    mortgageValue: 0,
    icon: "⚖️",
  },
  // 20: Right Column
  {
    index: 20,
    id: "tile-20",
    nameAr: "أسوان",
    nameEn: "Aswan",
    country: "مصر",
    countryFlag: "🇪🇬",
    type: "PROPERTY",
    colorGroup: "OLIVE_ELITE",
    price: 200,
    baseRent: 16,
    rentTiers: [16, 80, 220, 600, 800, 1000],
    houseCost: 100,
    mortgageValue: 100,
  },
  // 21: Right Column
  {
    index: 21,
    id: "tile-21",
    nameAr: "دمشق",
    nameEn: "Damascus",
    country: "سوريا",
    countryFlag: "🇸🇾",
    type: "PROPERTY",
    colorGroup: "OLIVE_ELITE",
    price: 250,
    baseRent: 22,
    rentTiers: [22, 110, 330, 800, 975, 1150],
    houseCost: 150,
    mortgageValue: 125,
  },
  // 22: Right Column
  {
    index: 22,
    id: "tile-22",
    nameAr: "القاهرة",
    nameEn: "Cairo",
    country: "مصر",
    countryFlag: "🇪🇬",
    type: "PROPERTY",
    colorGroup: "OLIVE_ELITE",
    price: 450,
    baseRent: 50,
    rentTiers: [50, 200, 600, 1400, 1800, 2200],
    houseCost: 200,
    mortgageValue: 225,
  },
  // 23: Bottom-Right Corner (Citadel Prison)
  {
    index: 23,
    id: "tile-23",
    nameAr: "سجن القلعة",
    nameEn: "Citadel Prison",
    country: "عام",
    countryFlag: "⛓️",
    type: "CORNER",
    colorGroup: "SPECIAL",
    price: 0,
    baseRent: 0,
    rentTiers: [0, 0, 0, 0, 0, 0],
    houseCost: 0,
    mortgageValue: 0,
    icon: "⛓️",
  },
  // 24: Bottom Row (Right to Left)
  {
    index: 24,
    id: "tile-24",
    nameAr: "الخرطوم",
    nameEn: "Khartoum",
    country: "السودان",
    countryFlag: "🇸🇩",
    type: "PROPERTY",
    colorGroup: "NILE_BROWN",
    price: 200,
    baseRent: 16,
    rentTiers: [16, 80, 220, 600, 800, 1000],
    houseCost: 100,
    mortgageValue: 100,
  },
  // 25: Bottom Row
  {
    index: 25,
    id: "tile-25",
    nameAr: "عُمان",
    nameEn: "Oman",
    country: "عُمان",
    countryFlag: "🇴🇲",
    type: "PROPERTY",
    colorGroup: "NILE_BROWN",
    price: 250,
    baseRent: 22,
    rentTiers: [22, 110, 330, 800, 975, 1150],
    houseCost: 150,
    mortgageValue: 125,
  },
  // 26: Bottom Row
  {
    index: 26,
    id: "tile-26",
    nameAr: "الأقصر",
    nameEn: "Luxor",
    country: "مصر",
    countryFlag: "🇪🇬",
    type: "PROPERTY",
    colorGroup: "EGYPT_BLACK",
    price: 200,
    baseRent: 16,
    rentTiers: [16, 80, 220, 600, 800, 1000],
    houseCost: 100,
    mortgageValue: 100,
  },
  // 27: Bottom Row
  {
    index: 27,
    id: "tile-27",
    nameAr: "بورسعيد",
    nameEn: "Port Said",
    country: "مصر",
    countryFlag: "🇪🇬",
    type: "PROPERTY",
    colorGroup: "EGYPT_BLACK",
    price: 250,
    baseRent: 22,
    rentTiers: [22, 110, 330, 800, 975, 1150],
    houseCost: 150,
    mortgageValue: 125,
  },
  // 28: Bottom Row
  {
    index: 28,
    id: "tile-28",
    nameAr: "حظك",
    nameEn: "Chance",
    country: "عام",
    countryFlag: "❓",
    type: "CHANCE",
    colorGroup: "SPECIAL",
    price: 0,
    baseRent: 0,
    rentTiers: [0, 0, 0, 0, 0, 0],
    houseCost: 0,
    mortgageValue: 0,
    icon: "🎲",
  },
  // 29: Bottom Row
  {
    index: 29,
    id: "tile-29",
    nameAr: "صنعاء",
    nameEn: "Sanaa",
    country: "اليمن",
    countryFlag: "🇾🇪",
    type: "PROPERTY",
    colorGroup: "PINK_YEMEN",
    price: 250,
    baseRent: 22,
    rentTiers: [22, 110, 330, 800, 975, 1150],
    houseCost: 150,
    mortgageValue: 125,
  },
  // 30: Bottom Row (Court -> Directly to Citadel Prison)
  {
    index: 30,
    id: "tile-30",
    nameAr: "محاكمة (إلى السجن!)",
    nameEn: "Court (To Prison!)",
    country: "عام",
    countryFlag: "⚖️",
    type: "SPECIAL",
    colorGroup: "SPECIAL",
    price: 0,
    baseRent: 0,
    rentTiers: [0, 0, 0, 0, 0, 0],
    houseCost: 0,
    mortgageValue: 0,
    icon: "⚖️",
  },
  // 31: Bottom Row
  {
    index: 31,
    id: "tile-31",
    nameAr: "الكويت",
    nameEn: "Kuwait",
    country: "الكويت",
    countryFlag: "🇰🇼",
    type: "PROPERTY",
    colorGroup: "GULF_BLUE",
    price: 250,
    baseRent: 22,
    rentTiers: [22, 110, 330, 800, 975, 1150],
    houseCost: 150,
    mortgageValue: 125,
  },
  // 32: Bottom Row
  {
    index: 32,
    id: "tile-32",
    nameAr: "قطر",
    nameEn: "Qatar",
    country: "قطر",
    countryFlag: "🇶🇦",
    type: "PROPERTY",
    colorGroup: "GULF_BLUE",
    price: 150,
    baseRent: 12,
    rentTiers: [12, 60, 180, 500, 700, 900],
    houseCost: 100,
    mortgageValue: 75,
  },
];

export const COLOR_GROUP_DETAILS: Record<
  ColorGroup,
  { nameAr: string; nameEn: string; hex: string; lightHex: string; tileIndices: number[] }
> = {
  PALESTINE: {
    nameAr: "فلسطين (القدس وغزة)",
    nameEn: "Palestine",
    hex: "#374151",
    lightHex: "#6b7280",
    tileIndices: [1, 2],
  },
  RED_CAPITALS: {
    nameAr: "عواصم عربية (بيروت والرياض وبغداد)",
    nameEn: "Arab Capitals",
    hex: "#dc2626",
    lightHex: "#ef4444",
    tileIndices: [4, 5, 6],
  },
  YELLOW_LEVANT: {
    nameAr: "المتوسط والخليج (بنغازي وعمان والبحرين)",
    nameEn: "Mediterranean & Gulf",
    hex: "#eab308",
    lightHex: "#facc15",
    tileIndices: [8, 9, 11],
  },
  MAGHREB_GREEN: {
    nameAr: "المغرب العربي (تونس والجزائر)",
    nameEn: "Maghreb",
    hex: "#16a34a",
    lightHex: "#4ade80",
    tileIndices: [14, 15],
  },
  HISTORIC_ORANGE: {
    nameAr: "مدن تاريخية (الإسكندرية وحلب)",
    nameEn: "Historic Gems",
    hex: "#ea580c",
    lightHex: "#fb923c",
    tileIndices: [17, 18],
  },
  OLIVE_ELITE: {
    nameAr: "عواصم كبرى (أسوان ودمشق والقاهرة)",
    nameEn: "Metropolises",
    hex: "#4d7c0f",
    lightHex: "#84cc16",
    tileIndices: [20, 21, 22],
  },
  NILE_BROWN: {
    nameAr: "جنوب الوادي وعُمان (الخرطوم وعُمان)",
    nameEn: "Nile & Oman",
    hex: "#854d0e",
    lightHex: "#a16207",
    tileIndices: [24, 25],
  },
  EGYPT_BLACK: {
    nameAr: "مدن مصرية (الأقصر وبورسعيد)",
    nameEn: "Egyptian Cities",
    hex: "#27272a",
    lightHex: "#71717a",
    tileIndices: [26, 27],
  },
  PINK_YEMEN: {
    nameAr: "اليمن السعيد (صنعاء)",
    nameEn: "Yemen",
    hex: "#db2777",
    lightHex: "#f472b6",
    tileIndices: [29],
  },
  GULF_BLUE: {
    nameAr: "الخليج العربي (الكويت وقطر)",
    nameEn: "Arabian Gulf",
    hex: "#0284c7",
    lightHex: "#38bdf8",
    tileIndices: [31, 32],
  },
  TRANSPORT: {
    nameAr: "الترامواي السريع",
    nameEn: "Express Tramway",
    hex: "#475569",
    lightHex: "#94a3b8",
    tileIndices: [16],
  },
  UTILITY: {
    nameAr: "محطة بنزين / اللاسلكي",
    nameEn: "Gas Station / Wireless",
    hex: "#9333ea",
    lightHex: "#c084fc",
    tileIndices: [13],
  },
  SPECIAL: {
    nameAr: "خانات خاصة",
    nameEn: "Special Tiles",
    hex: "#71717a",
    lightHex: "#a1a1aa",
    tileIndices: [0, 3, 7, 10, 12, 19, 23, 28, 30],
  },
};

export const LUCK_CARDS: LuckCard[] = [
  {
    id: "luck-1",
    titleAr: "ربح يانصيب بنك الحظ",
    titleEn: "Bank Lottery Win",
    descAr: "مبروك! ربحت في سحب بنك الحظ وحصلت على ١٥٠ جنيه.",
    descEn: "Congratulations! You won the Bank Lottery. Collect 150 EGP.",
    action: "COLLECT_MONEY",
    amount: 150,
  },
  {
    id: "luck-2",
    titleAr: "غرامة سرعة على الطريق الصحراوي",
    titleEn: "Speeding Ticket",
    descAr: "رادارات الطريق رصدت سرعتك! ادفع غرامة ٥٠ جنيه للمرور.",
    descEn: "Speed camera caught you! Pay a 50 EGP fine.",
    action: "PAY_MONEY",
    amount: 50,
  },
  {
    id: "luck-3",
    titleAr: "تذكرة سفر إلى القاهرة",
    titleEn: "Travel directly to Cairo",
    descAr: "تذكرة مجانية للذهاب مباشرة إلى القاهرة (إذا مررت على البداية اقبض ٢٠٠ جنيه).",
    descEn: "Advance token directly to Cairo. If you pass START, collect 200 EGP.",
    action: "MOVE_TO",
    targetIndex: 22,
  },
  {
    id: "luck-4",
    titleAr: "إلى سجن القلعة فوراً!",
    titleEn: "Go Directly to Citadel Prison",
    descAr: "صدر أمر قضائي ضدك، اذهب إلى سجن القلعة فوراً ولا تمر على محطة البداية.",
    descEn: "Go directly to Citadel Prison. Do not pass START, do not collect 200.",
    action: "GO_TO_JAIL",
  },
  {
    id: "luck-5",
    titleAr: "كارت إفراج فوري من السجن",
    titleEn: "Get Out of Jail Free",
    descAr: "عفو استثنائي! احتفظ بهذا الكارت للخروج من سجن القلعة مجاناً عند الحاجة.",
    descEn: "Keep this card to get out of Citadel Prison free anytime.",
    action: "GET_OUT_OF_JAIL",
  },
  {
    id: "luck-6",
    titleAr: "عطلة صيفية في الإسكندرية",
    titleEn: "Trip to Alexandria",
    descAr: "الجو بديع في عروس البحر الأبيض! تحرك مباشرة إلى الإسكندرية.",
    descEn: "Take a trip to Alexandria. Advance token directly.",
    action: "MOVE_TO",
    targetIndex: 17,
  },
  {
    id: "luck-7",
    titleAr: "هدية عيد ميلادك من الأصدقاء",
    titleEn: "Birthday Gift",
    descAr: "عيد ميلاد سعيد! كل لاعب في الطاولة يقدم لك ٢٥ جنيه كهدية.",
    descEn: "It's your birthday! Collect 25 EGP from each player.",
    action: "COLLECT_FROM_PLAYERS",
    amount: 25,
  },
  {
    id: "luck-8",
    titleAr: "إصلاحات وتجديد العقارات",
    titleEn: "Property Maintenance",
    descAr: "الصيانة الدورية لعقاراتك: ادفع ٥٠ جنيه لتصليح المرافق.",
    descEn: "Pay 50 EGP for general property repairs.",
    action: "PAY_MONEY",
    amount: 50,
  },
  {
    id: "luck-9",
    titleAr: "أرباح استثمارية في البورصة",
    titleEn: "Stock Dividends",
    descAr: "ارتفاع أسهم الشركات العربية! اقبض ١٠٠ جنيه أرباح.",
    descEn: "Stocks went up! Collect 100 EGP dividends.",
    action: "COLLECT_MONEY",
    amount: 100,
  },
  {
    id: "luck-10",
    titleAr: "تراجع ٣ خطوات للخلف",
    titleEn: "Move Back 3 Steps",
    descAr: "نسيت أوراقك المهمة! ارجع ٣ خانات إلى الخلف.",
    descEn: "Forgot your documents! Move back 3 spaces.",
    action: "MOVE_STEPS",
    steps: -3,
  },
  {
    id: "luck-11",
    titleAr: "زيارة سياحية للأقصر",
    titleEn: "Visit Luxor Antiquities",
    descAr: "اذهب لزيارة معابد الكرنك ووادي الملوك في الأقصر.",
    descEn: "Advance directly to Luxor.",
    action: "MOVE_TO",
    targetIndex: 26,
  },
  {
    id: "luck-12",
    titleAr: "استرداد ضريبي من الدولة",
    titleEn: "Tax Refund",
    descAr: "مصلحة الضرائب تعيد لك فائض الضرائب: اقبض ٧٥ جنيه.",
    descEn: "Income tax refund! Collect 75 EGP.",
    action: "COLLECT_MONEY",
    amount: 75,
  },
];
