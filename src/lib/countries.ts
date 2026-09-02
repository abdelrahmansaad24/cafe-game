// Comprehensive list of countries with Arabic and English names, ISO codes, and aliases.

export interface CountryEntry {
  en: string;
  ar: string;
  aliases?: string[];
}

export const COUNTRIES: CountryEntry[] = [
  { en: "Afghanistan", ar: "أفغانستان", aliases: ["افغانستان"] },
  { en: "Albania", ar: "ألبانيا", aliases: ["البانيا"] },
  { en: "Algeria", ar: "الجزائر", aliases: ["جزائر", "دزاير"] },
  { en: "Andorra", ar: "أندورا", aliases: ["اندورا"] },
  { en: "Angola", ar: "أنغولا", aliases: ["انغولا", "انجولا"] },
  { en: "Antigua and Barbuda", ar: "أنتيغوا وباربودا", aliases: ["انتيغوا وباربودا", "انتيجوا وبربودا"] },
  { en: "Argentina", ar: "الأرجنتين", aliases: ["الارجنتين", "ارجنتين"] },
  { en: "Armenia", ar: "أرمينيا", aliases: ["ارمينيا"] },
  { en: "Australia", ar: "أستراليا", aliases: ["استراليا"] },
  { en: "Austria", ar: "النمسا", aliases: ["نمسا"] },
  { en: "Azerbaijan", ar: "أذربيجان", aliases: ["اذربيجان"] },
  { en: "Bahamas", ar: "الباهاما", aliases: ["باهاماس", "جزر البهاما", "الباهاماس"] },
  { en: "Bahrain", ar: "البحرين", aliases: ["بحرين"] },
  { en: "Bangladesh", ar: "بنغلاديش", aliases: ["بنجلاديش", "بنغلادش"] },
  { en: "Barbados", ar: "باربادوس", aliases: ["بربادوس"] },
  { en: "Belarus", ar: "بيلاروسيا", aliases: ["بيلاروس", "روسيا البيضاء"] },
  { en: "Belgium", ar: "بلجيكا", aliases: [] },
  { en: "Belize", ar: "بليز", aliases: [] },
  { en: "Benin", ar: "بنين", aliases: [] },
  { en: "Bhutan", ar: "بوتان", aliases: [] },
  { en: "Bolivia", ar: "بوليفيا", aliases: [] },
  { en: "Bosnia and Herzegovina", ar: "البوسنة والهرسك", aliases: ["البوسنة", "بوسنة والهرسك", "بوسنة"] },
  { en: "Botswana", ar: "بوتسوانا", aliases: [] },
  { en: "Brazil", ar: "البرازيل", aliases: ["برازيل"] },
  { en: "Brunei", ar: "بروناي", aliases: [] },
  { en: "Bulgaria", ar: "بلغاريا", aliases: [] },
  { en: "Burkina Faso", ar: "بوركينا فاسو", aliases: ["بوركينافاسو"] },
  { en: "Burundi", ar: "بوروندي", aliases: [] },
  { en: "Cabo Verde", ar: "الرأس الأخضر", aliases: ["الراس الاخضر", "كاب فيردي", "Cape Verde"] },
  { en: "Cambodia", ar: "كمبوديا", aliases: [] },
  { en: "Cameroon", ar: "الكاميرون", aliases: ["كاميرون"] },
  { en: "Canada", ar: "كندا", aliases: [] },
  { en: "Central African Republic", ar: "جمهورية أفريقيا الوسطى", aliases: ["افريقيا الوسطى", "أفريقيا الوسطى"] },
  { en: "Chad", ar: "تشاد", aliases: [] },
  { en: "Chile", ar: "تشيلي", aliases: [] },
  { en: "China", ar: "الصين", aliases: ["صين"] },
  { en: "Colombia", ar: "كولومبيا", aliases: [] },
  { en: "Comoros", ar: "جزر القمر", aliases: ["قمر"] },
  { en: "Congo", ar: "الكونغو", aliases: ["جمهورية الكونغو", "كونغو", "Congo Republic", "Republic of the Congo"] },
  { en: "Democratic Republic of the Congo", ar: "جمهورية الكونغو الديمقراطية", aliases: ["الكونغو الديمقراطية", "DR Congo", "DRC"] },
  { en: "Costa Rica", ar: "كوستاريكا", aliases: ["كوستا ريكا"] },
  { en: "Croatia", ar: "كرواتيا", aliases: [] },
  { en: "Cuba", ar: "كوبا", aliases: [] },
  { en: "Cyprus", ar: "قبرص", aliases: [] },
  { en: "Czech Republic", ar: "التشيك", aliases: ["تشيك", "تشيكيا", "Czechia"] },
  { en: "Denmark", ar: "الدنمارك", aliases: ["دنمارك"] },
  { en: "Djibouti", ar: "جيبوتي", aliases: [] },
  { en: "Dominica", ar: "دومينيكا", aliases: [] },
  { en: "Dominican Republic", ar: "جمهورية الدومينيكان", aliases: ["الدومينيكان", "دومينيكان"] },
  { en: "Ecuador", ar: "الإكوادور", aliases: ["الاكوادور", "اكوادور"] },
  { en: "Egypt", ar: "مصر", aliases: ["جمهورية مصر العربية"] },
  { en: "El Salvador", ar: "السلفادور", aliases: ["سلفادور"] },
  { en: "Equatorial Guinea", ar: "غينيا الاستوائية", aliases: ["غينيا الإستوائية"] },
  { en: "Eritrea", ar: "إريتريا", aliases: ["اريتريا"] },
  { en: "Estonia", ar: "إستونيا", aliases: ["استونيا"] },
  { en: "Eswatini", ar: "إسواتيني", aliases: ["اسواتيني", "سوازيلاند", "Swaziland"] },
  { en: "Ethiopia", ar: "إثيوبيا", aliases: ["اثيوبيا"] },
  { en: "Fiji", ar: "فيجي", aliases: [] },
  { en: "Finland", ar: "فنلندا", aliases: [] },
  { en: "France", ar: "فرنسا", aliases: [] },
  { en: "Gabon", ar: "الغابون", aliases: ["غابون", "الجابون", "جابون"] },
  { en: "Gambia", ar: "غامبيا", aliases: ["جامبيا"] },
  { en: "Georgia", ar: "جورجيا", aliases: [] },
  { en: "Germany", ar: "ألمانيا", aliases: ["المانيا"] },
  { en: "Ghana", ar: "غانا", aliases: [] },
  { en: "Greece", ar: "اليونان", aliases: ["يونان"] },
  { en: "Grenada", ar: "غرينادا", aliases: ["جرينادا"] },
  { en: "Guatemala", ar: "غواتيمالا", aliases: ["جواتيمالا"] },
  { en: "Guinea", ar: "غينيا", aliases: [] },
  { en: "Guinea-Bissau", ar: "غينيا بيساو", aliases: ["غينيا-بيساو"] },
  { en: "Guyana", ar: "غيانا", aliases: ["جيانا"] },
  { en: "Haiti", ar: "هايتي", aliases: [] },
  { en: "Honduras", ar: "هندوراس", aliases: [] },
  { en: "Hungary", ar: "المجر", aliases: ["مجر", "هنغاريا"] },
  { en: "Iceland", ar: "آيسلندا", aliases: ["ايسلندا"] },
  { en: "India", ar: "الهند", aliases: ["هند"] },
  { en: "Indonesia", ar: "إندونيسيا", aliases: ["اندونيسيا"] },
  { en: "Iran", ar: "إيران", aliases: ["ايران"] },
  { en: "Iraq", ar: "العراق", aliases: ["عراق"] },
  { en: "Ireland", ar: "أيرلندا", aliases: ["ايرلندا", "جمهورية أيرلندا"] },
  { en: "Italy", ar: "إيطاليا", aliases: ["ايطاليا"] },
  { en: "Ivory Coast", ar: "ساحل العاج", aliases: ["كوت ديفوار", "Cote d'Ivoire", "Côte d'Ivoire"] },
  { en: "Jamaica", ar: "جامايكا", aliases: [] },
  { en: "Japan", ar: "اليابان", aliases: ["يابان"] },
  { en: "Jordan", ar: "الأردن", aliases: ["الاردن", "اردن"] },
  { en: "Kazakhstan", ar: "كازاخستان", aliases: [] },
  { en: "Kenya", ar: "كينيا", aliases: [] },
  { en: "Kiribati", ar: "كيريباتي", aliases: [] },
  { en: "Kuwait", ar: "الكويت", aliases: ["كويت"] },
  { en: "Kyrgyzstan", ar: "قيرغيزستان", aliases: ["قرغيزستان"] },
  { en: "Laos", ar: "لاوس", aliases: [] },
  { en: "Latvia", ar: "لاتفيا", aliases: [] },
  { en: "Lebanon", ar: "لبنان", aliases: [] },
  { en: "Lesotho", ar: "ليسوتو", aliases: [] },
  { en: "Liberia", ar: "ليبيريا", aliases: [] },
  { en: "Libya", ar: "ليبيا", aliases: [] },
  { en: "Liechtenstein", ar: "ليختنشتاين", aliases: [] },
  { en: "Lithuania", ar: "ليتوانيا", aliases: [] },
  { en: "Luxembourg", ar: "لوكسمبورغ", aliases: ["لوكسمبورج"] },
  { en: "Madagascar", ar: "مدغشقر", aliases: [] },
  { en: "Malawi", ar: "مالاوي", aliases: [] },
  { en: "Malaysia", ar: "ماليزيا", aliases: [] },
  { en: "Maldives", ar: "المالديف", aliases: ["جزر المالديف", "مالديف"] },
  { en: "Mali", ar: "مالي", aliases: [] },
  { en: "Malta", ar: "مالطا", aliases: [] },
  { en: "Marshall Islands", ar: "جزر مارشال", aliases: [] },
  { en: "Mauritania", ar: "موريتانيا", aliases: [] },
  { en: "Mauritius", ar: "موريشيوس", aliases: [] },
  { en: "Mexico", ar: "المكسيك", aliases: ["مكسيك"] },
  { en: "Micronesia", ar: "ميكرونيزيا", aliases: [] },
  { en: "Moldova", ar: "مولدوفا", aliases: [] },
  { en: "Monaco", ar: "موناكو", aliases: [] },
  { en: "Mongolia", ar: "منغوليا", aliases: [] },
  { en: "Montenegro", ar: "الجبل الأسود", aliases: ["الجبل الاسود", "مونتينيغرو"] },
  { en: "Morocco", ar: "المغرب", aliases: ["مغرب"] },
  { en: "Mozambique", ar: "موزمبيق", aliases: [] },
  { en: "Myanmar", ar: "ميانمار", aliases: ["بورما", "Burma"] },
  { en: "Namibia", ar: "ناميبيا", aliases: [] },
  { en: "Nauru", ar: "ناورو", aliases: [] },
  { en: "Nepal", ar: "نيبال", aliases: [] },
  { en: "Netherlands", ar: "هولندا", aliases: ["هولاندا", "Holland"] },
  { en: "New Zealand", ar: "نيوزيلندا", aliases: ["نيوزيلاندا"] },
  { en: "Nicaragua", ar: "نيكاراغوا", aliases: ["نيكارجوا"] },
  { en: "Niger", ar: "النيجر", aliases: ["نيجر"] },
  { en: "Nigeria", ar: "نيجيريا", aliases: [] },
  { en: "North Korea", ar: "كوريا الشمالية", aliases: [] },
  { en: "North Macedonia", ar: "مقدونيا الشمالية", aliases: ["مقدونيا", "Macedonia"] },
  { en: "Norway", ar: "النرويج", aliases: ["نرويج"] },
  { en: "Oman", ar: "عمان", aliases: ["سلطنة عمان", "عُمان"] },
  { en: "Pakistan", ar: "باكستان", aliases: [] },
  { en: "Palau", ar: "بالاو", aliases: [] },
  { en: "Palestine", ar: "فلسطين", aliases: ["دولة فلسطين"] },
  { en: "Panama", ar: "بنما", aliases: [] },
  { en: "Papua New Guinea", ar: "بابوا غينيا الجديدة", aliases: [] },
  { en: "Paraguay", ar: "باراغواي", aliases: ["باراجواي"] },
  { en: "Peru", ar: "بيرو", aliases: [] },
  { en: "Philippines", ar: "الفلبين", aliases: ["فلبين"] },
  { en: "Poland", ar: "بولندا", aliases: ["بولاندا"] },
  { en: "Portugal", ar: "البرتغال", aliases: ["برتغال"] },
  { en: "Qatar", ar: "قطر", aliases: [] },
  { en: "Romania", ar: "رومانيا", aliases: [] },
  { en: "Russia", ar: "روسيا", aliases: ["الاتحاد الروسي"] },
  { en: "Rwanda", ar: "رواندا", aliases: [] },
  { en: "Saint Kitts and Nevis", ar: "سانت كيتس ونيفيس", aliases: [] },
  { en: "Saint Lucia", ar: "سانت لوسيا", aliases: [] },
  { en: "Saint Vincent and the Grenadines", ar: "سانت فينسنت والغرينادين", aliases: [] },
  { en: "Samoa", ar: "ساموا", aliases: [] },
  { en: "San Marino", ar: "سان مارينو", aliases: [] },
  { en: "Sao Tome and Principe", ar: "ساو تومي وبرينسيب", aliases: [] },
  { en: "Saudi Arabia", ar: "السعودية", aliases: ["المملكة العربية السعودية", "سعودية", "KSA"] },
  { en: "Senegal", ar: "السنغال", aliases: ["سنغال"] },
  { en: "Serbia", ar: "صربيا", aliases: [] },
  { en: "Seychelles", ar: "سيشل", aliases: ["جزر سيشل"] },
  { en: "Sierra Leone", ar: "سيراليون", aliases: [] },
  { en: "Singapore", ar: "سنغافورة", aliases: [] },
  { en: "Slovakia", ar: "سلوفاكيا", aliases: [] },
  { en: "Slovenia", ar: "سلوفينيا", aliases: [] },
  { en: "Solomon Islands", ar: "جزر سليمان", aliases: [] },
  { en: "Somalia", ar: "الصومال", aliases: ["صومال"] },
  { en: "South Africa", ar: "جنوب أفريقيا", aliases: ["جنوب افريقيا"] },
  { en: "South Korea", ar: "كوريا الجنوبية", aliases: ["كوريا", "Korea"] },
  { en: "South Sudan", ar: "جنوب السودان", aliases: [] },
  { en: "Spain", ar: "إسبانيا", aliases: ["اسبانيا"] },
  { en: "Sri Lanka", ar: "سريلانكا", aliases: ["سري لانكا"] },
  { en: "Sudan", ar: "السودان", aliases: ["سودان"] },
  { en: "Suriname", ar: "سورينام", aliases: [] },
  { en: "Sweden", ar: "السويد", aliases: ["سويد"] },
  { en: "Switzerland", ar: "سويسرا", aliases: [] },
  { en: "Syria", ar: "سوريا", aliases: ["سورية"] },
  { en: "Tajikistan", ar: "طاجيكستان", aliases: [] },
  { en: "Tanzania", ar: "تنزانيا", aliases: [] },
  { en: "Thailand", ar: "تايلاند", aliases: ["تايلند"] },
  { en: "Timor-Leste", ar: "تيمور الشرقية", aliases: ["East Timor"] },
  { en: "Togo", ar: "توغو", aliases: ["توجو"] },
  { en: "Tonga", ar: "تونغا", aliases: ["تونجا"] },
  { en: "Trinidad and Tobago", ar: "ترينيداد وتوباغو", aliases: ["ترينيداد وتوباجو"] },
  { en: "Tunisia", ar: "تونس", aliases: [] },
  { en: "Turkey", ar: "تركيا", aliases: ["Türkiye", "Turkiye"] },
  { en: "Turkmenistan", ar: "تركمانستان", aliases: [] },
  { en: "Tuvalu", ar: "توفالو", aliases: [] },
  { en: "Uganda", ar: "أوغندا", aliases: ["اوغندا"] },
  { en: "Ukraine", ar: "أوكرانيا", aliases: ["اوكرانيا"] },
  { en: "United Arab Emirates", ar: "الإمارات", aliases: ["الامارات", "الإمارات العربية المتحدة", "امارات", "UAE"] },
  { en: "United Kingdom", ar: "المملكة المتحدة", aliases: ["بريطانيا", "انجلترا", "UK", "Britain", "England"] },
  { en: "United States", ar: "الولايات المتحدة", aliases: ["أمريكا", "امريكا", "الولايات المتحدة الأمريكية", "USA", "US", "America"] },
  { en: "Uruguay", ar: "أوروغواي", aliases: ["اوروغواي", "اوروجواي"] },
  { en: "Uzbekistan", ar: "أوزبكستان", aliases: ["اوزبكستان"] },
  { en: "Vanuatu", ar: "فانواتو", aliases: [] },
  { en: "Vatican City", ar: "الفاتيكان", aliases: ["فاتيكان", "Holy See"] },
  { en: "Venezuela", ar: "فنزويلا", aliases: [] },
  { en: "Vietnam", ar: "فيتنام", aliases: [] },
  { en: "Yemen", ar: "اليمن", aliases: ["يمن"] },
  { en: "Zambia", ar: "زامبيا", aliases: [] },
  { en: "Zimbabwe", ar: "زيمبابوي", aliases: [] },
];

