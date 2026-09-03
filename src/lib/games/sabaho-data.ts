export type AuctionItem = {
  id: string;
  topicAr: string;
  topicEn: string;
  suggestedAnswers: string[];
};

export type CareerClub = {
  clubName: string;
  year: string;
  countryFlag: string;
};

export type CareerPathItem = {
  id: string;
  playerNameAr: string;
  playerNameEn: string;
  nationality: string;
  nationalityFlag: string;
  position: string;
  clubs: CareerClub[];
};

export type SpeedPromptItem = {
  id: string;
  promptAr: string;
  promptEn: string;
  seconds: number;
};

export const AUCTION_TOPICS: AuctionItem[] = [
  {
    id: "auc-1",
    topicAr: "أندية تُوِّجت بلقب دوري أبطال أوروبا (النسخة القديمة أو الحديثة)",
    topicEn: "Clubs that won the UEFA Champions League / European Cup",
    suggestedAnswers: [
      "ريال مدريد", "ميلان", "ليفربول", "بايرن ميونخ", "برشلونة", "أياكس", "إنتر ميلان",
      "مانشستر يونايتد", "يوفنتوس", "بنفيكا", "تشيلسي", "بورتو", "نوتنغهام فورست",
      "مانشستر سيتي", "سلتيك", "هامبورغ", "ستيوا بوخارست", "أولمبيك مارسيليا",
      "فاينورد", "أستون فيلا", "ريد ستار بلغراد", "بوروسيا دورتموند", "آيندهوفن"
    ],
  },
  {
    id: "auc-2",
    topicAr: "لاعبين ارتدوا قميصي ريال مدريد وبرشلونة عبر التاريخ",
    topicEn: "Players who played for both Real Madrid and Barcelona",
    suggestedAnswers: [
      "رونالدو الظاهرة (Ronaldo Nazario)", "لويس فيغو (Luis Figo)", "لويس إنريكي (Luis Enrique)",
      "صامويل إيتو (Samuel Eto'o)", "مايكل لاودروب (Michael Laudrup)", "خافيير سافيولا (Javier Saviola)",
      "ألبرت سيلاديس (Albert Celades)", "بريند شوستر (Bernd Schuster)", "جورجي هاجي (Gheorghe Hagi)",
      "روبرت بروسينتشكي (Robert Prosinecki)", "ريكاردو زامورا (Ricardo Zamora)", "ألفونسو بيريز (Alfonso Perez)"
    ],
  },
  {
    id: "auc-3",
    topicAr: "لاعبين لعبوا لقطبي ميلانو (إنتر ميلان وإيه سي ميلان)",
    topicEn: "Players who played for both Inter Milan and AC Milan",
    suggestedAnswers: [
      "زلاتان إبراهيموفيتش", "أندريا بيرلو", "كلارنس سيدورف", "رونالدو الظاهرة",
      "ماريو بالوتيلي", "هرنان كريسبو", "كريستيان فييري", "إدغار ديفيدز",
      "ليوناردو بونوتشي", "هاكان تشالهان أوغلو", "روبيرتو باجيو", "أنطونيو كاسانو",
      "فرانشيسكو كوكو", "جوزيبي مياتزا", "سولي مونتاري", "ماتيو دارميان"
    ],
  },
  {
    id: "auc-4",
    topicAr: "لاعبين فازوا بجائزة الكرة الذهبية (Ballon d'Or)",
    topicEn: "Winners of the Ballon d'Or",
    suggestedAnswers: [
      "ليونيل ميسي", "كريستيانو رونالدو", "ميشيل بلاتيني", "يوهان كرويف", "ماركو فان باستن",
      "زين الدين زيدان", "رونالدو الظاهرة", "رونالدينيو", "كاكا", "لوكا مودريتش",
      "كريم بنزيما", "رودري", "ريفالدو", "لويس فيغو", "مايكل أوين", "بافل نيدفيد",
      "أندري شيفتشينكو", "فابيو كانافارو", "جورج وياه", "روبرتو باجيو", "لوتار ماتيوس", "خريستو ستويتشكوف"
    ],
  },
  {
    id: "auc-5",
    topicAr: "لاعبين مصريين خاضوا تجربة الاحتراف في الملاعب الأوروبية",
    topicEn: "Egyptian players who played professionally in Europe",
    suggestedAnswers: [
      "محمد صلاح", "أحمد حسام ميدو", "محمود حسن تريزيجيه", "محمد النني", "أحمد حجازي",
      "هاني رمزي", "عمرو زكي", "حازم إمام", "محمد زيدان", "عمر مرموش", "مصطفى محمد",
      "حسام حسن", "إبراهيم حسن", "أحمد حسن (الصقر)", "عبد الستار صبري", "حسام غالي",
      "محمود عبد المنعم كهربا", "أحمد المحمدي", "رمضان صبحي", "عمرو وردة", "محمد عبد المنعم"
    ],
  },
  {
    id: "auc-6",
    topicAr: "منتخبات فازت بلقب كأس العالم للكبار (FIFA World Cup)",
    topicEn: "National teams that won the FIFA World Cup",
    suggestedAnswers: [
      "البرازيل (5)", "ألمانيا (4)", "إيطاليا (4)", "الأرجنتين (3)",
      "فرنسا (2)", "أوروغواي (2)", "إنجلترا (1)", "إسبانيا (1)"
    ],
  },
  {
    id: "auc-7",
    topicAr: "لاعبين ارتدوا قميصي الأهلي والزمالك",
    topicEn: "Players who played for both Al Ahly and Zamalek",
    suggestedAnswers: [
      "حسام حسن", "إبراهيم حسن", "إمام عاشور", "محمود كهربا", "مؤمن زكريا",
      "طارق السعيد", "محمد صديق", "أحمد حسن (الصقر)", "عصام الحضري", "إبراهيم سعيد",
      "جمال حمزة", "أحمد كشري", "أحمد بلال", "حسين ياسر المحمدي", "شريف أشرف",
      "دومينيك دا سيلفا", "أحمد الشيخ", "رضا عبد العال", "صبري رحيل", "ناصر ماهر"
    ],
  },
  {
    id: "auc-8",
    topicAr: "أندية لعبت في الدوري الإنجليزي الممتاز (Premier League)",
    topicEn: "Clubs that have played in the Premier League",
    suggestedAnswers: [
      "مانشستر يونايتد", "أرسنال", "تشيلسي", "ليفربول", "مانشستر سيتي", "توتنهام هوتسبير",
      "إيفرتون", "أستون فيلا", "نيوكاسل يونايتد", "وست هام يونايتد", "ليستر سيتي",
      "ليدز يونايتد", "ساوثهامبتون", "فولهام", "كريستال بالاس", "ولفرهامبتون", "برايتون",
      "برينتفورد", "بورنموث", "نوتنغهام فورست", "بلاكبيرن روفرز", "ميدلزبره", "سندرلاند", "ستوك سيتي"
    ],
  },
  {
    id: "auc-9",
    topicAr: "مدربين فازوا بلقب دوري أبطال أوروبا",
    topicEn: "Managers who won the UEFA Champions League",
    suggestedAnswers: [
      "كارلو أنشيلوتي", "بيب غوارديولا", "زين الدين زيدان", "بوب بيزلي", "سير أليكس فيرغسون",
      "جوزيه مورينيو", "يورغن كلوب", "توماس توخيل", "هانز فليك", "لويس إنريكي",
      "يوپ هاينكس", "فيسنتي ديل بوسكي", "أوتمار هيتسفيلد", "مارتشيلو ليبي", "فابيو كابيلو", "يوهان كرويف"
    ],
  },
  {
    id: "auc-10",
    topicAr: "لاعبين سجلوا في نهائيات كأس العالم عبر التاريخ",
    topicEn: "Players who scored in a FIFA World Cup Final",
    suggestedAnswers: [
      "بيليه", "كيليان مبابي", "ليونيل ميسي", "زين الدين زيدان", "رونالدو الظاهرة",
      "ماريو غوتزه", "أندريس إنييستا", "أنخيل دي ماريا", "ماريو ماندجوكيتش",
      "أنطوان غريزمان", "بول بوغبا", "ماركو ماتيراتزي", "غيرد مولر", "باولو روسي", "جيوف هورست"
    ],
  },
];

