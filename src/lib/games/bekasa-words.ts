import { env } from "@/lib/env";

export interface CategoryDefinition {
  id: string;
  nameAr: string;
  nameEn: string;
  icon: string;
  clusters: Array<{
    name: string;
    items: Array<{ ar: string; en: string }>;
  }>;
}

export const BEKASA_CATEGORIES: CategoryDefinition[] = [
  {
    id: "football",
    nameAr: "لاعبو كرة قدم",
    nameEn: "Football Players",
    icon: "⚽",
    clusters: [
      {
        name: "World Class Wingers & Strikers",
        items: [
          { ar: "محمد صلاح", en: "Mohamed Salah" },
          { ar: "ساديو ماني", en: "Sadio Mane" },
          { ar: "رياض محرز", en: "Riyad Mahrez" },
          { ar: "فينيسيوس جونيور", en: "Vinicius Jr" },
          { ar: "كيليان مبابي", en: "Kylian Mbappe" },
          { ar: "إيرلينغ هالاند", en: "Erling Haaland" },
          { ar: "بوكايو ساكا", en: "Bukayo Saka" },
          { ar: "سون هيونغ مين", en: "Son Heung-min" },
          { ar: "عثمان ديمبيلي", en: "Ousmane Dembele" },
        ],
      },
      {
        name: "Legends of the Game",
        items: [
          { ar: "ليونيل ميسي", en: "Lionel Messi" },
          { ar: "كريستيانو رونالدو", en: "Cristiano Ronaldo" },
          { ar: "نيمار جونيور", en: "Neymar Jr" },
          { ar: "كريم بنزيما", en: "Karim Benzema" },
          { ar: "روبرت ليفاندوفسكي", en: "Robert Lewandowski" },
          { ar: "لوكا مودريتش", en: "Luka Modric" },
          { ar: "كيفين دي بروين", en: "Kevin De Bruyne" },
          { ar: "أندريس إنييستا", en: "Andres Iniesta" },
          { ar: "زين الدين زيدان", en: "Zinedine Zidane" },
        ],
      },
      {
        name: "Midfield Maestros & Defenders",
        items: [
          { ar: "فيرجيل فان دايك", en: "Virgil van Dijk" },
          { ar: "سيرجيو راموس", en: "Sergio Ramos" },
          { ar: "أشرف حكيمي", en: "Achraf Hakimi" },
          { ar: "رودري", en: "Rodri" },
          { ar: "جود بيلينغهام", en: "Jude Bellingham" },
          { ar: "بيدري", en: "Pedri" },
          { ar: "توني كروس", en: "Toni Kroos" },
          { ar: "أنطونيو روديغر", en: "Antonio Rudiger" },
        ],
      },
    ],
  },
  {
    id: "food",
    nameAr: "أكلات ومشروبات",
    nameEn: "Food & Drinks",
    icon: "🍕",
    clusters: [
      {
        name: "Fast Food & Street Food",
        items: [
          { ar: "شاورما دجاج", en: "Chicken Shawarma" },
          { ar: "شاورما لحم", en: "Beef Shawarma" },
          { ar: "برجر بالجبنة", en: "Cheeseburger" },
          { ar: "بيتزا بيبيروني", en: "Pepperoni Pizza" },
          { ar: "فلافل وطعمية", en: "Falafel" },
          { ar: "كشري مصري", en: "Koshary" },
          { ar: "حواوشي", en: "Hawawshi" },
          { ar: "سوشي رول", en: "Sushi Roll" },
          { ar: "تاكوس مكسيكي", en: "Mexican Tacos" },
        ],
      },
      {
        name: "Traditional & Rice Dishes",
        items: [
          { ar: "كبسة سعودية", en: "Saudi Kabsa" },
          { ar: "مندي لحم", en: "Mandi Meat" },
          { ar: "منسف أردني", en: "Jordanian Mansaf" },
          { ar: "برياني دجاج", en: "Chicken Biryani" },
          { ar: "ملوخية بالفراخ", en: "Molokhia with Chicken" },
          { ar: "محشي مشكل", en: "Stuffed Vegetables (Mahshi)" },
          { ar: "ورق عنب", en: "Stuffed Grape Leaves" },
          { ar: "مقلوبة باذنجان", en: "Maqluba" },
        ],
      },
      {
        name: "Sweets & Cafe Drinks",
        items: [
          { ar: "كنافة بالجبنة", en: "Kunafa with Cheese" },
          { ar: "أم علي", en: "Umm Ali" },
          { ar: "سينابون رول", en: "Cinnabon Roll" },
          { ar: "تشيز كيك لوتس", en: "Lotus Cheesecake" },
          { ar: "سبانش لاتيه بارد", en: "Iced Spanish Latte" },
          { ar: "ماتشا لاتيه", en: "Matcha Latte" },
          { ar: "كراميل ماكياتو", en: "Caramel Macchiato" },
          { ar: "شاي كرك", en: "Karak Chai" },
        ],
      },
    ],
  },
  {
    id: "makeup",
    nameAr: "مكياج وتجميل",
    nameEn: "Makeup & Cosmetics",
    icon: "💄",
    clusters: [
      {
        name: "Face & Base",
        items: [
          { ar: "كريم أساس (فاونديشن)", en: "Foundation" },
          { ar: "كونسيلر (مخفي عيوب)", en: "Concealer" },
          { ar: "بلاشر (أحمر خدود)", en: "Blush" },
          { ar: "هايلايتر (إضاءة)", en: "Highlighter" },
          { ar: "بودرة تثبيت شفافة", en: "Setting Powder" },
          { ar: "برايمر للوجه", en: "Face Primer" },
          { ar: "كونتور لنحت الوجه", en: "Contour" },
          { ar: "سبراي مثبت مكياج", en: "Setting Spray" },
        ],
      },
      {
        name: "Eyes & Lips",
        items: [
          { ar: "ماسكارا رموش", en: "Mascara" },
          { ar: "آيلاينر سائل", en: "Liquid Eyeliner" },
          { ar: "باليت آيشادو (ظلال عيون)", en: "Eyeshadow Palette" },
          { ar: "قلم حواجب", en: "Eyebrow Pencil" },
          { ar: "أحمر شفاه مات (روج)", en: "Matte Lipstick" },
          { ar: "ملمع شفاه (ليب جلوس)", en: "Lip Gloss" },
          { ar: "مرطب شفاه وردي (ليب بالم)", en: "Lip Balm" },
          { ar: "محدد شفاه (ليب لاينر)", en: "Lip Liner" },
        ],
      },
    ],
  },
  {
    id: "clothes",
    nameAr: "ملابس وموضة",
    nameEn: "Clothes & Fashion",
    icon: "👕",
    clusters: [
      {
        name: "Casual & Outerwear",
        items: [
          { ar: "هودي أوفر سايز", en: "Oversized Hoodie" },
          { ar: "تيشيرت بولو", en: "Polo T-Shirt" },
          { ar: "جاكيت جلد أسود", en: "Leather Jacket" },
          { ar: "جاكيت جينز", en: "Denim Jacket" },
          { ar: "سويتر صوف", en: "Wool Sweater" },
          { ar: "بليزر رسمي", en: "Blazer" },
          { ar: "بنطلون جينز بوي فريند", en: "Boyfriend Jeans" },
          { ar: "بنطلون كارجو بجيوب", en: "Cargo Pants" },
          { ar: "سويت بانتس قطني", en: "Sweatpants" },
        ],
      },
      {
        name: "Shoes & Accessories",
        items: [
          { ar: "سنيكرز نايكي أبيض", en: "White Nike Sneakers" },
          { ar: "حذاء كلاسيك جلد", en: "Classic Leather Shoes" },
          { ar: "بوت شتوي عالي", en: "High Winter Boots" },
          { ar: "كاب بيسبول", en: "Baseball Cap" },
          { ar: "نظارة شمسية كلاسيك", en: "Sunglasses" },
          { ar: "ساعة يد فاخرة", en: "Luxury Watch" },
          { ar: "حقيبة كتف جلدية", en: "Leather Crossbody Bag" },
          { ar: "سكارف أو شال حرير", en: "Silk Scarf" },
        ],
      },
    ],
  },
  {
    id: "places",
    nameAr: "أماكن ومدن",
    nameEn: "Places & Cities",
    icon: "🌍",
    clusters: [
      {
        name: "Famous Arab & Tourist Cities",
        items: [
          { ar: "دبي", en: "Dubai" },
          { ar: "الرياض", en: "Riyadh" },
          { ar: "القاهرة", en: "Cairo" },
          { ar: "الإسكندرية", en: "Alexandria" },
          { ar: "بيروت", en: "Beirut" },
          { ar: "إسطنبول", en: "Istanbul" },
          { ar: "شرم الشيخ", en: "Sharm El Sheikh" },
          { ar: "الدوحة", en: "Doha" },
          { ar: "مراكش", en: "Marrakech" },
        ],
      },
      {
        name: "Global Metros & Capitals",
        items: [
          { ar: "باريس", en: "Paris" },
          { ar: "لندن", en: "London" },
          { ar: "روما", en: "Rome" },
          { ar: "برشلونة", en: "Barcelona" },
          { ar: "نيويورك", en: "New York" },
          { ar: "طوكيو", en: "Tokyo" },
          { ar: "أمستردام", en: "Amsterdam" },
          { ar: "بالي", en: "Bali" },
        ],
      },
    ],
  },
  {
    id: "jobs",
    nameAr: "مهن ووظائف",
    nameEn: "Jobs & Professions",
    icon: "💼",
    clusters: [
      {
        name: "Medical & Tech & Engineering",
        items: [
          { ar: "طبيب جراح", en: "Surgeon" },
          { ar: "طبيب أسنان", en: "Dentist" },
          { ar: "مهندس برمجيات", en: "Software Engineer" },
          { ar: "مهندس معماري", en: "Architect" },
          { ar: "طيار مدني", en: "Commercial Pilot" },
          { ar: "صيدلي", en: "Pharmacist" },
          { ar: "مصمم جرافيك", en: "Graphic Designer" },
          { ar: "عالم بيانات", en: "Data Scientist" },
        ],
      },
      {
        name: "Public, Creative & Business",
        items: [
          { ar: "محامي جنائي", en: "Defense Attorney" },
          { ar: "شيف مطعم فاخر", en: "Executive Chef" },
          { ar: "مذيع تلفزيوني", en: "TV Presenter" },
          { ar: "رائد فضاء", en: "Astronaut" },
          { ar: "ضابط شرطة", en: "Police Officer" },
          { ar: "رجل إطفاء", en: "Firefighter" },
          { ar: "مدير تسويق", en: "Marketing Manager" },
          { ar: "صانع محتوى (يوتيوبر)", en: "Content Creator" },
        ],
      },
    ],
  },
  {
    id: "movies",
    nameAr: "أفلام ومسلسلات",
    nameEn: "Movies & Shows",
    icon: "🎬",
    clusters: [
      {
        name: "Blockbusters & Anime",
        items: [
          { ar: "صراع العروش (Game of Thrones)", en: "Game of Thrones" },
          { ar: "بريكينج باد (Breaking Bad)", en: "Breaking Bad" },
          { ar: "بيكي بلايندرز (Peaky Blinders)", en: "Peaky Blinders" },
          { ar: "أشياء غريبة (Stranger Things)", en: "Stranger Things" },
          { ar: "لعبة الحبار (Squid Game)", en: "Squid Game" },
          { ar: "هجوم العمالقة (Attack on Titan)", en: "Attack on Titan" },
          { ar: "ون بيس (One Piece)", en: "One Piece" },
          { ar: "ديث نوت (Death Note)", en: "Death Note" },
        ],
      },
      {
        name: "Famous Movie Franchises",
        items: [
          { ar: "أفنجرز (Avengers)", en: "Avengers" },
          { ar: "هاري بوتر (Harry Potter)", en: "Harry Potter" },
          { ar: "سيد الخواتم (Lord of the Rings)", en: "Lord of the Rings" },
          { ar: "جوكر (Joker)", en: "Joker" },
          { ar: "إنسبشن (Inception)", en: "Inception" },
          { ar: "إنترستيلار (Interstellar)", en: "Interstellar" },
          { ar: "أوبنهايمر (Oppenheimer)", en: "Oppenheimer" },
          { ar: "تايتانيك (Titanic)", en: "Titanic" },
        ],
      },
    ],
  },
  {
    id: "cars",
    nameAr: "سيارات وماركات",
    nameEn: "Cars & Brands",
    icon: "🚗",
    clusters: [
      {
        name: "Luxury & German Cars",
        items: [
          { ar: "مرسيدس جي كلاس (Mercedes G-Class)", en: "Mercedes G-Class" },
          { ar: "بي إم دبليو إم 5 (BMW M5)", en: "BMW M5" },
          { ar: "بورشه 911 (Porsche 911)", en: "Porsche 911" },
          { ar: "أودي آر 8 (Audi R8)", en: "Audi R8" },
          { ar: "رنج روفر فيلار (Range Rover)", en: "Range Rover" },
          { ar: "فيراري إف 8 (Ferrari F8)", en: "Ferrari F8" },
          { ar: "لامبورغيني أوروس (Lamborghini Urus)", en: "Lamborghini Urus" },
          { ar: "بنتلي كونتيننتال (Bentley)", en: "Bentley Continental" },
        ],
      },
    ],
  },
  {
    id: "apps",
    nameAr: "تطبيقات وتكنولوجيا",
    nameEn: "Apps & Tech",
    icon: "📱",
    clusters: [
      {
        name: "Social & Daily Apps",
        items: [
          { ar: "إنستغرام (Instagram)", en: "Instagram" },
          { ar: "تيك توك (TikTok)", en: "TikTok" },
          { ar: "سناب شات (Snapchat)", en: "Snapchat" },
          { ar: "واتساب (WhatsApp)", en: "WhatsApp" },
          { ar: "إكس / تويتر (X / Twitter)", en: "Twitter / X" },
          { ar: "يوتيوب (YouTube)", en: "YouTube" },
          { ar: "سبوتيفاي (Spotify)", en: "Spotify" },
          { ar: "نتفلكس (Netflix)", en: "Netflix" },
          { ar: "شات جي بي تي (ChatGPT)", en: "ChatGPT" },
        ],
      },
    ],
  },
  {
    id: "animals",
    nameAr: "حيوانات",
    nameEn: "Animals",
    icon: "🦁",
    clusters: [
      {
        name: "Wild & Exotic Animals",
        items: [
          { ar: "أسد أفريقي", en: "African Lion" },
          { ar: "نمر بنغالي", en: "Bengal Tiger" },
          { ar: "فهد صياد (شيتة)", en: "Cheetah" },
          { ar: "دب قطبي أبيض", en: "Polar Bear" },
          { ar: "ذئب رمادي", en: "Gray Wolf" },
          { ar: "فيل آسيوي", en: "Asian Elephant" },
          { ar: "زرافة طويلة", en: "Giraffe" },
          { ar: "باندا عملاقة", en: "Giant Panda" },
          { ar: "غوريلا جبلية", en: "Mountain Gorilla" },
        ],
      },
    ],
  },
];

export interface SecretWordPayload {
  category: CategoryDefinition;
  secretWord: { ar: string; en: string };
  candidateWords: Array<{ ar: string; en: string }>;
}

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function pickSecretWordAndCandidates(categoryId?: string): SecretWordPayload {
  let category = BEKASA_CATEGORIES.find((c) => c.id === categoryId);
  if (!category) {
    // Pick random category
    category = BEKASA_CATEGORIES[Math.floor(Math.random() * BEKASA_CATEGORIES.length)];
  }

  // Pick random cluster in category
  const cluster = category.clusters[Math.floor(Math.random() * category.clusters.length)];
  const items = cluster.items;

  // Pick random secret word
  const secretWord = items[Math.floor(Math.random() * items.length)];

  // Get other items in cluster as candidate distractors
  const otherInCluster = items.filter((it) => it.ar !== secretWord.ar);
  const shuffledOthers = shuffleArray(otherInCluster);

  // Take 6-7 distractors so total candidate list is around 7-8 options
  const selectedDistractors = shuffledOthers.slice(0, 7);
  const allCandidates = shuffleArray([secretWord, ...selectedDistractors]);

  return {
    category,
    secretWord,
    candidateWords: allCandidates,
  };
}