export function normalizeWord(text: string): string {
  return text
    .trim()
    .toLowerCase()
    // Remove Arabic diacritics / tashkeel
    .replace(/[\u064B-\u065F\u0670]/g, "")
    // Remove tatweel
    .replace(/\u0640/g, "")
    // Normalize alef variants
    .replace(/[إأآٱ]/g, "ا")
    // Normalize teh marbuta
    .replace(/ة/g, "ه")
    // Normalize alef maksura
    .replace(/ى/g, "ي")
    // Normalize spaces and hyphens
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ");
}

const lookupMap = new Map<string, CountryEntry>();

for (const country of COUNTRIES) {
  lookupMap.set(normalizeWord(country.en), country);
  lookupMap.set(normalizeWord(country.ar), country);

  // Also support without Arabic "ال" prefix if present
  const normAr = normalizeWord(country.ar);
  if (normAr.startsWith("ال") && normAr.length > 3) {
    lookupMap.set(normAr.slice(2), country);
  }

  if (country.aliases) {
    for (const alias of country.aliases) {
      const normAlias = normalizeWord(alias);
      lookupMap.set(normAlias, country);
      if (normAlias.startsWith("ال") && normAlias.length > 3) {
        lookupMap.set(normAlias.slice(2), country);
      }
    }
  }
}

export function validateCountryLocally(input: string): { valid: boolean; normalizedName?: string; explanation: string } {
  const normalized = normalizeWord(input);
  if (!normalized) {
    return { valid: false, explanation: "Input is empty." };
  }

  // Direct lookup
  let match = lookupMap.get(normalized);

  // If no direct match and starts with "ال", try without "ال"
  if (!match && normalized.startsWith("ال") && normalized.length > 3) {
    match = lookupMap.get(normalized.slice(2));
  }

  // If no direct match, try adding "ال"
  if (!match && !normalized.startsWith("ال")) {
    match = lookupMap.get(`ال${normalized}`);
  }

  if (match) {
    return {
      valid: true,
      normalizedName: match.en,
      explanation: `"${input}" matches country "${match.en}" / "${match.ar}".`,
    };
  }

  return {
    valid: false,
    explanation: `"${input}" is not recognized as an existing sovereign country.`,
  };
}