export const CAREER_PATHS: CareerPathItem[] = [
  {
    id: "car-1",
    playerNameAr: "محمد صلاح",
    playerNameEn: "Mohamed Salah",
    nationality: "مصر",
    nationalityFlag: "🇪🇬",
    position: "جناح أيمن",
    clubs: [
      { clubName: "المقاولون العرب", year: "2010 - 2012", countryFlag: "🇪🇬" },
      { clubName: "بازل", year: "2012 - 2014", countryFlag: "🇨🇭" },
      { clubName: "تشيلسي", year: "2014 - 2015", countryFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      { clubName: "فيورنتينا (إعارة)", year: "2015", countryFlag: "🇮🇹" },
      { clubName: "روما", year: "2015 - 2017", countryFlag: "🇮🇹" },
      { clubName: "ليفربول", year: "2017 - الآن", countryFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
    ],
  },
  {
    id: "car-2",
    playerNameAr: "كريستيانو رونالدو",
    playerNameEn: "Cristiano Ronaldo",
    nationality: "البرتغال",
    nationalityFlag: "🇵🇹",
    position: "مهاجم / جناح",
    clubs: [
      { clubName: "سبورتينغ لشبونة", year: "2002 - 2003", countryFlag: "🇵🇹" },
      { clubName: "مانشستر يونايتد", year: "2003 - 2009", countryFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      { clubName: "ريال مدريد", year: "2009 - 2018", countryFlag: "🇪🇸" },
      { clubName: "يوفنتوس", year: "2018 - 2021", countryFlag: "🇮🇹" },
      { clubName: "مانشستر يونايتد", year: "2021 - 2022", countryFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      { clubName: "النصر السعودي", year: "2023 - الآن", countryFlag: "🇸🇦" },
    ],
  },
  {
    id: "car-3",
    playerNameAr: "زلاتان إبراهيموفيتش",
    playerNameEn: "Zlatan Ibrahimovic",
    nationality: "السويد",
    nationalityFlag: "🇸🇪",
    position: "رأس حربة",
    clubs: [
      { clubName: "مالمو", year: "1999 - 2001", countryFlag: "🇸🇪" },
      { clubName: "أياكس أمستردام", year: "2001 - 2004", countryFlag: "🇳🇱" },
      { clubName: "يوفنتوس", year: "2004 - 2006", countryFlag: "🇮🇹" },
      { clubName: "إنتر ميلان", year: "2006 - 2009", countryFlag: "🇮🇹" },
      { clubName: "برشلونة", year: "2009 - 2010", countryFlag: "🇪🇸" },
      { clubName: "إيه سي ميلان", year: "2010 - 2012", countryFlag: "🇮🇹" },
      { clubName: "باريس سان جيرمان", year: "2012 - 2016", countryFlag: "🇫🇷" },
      { clubName: "مانشستر يونايتد", year: "2016 - 2018", countryFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      { clubName: "لوس أنجلوس غالاكسي", year: "2018 - 2019", countryFlag: "🇺🇸" },
      { clubName: "إيه سي ميلان", year: "2020 - 2023", countryFlag: "🇮🇹" },
    ],
  },
  {
    id: "car-4",
    playerNameAr: "إيرلينغ هالاند",
    playerNameEn: "Erling Haaland",
    nationality: "النرويج",
    nationalityFlag: "🇳🇴",
    position: "مهاجم",
    clubs: [
      { clubName: "برينه", year: "2015 - 2017", countryFlag: "🇳🇴" },
      { clubName: "مولده", year: "2017 - 2019", countryFlag: "🇳🇴" },
      { clubName: "ريد بول سالزبورغ", year: "2019 - 2020", countryFlag: "🇦🇹" },
      { clubName: "بوروسيا دورتموند", year: "2020 - 2022", countryFlag: "🇩🇪" },
      { clubName: "مانشستر سيتي", year: "2022 - الآن", countryFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
    ],
  },
  {
    id: "car-5",
    playerNameAr: "محمود حسن تريزيجيه",
    playerNameEn: "Mahmoud Trezeguet",
    nationality: "مصر",
    nationalityFlag: "🇪🇬",
    position: "جناح أيسر",
    clubs: [
      { clubName: "الأهلي المصري", year: "2012 - 2015", countryFlag: "🇪🇬" },
      { clubName: "أندرلخت", year: "2015 - 2016", countryFlag: "🇧🇪" },
      { clubName: "موسكرون (إعارة)", year: "2016 - 2017", countryFlag: "🇧🇪" },
      { clubName: "قاسم باشا", year: "2017 - 2019", countryFlag: "🇹🇷" },
      { clubName: "أستون فيلا", year: "2019 - 2022", countryFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      { clubName: "إسطنبول باشاك شهير", year: "2022", countryFlag: "🇹🇷" },
      { clubName: "طرابزون سبور", year: "2022 - 2024", countryFlag: "🇹🇷" },
      { clubName: "الريان القطري", year: "2024 - الآن", countryFlag: "🇶🇦" },
    ],
  },
  {
    id: "car-6",
    playerNameAr: "لوكا مودريتش",
    playerNameEn: "Luka Modric",
    nationality: "كرواتيا",
    nationalityFlag: "🇭🇷",
    position: "خط وسط",
    clubs: [
      { clubName: "دينامو زغرب", year: "2003 - 2008", countryFlag: "🇭🇷" },
      { clubName: "زرينسكي موستار (إعارة)", year: "2003 - 2004", countryFlag: "🇧🇦" },
      { clubName: "إنتر زابريسيتش (إعارة)", year: "2004 - 2005", countryFlag: "🇭🇷" },
      { clubName: "توتنهام هوتسبير", year: "2008 - 2012", countryFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      { clubName: "ريال مدريد", year: "2012 - الآن", countryFlag: "🇪🇸" },
    ],
  },
  {
    id: "car-7",
    playerNameAr: "كريم بنزيما",
    playerNameEn: "Karim Benzema",
    nationality: "فرنسا",
    nationalityFlag: "🇫🇷",
    position: "مهاجم",
    clubs: [
      { clubName: "أولمبيك ليون", year: "2004 - 2009", countryFlag: "🇫🇷" },
      { clubName: "ريال مدريد", year: "2009 - 2023", countryFlag: "🇪🇸" },
      { clubName: "الاتحاد السعودي", year: "2023 - الآن", countryFlag: "🇸🇦" },
    ],
  },
  {
    id: "car-8",
    playerNameAr: "كيفين دي بروين",
    playerNameEn: "Kevin De Bruyne",
    nationality: "بلجيكا",
    nationalityFlag: "🇧🇪",
    position: "صانع ألعاب",
    clubs: [
      { clubName: "جينك", year: "2008 - 2012", countryFlag: "🇧🇪" },
      { clubName: "تشيلسي", year: "2012 - 2014", countryFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      { clubName: "فيردر بريمن (إعارة)", year: "2012 - 2013", countryFlag: "🇩🇪" },
      { clubName: "فولفسبورغ", year: "2014 - 2015", countryFlag: "🇩🇪" },
      { clubName: "مانشستر سيتي", year: "2015 - الآن", countryFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
    ],
  },
  {
    id: "car-9",
    playerNameAr: "أحمد حسام ميدو",
    playerNameEn: "Ahmed Hossam Mido",
    nationality: "مصر",
    nationalityFlag: "🇪🇬",
    position: "مهاجم",
    clubs: [
      { clubName: "الزمالك", year: "1999 - 2000", countryFlag: "🇪🇬" },
      { clubName: "جينت", year: "2000 - 2001", countryFlag: "🇧🇪" },
      { clubName: "أياكس أمستردام", year: "2001 - 2003", countryFlag: "🇳🇱" },
      { clubName: "سيلتا فيغو (إعارة)", year: "2003", countryFlag: "🇪🇸" },
      { clubName: "أولمبيك مارسيليا", year: "2003 - 2004", countryFlag: "🇫🇷" },
      { clubName: "روما", year: "2004 - 2006", countryFlag: "🇮🇹" },
      { clubName: "توتنهام هوتسبير", year: "2005 - 2007", countryFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      { clubName: "ميدلزبره", year: "2007 - 2010", countryFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      { clubName: "ويغان أتلتيك (إعارة)", year: "2009", countryFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      { clubName: "وست هام يونايتد (إعارة)", year: "2010", countryFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      { clubName: "بارنسلي", year: "2012", countryFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
    ],
  },
  {
    id: "car-10",
    playerNameAr: "لويس سواريز",
    playerNameEn: "Luis Suarez",
    nationality: "أوروغواي",
    nationalityFlag: "🇺🇾",
    position: "مهاجم",
    clubs: [
      { clubName: "ناسيونال", year: "2005 - 2006", countryFlag: "🇺🇾" },
      { clubName: "غرونينغن", year: "2006 - 2007", countryFlag: "🇳🇱" },
      { clubName: "أياكس أمستردام", year: "2007 - 2011", countryFlag: "🇳🇱" },
      { clubName: "ليفربول", year: "2011 - 2014", countryFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      { clubName: "برشلونة", year: "2014 - 2020", countryFlag: "🇪🇸" },
      { clubName: "أتلتيكو مدريد", year: "2020 - 2022", countryFlag: "🇪🇸" },
      { clubName: "غريميو", year: "2023", countryFlag: "🇧🇷" },
      { clubName: "إنتر ميامي", year: "2024 - الآن", countryFlag: "🇺🇸" },
    ],
  },
  {
    id: "car-11",
    playerNameAr: "رياض محرز",
    playerNameEn: "Riyad Mahrez",
    nationality: "الجزائر",
    nationalityFlag: "🇩🇿",
    position: "جناح أيمن",
    clubs: [
      { clubName: "كيمبير", year: "2009 - 2010", countryFlag: "🇫🇷" },
      { clubName: "لوهافر", year: "2010 - 2014", countryFlag: "🇫🇷" },
      { clubName: "ليستر سيتي", year: "2014 - 2018", countryFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      { clubName: "مانشستر سيتي", year: "2018 - 2023", countryFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      { clubName: "الأهلي السعودي", year: "2023 - الآن", countryFlag: "🇸🇦" },
    ],
  },
  {
    id: "car-12",
    playerNameAr: "أشرف حكيمي",
    playerNameEn: "Achraf Hakimi",
    nationality: "المغرب",
    nationalityFlag: "🇲🇦",
    position: "ظهير أيمن",
    clubs: [
      { clubName: "ريال مدريد كاستيا", year: "2016 - 2017", countryFlag: "🇪🇸" },
      { clubName: "ريال مدريد", year: "2017 - 2020", countryFlag: "🇪🇸" },
      { clubName: "بوروسيا دورتموند (إعارة)", year: "2018 - 2020", countryFlag: "🇩🇪" },
      { clubName: "إنتر ميلان", year: "2020 - 2021", countryFlag: "🇮🇹" },
      { clubName: "باريس سان جيرمان", year: "2021 - الآن", countryFlag: "🇫🇷" },
    ],
  },
];

export const SPEED_PROMPTS: SpeedPromptItem[] = [
  {
    id: "spd-1",
    promptAr: "اذكر ٣ لاعبين أرجنتينيين فازوا بكأس العالم في قطر 2022",
    promptEn: "Name 3 Argentine players who won the 2022 World Cup",
    seconds: 5,
  },
  {
    id: "spd-2",
    promptAr: "اذكر ٣ أندية إيطالية غير اليوفي والإنتر والميلان",
    promptEn: "Name 3 Italian clubs other than Juve, Inter, and Milan",
    seconds: 5,
  },
  {
    id: "spd-3",
    promptAr: "اذكر ٣ حراس مرمى ألمان لعبوا للمنتخب",
    promptEn: "Name 3 German goalkeepers who played for the national team",
    seconds: 5,
  },
  {
    id: "spd-4",
    promptAr: "اذكر ٣ لاعبين ارتدوا الرقم 10 في تاريخ نادي برشلونة",
    promptEn: "Name 3 players who wore the #10 jersey for FC Barcelona",
    seconds: 5,
  },
  {
    id: "spd-5",
    promptAr: "اذكر ٣ مدربين قادوا منتخب مصر في بطولات أمم أفريقيا",
    promptEn: "Name 3 managers who coached Egypt in AFCON tournaments",
    seconds: 5,
  },
  {
    id: "spd-6",
    promptAr: "اذكر ٣ أندية إنجليزية فازت بلقب الدوري الإنجليزي الممتاز (بريميرليج)",
    promptEn: "Name 3 English clubs that won the Premier League title",
    seconds: 5,
  },
];

export type PasswordItem = {
  id: string;
  wordAr: string;
  wordEn: string;
  category: "لاعب" | "مدرب" | "نادي" | "مصطلح" | "بطولة";
};

export const PASSWORD_WORDS: PasswordItem[] = [
  { id: "pwd-1", wordAr: "محمد صلاح", wordEn: "Mohamed Salah", category: "لاعب" },
  { id: "pwd-2", wordAr: "كريستيانو رونالدو", wordEn: "Cristiano Ronaldo", category: "لاعب" },
  { id: "pwd-3", wordAr: "ليونيل ميسي", wordEn: "Lionel Messi", category: "لاعب" },
  { id: "pwd-4", wordAr: "محمد الشناوي", wordEn: "Mohamed El-Shenawy", category: "لاعب" },
  { id: "pwd-5", wordAr: "أحمد سيد زيزو", wordEn: "Ahmed Zizo", category: "لاعب" },
  { id: "pwd-6", wordAr: "إمام عاشور", wordEn: "Emam Ashour", category: "لاعب" },
  { id: "pwd-7", wordAr: "محمد مجدي قفشة", wordEn: "Afsha", category: "لاعب" },
  { id: "pwd-8", wordAr: "محمود شيكابالا", wordEn: "Shikabala", category: "لاعب" },
  { id: "pwd-9", wordAr: "بيب غوارديولا", wordEn: "Pep Guardiola", category: "مدرب" },
  { id: "pwd-10", wordAr: "كارلو أنشيلوتي", wordEn: "Carlo Ancelotti", category: "مدرب" },
  { id: "pwd-11", wordAr: "يورغن كلوب", wordEn: "Jurgen Klopp", category: "مدرب" },
  { id: "pwd-12", wordAr: "جوزيه مورينيو", wordEn: "Jose Mourinho", category: "مدرب" },
  { id: "pwd-13", wordAr: "مارسيل كولر", wordEn: "Marcel Koller", category: "مدرب" },
  { id: "pwd-14", wordAr: "حسام حسن", wordEn: "Hossam Hassan", category: "مدرب" },
  { id: "pwd-15", wordAr: "عصام الحضري", wordEn: "Essam El-Hadary", category: "لاعب" },
  { id: "pwd-16", wordAr: "محمد أبو تريكة", wordEn: "Mohamed Aboutrika", category: "لاعب" },
  { id: "pwd-17", wordAr: "كريم بنزيما", wordEn: "Karim Benzema", category: "لاعب" },
  { id: "pwd-18", wordAr: "كيليان مبابي", wordEn: "Kylian Mbappe", category: "لاعب" },
  { id: "pwd-19", wordAr: "إيرلينغ هالاند", wordEn: "Erling Haaland", category: "لاعب" },
  { id: "pwd-20", wordAr: "فينيسيوس جونيور", wordEn: "Vinicius Jr", category: "لاعب" },
  { id: "pwd-21", wordAr: "لوكا مودريتش", wordEn: "Luka Modric", category: "لاعب" },
  { id: "pwd-22", wordAr: "توني كروس", wordEn: "Toni Kroos", category: "لاعب" },
  { id: "pwd-23", wordAr: "سيرجيو راموس", wordEn: "Sergio Ramos", category: "لاعب" },
  { id: "pwd-24", wordAr: "نيمار دا سيلفا", wordEn: "Neymar Jr", category: "لاعب" },
  { id: "pwd-25", wordAr: "رونالدينيو", wordEn: "Ronaldinho", category: "لاعب" },
  { id: "pwd-26", wordAr: "زين الدين زيدان", wordEn: "Zinedine Zidane", category: "لاعب" },
  { id: "pwd-27", wordAr: "دييغو مارادونا", wordEn: "Diego Maradona", category: "لاعب" },
  { id: "pwd-28", wordAr: "دوري أبطال أوروبا", wordEn: "Champions League", category: "بطولة" },
  { id: "pwd-29", wordAr: "كأس العالم", wordEn: "World Cup", category: "بطولة" },
  { id: "pwd-30", wordAr: "كأس أمم أفريقيا", wordEn: "AFCON", category: "بطولة" },
  { id: "pwd-31", wordAr: "الكلاسيكو", wordEn: "El Clasico", category: "مصطلح" },
  { id: "pwd-32", wordAr: "ديربي القاهرة", wordEn: "Cairo Derby", category: "مصطلح" },
  { id: "pwd-33", wordAr: "ضربة جزاء", wordEn: "Penalty", category: "مصطلح" },
  { id: "pwd-34", wordAr: "ضربة ركنية", wordEn: "Corner Kick", category: "مصطلح" },
  { id: "pwd-35", wordAr: "تسلل", wordEn: "Offside", category: "مصطلح" },
  { id: "pwd-36", wordAr: "الفار (VAR)", wordEn: "VAR", category: "مصطلح" },
  { id: "pwd-37", wordAr: "كارت أحمر", wordEn: "Red Card", category: "مصطلح" },
  { id: "pwd-38", wordAr: "ريال مدريد", wordEn: "Real Madrid", category: "نادي" },
  { id: "pwd-39", wordAr: "برشلونة", wordEn: "Barcelona", category: "نادي" },
  { id: "pwd-40", wordAr: "ليفربول", wordEn: "Liverpool", category: "نادي" },
  { id: "pwd-41", wordAr: "مانشستر سيتي", wordEn: "Manchester City", category: "نادي" },
  { id: "pwd-42", wordAr: "مانشستر يونايتد", wordEn: "Manchester United", category: "نادي" },
  { id: "pwd-43", wordAr: "أرسنال", wordEn: "Arsenal", category: "نادي" },
  { id: "pwd-44", wordAr: "بايرن ميونخ", wordEn: "Bayern Munich", category: "نادي" },
  { id: "pwd-45", wordAr: "باريس سان جيرمان", wordEn: "PSG", category: "نادي" },
  { id: "pwd-46", wordAr: "إنتر ميلان", wordEn: "Inter Milan", category: "نادي" },
  { id: "pwd-47", wordAr: "إيه سي ميلان", wordEn: "AC Milan", category: "نادي" },
  { id: "pwd-48", wordAr: "يوفنتوس", wordEn: "Juventus", category: "نادي" },
  { id: "pwd-49", wordAr: "الأهلي المصري", wordEn: "Al Ahly", category: "نادي" },
  { id: "pwd-50", wordAr: "الزمالك", wordEn: "Zamalek", category: "نادي" },
  { id: "pwd-51", wordAr: "الهلال السعودي", wordEn: "Al Hilal", category: "نادي" },
  { id: "pwd-52", wordAr: "الاتحاد السعودي", wordEn: "Al Ittihad", category: "نادي" },
  { id: "pwd-53", wordAr: "النصر السعودي", wordEn: "Al Nassr", category: "نادي" },
  { id: "pwd-54", wordAr: "عمر مرموش", wordEn: "Omar Marmoush", category: "لاعب" },
  { id: "pwd-55", wordAr: "مصطفى محمد", wordEn: "Mostafa Mohamed", category: "لاعب" },
];
