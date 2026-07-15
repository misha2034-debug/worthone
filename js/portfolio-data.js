/* =========================================================
   portfolio-data.js — מסד הנתונים של מחשבון החפיפה

   ⚠️ הערה חשובה על דיוק הנתונים:
   ההרכבים כאן הם *הערכה מקורבת* של הרכב המדדים, נכון לתאריך שלהלן.
   הם אינם רשימת ההחזקות בפועל של הקרן, והם משתנים עם הזמן.
   הכלי נועד לתת תובנה על סדרי גודל — לא דיוק לאחוז.

   מספר נייר ערך (secNo) מופיע רק כאשר אומת מול מקור.
   קרן ללא secNo ניתנת לחיפוש לפי שם בלבד.
   ========================================================= */

const DATA_AS_OF = { he: "יולי 2026", en: "July 2026" };

/* ---------- אזורים גאוגרפיים ---------- */
const REGIONS = {
  us:        { he: 'ארה"ב',            en: "United States" },
  europe:    { he: "אירופה",            en: "Europe" },
  uk:        { he: "בריטניה",           en: "United Kingdom" },
  japan:     { he: "יפן",               en: "Japan" },
  canada:    { he: "קנדה",              en: "Canada" },
  apac_dev:  { he: "אסיה-פסיפיק מפותחת", en: "Developed Asia-Pacific" },
  israel:    { he: "ישראל",             en: "Israel" },
  em:        { he: "שווקים מתעוררים",    en: "Emerging Markets" },
};

/* ---------- סקטורים ---------- */
const SECTORS = {
  tech:           { he: "טכנולוגיה",      en: "Technology" },
  financials:     { he: "פיננסים",         en: "Financials" },
  healthcare:     { he: "בריאות",          en: "Healthcare" },
  consumer_disc:  { he: "צריכה מחזורית",   en: "Consumer Discretionary" },
  consumer_stap:  { he: "צריכה בסיסית",    en: "Consumer Staples" },
  industrials:    { he: "תעשייה",          en: "Industrials" },
  communication:  { he: "תקשורת ומדיה",    en: "Communication" },
  energy:         { he: "אנרגיה",          en: "Energy" },
  materials:      { he: "חומרי גלם",       en: "Materials" },
  utilities:      { he: "תשתיות",          en: "Utilities" },
  real_estate:    { he: 'נדל"ן',           en: "Real Estate" },
};

/* ---------- פרופילי מדדים: חשיפה גאוגרפית + סקטוריאלית (כל וקטור מסתכם ל-100) ---------- */
const INDEX_PROFILES = {
  sp500: {
    label: { he: "S&P 500", en: "S&P 500" },
    regions: { us: 100 },
    sectors: { tech: 33, financials: 14, consumer_disc: 10, healthcare: 10, communication: 10,
               industrials: 8, consumer_stap: 5, energy: 3, utilities: 2.5, materials: 2.5, real_estate: 2 },
  },
  acwi: {
    label: { he: "MSCI ACWI (מדד עולמי כולל מתעוררים)", en: "MSCI ACWI (All Country World)" },
    regions: { us: 63, europe: 12, em: 10, japan: 5, uk: 3, canada: 3, apac_dev: 3, israel: 1 },
    sectors: { tech: 26, financials: 17, industrials: 11, consumer_disc: 10, healthcare: 9,
               communication: 8, consumer_stap: 6, energy: 4, materials: 4, utilities: 2.5, real_estate: 2.5 },
  },
  msci_world: {
    label: { he: "MSCI World (שווקים מפותחים)", en: "MSCI World (Developed Markets)" },
    regions: { us: 71, europe: 12, japan: 6, uk: 4, apac_dev: 4, canada: 3 },
    sectors: { tech: 27, financials: 16, industrials: 11, consumer_disc: 10, healthcare: 10,
               communication: 8, consumer_stap: 6, energy: 4, materials: 3, utilities: 2.5, real_estate: 2.5 },
  },
  nasdaq100: {
    label: { he: 'נאסד"ק 100', en: "Nasdaq 100" },
    regions: { us: 96, europe: 2, apac_dev: 2 },
    sectors: { tech: 50, communication: 15, consumer_disc: 13, healthcare: 6, consumer_stap: 6,
               industrials: 6, financials: 1, utilities: 1, materials: 1, energy: 0.5, real_estate: 0.5 },
  },
  ta35: {
    label: { he: 'ת"א 35', en: "TA-35" },
    regions: { israel: 100 },
    sectors: { financials: 35, tech: 20, real_estate: 12, industrials: 10, healthcare: 8,
               energy: 5, communication: 4, consumer_stap: 3, materials: 3 },
  },
  ta125: {
    label: { he: 'ת"א 125', en: "TA-125" },
    regions: { israel: 100 },
    sectors: { financials: 30, tech: 18, real_estate: 16, industrials: 10, healthcare: 8,
               energy: 5, materials: 5, communication: 4, consumer_stap: 4 },
  },
  // ת"א 90 = ת"א 125 בניכוי ת"א 35, כלומר המניות הבינוניות בישראל.
  // בלי הבנקים הגדולים, ולכן משקל נדל"ן גבוה בהרבה ומשקל פיננסים נמוך יותר.
  ta90: {
    label: { he: 'ת"א 90', en: "TA-90" },
    regions: { israel: 100 },
    sectors: { real_estate: 30, financials: 15, industrials: 13, tech: 12, healthcare: 8,
               energy: 7, consumer_stap: 5, materials: 5, communication: 3, utilities: 2 },
  },
  europe_dev: {
    label: { he: "מדד אירופה (STOXX 600)", en: "Europe (STOXX 600)" },
    regions: { europe: 72, uk: 28 },
    sectors: { financials: 22, industrials: 18, healthcare: 14, consumer_stap: 10, consumer_disc: 10,
               tech: 8, materials: 6, energy: 5, utilities: 4, communication: 2, real_estate: 1 },
  },
  emerging: {
    label: { he: "שווקים מתעוררים (MSCI EM)", en: "Emerging Markets (MSCI EM)" },
    regions: { em: 100 },
    sectors: { tech: 25, financials: 22, consumer_disc: 13, communication: 10, materials: 7,
               industrials: 7, consumer_stap: 5, energy: 5, utilities: 3, healthcare: 2, real_estate: 1 },
  },
  japan_idx: {
    label: { he: "מדד יפן (MSCI Japan)", en: "Japan (MSCI Japan)" },
    regions: { japan: 100 },
    sectors: { industrials: 23, consumer_disc: 18, tech: 15, financials: 13, healthcare: 8,
               communication: 8, consumer_stap: 6, materials: 5, real_estate: 2, utilities: 1, energy: 1 },
  },
  // מדד נושאי — לא מדד שוק רחב. ריכוזיות סקטוריאלית קיצונית במכוון.
  // הסקטורים כאן מדויקים לפי נתוני הקרן; הפילוח הגאוגרפי הוא הערכה
  // (כ-83% ארה"ב, והשאר יפן, טאיוואן, צרפת, קנדה וישראל).
  ai_tech: {
    label: { he: "AI וטכנולוגיה גלובלית", en: "Global AI & Tech" },
    regions: { us: 83, em: 6, japan: 4, europe: 3, canada: 2, israel: 2 },
    sectors: { tech: 87.84, industrials: 5.29, communication: 2.99, utilities: 1.61,
               real_estate: 1.38, healthcare: 0.89 },
  },
  // תמטי — ביטחון. סקטורים מדויקים בקירוב; גאוגרפיה לפי נתוני הקרן:
  // ~55% ארה"ב, ~45% מחוץ לה (בריטניה, גרמניה, צרפת, איטליה, קוריאה, ישראל).
  defense: {
    label: { he: "טכנולוגיית ביטחון", en: "Defense Tech" },
    regions: { us: 55, europe: 24, uk: 11, em: 7, israel: 3 },
    sectors: { industrials: 74, tech: 20, communication: 3, materials: 2, consumer_disc: 1 },
  },
  // תמטי — אנרגיה גרעינית. סקטורים מדויקים לפי הקרן; גאוגרפיה הערכה.
  nuclear: {
    label: { he: "אורניום ואנרגיה גרעינית", en: "Uranium & Nuclear" },
    regions: { us: 30, europe: 20, em: 16, japan: 12, canada: 12, apac_dev: 10 },
    sectors: { energy: 50, utilities: 30, industrials: 18, tech: 2 },
  },
  // תמטי — כריית אורניום. גאוגרפיה לפי הקרן: כ-50% קנדה, ולא אמריקאי בעיקרו.
  uranium: {
    label: { he: "כריית אורניום", en: "Uranium Miners" },
    regions: { canada: 50, em: 20, apac_dev: 12, us: 6, uk: 6, japan: 6 },
    sectors: { materials: 68, energy: 20, utilities: 8, industrials: 4 },
  },
  // שוק אמריקאי כולל (Total US Market) — כל השוק, לא רק 500 הגדולות.
  us_total: {
    label: { he: "שוק אמריקאי כולל (Total US)", en: "Total US Market" },
    regions: { us: 100 },
    sectors: { tech: 30, financials: 13, healthcare: 12, consumer_disc: 10, industrials: 9,
               communication: 8, consumer_stap: 5, energy: 4, real_estate: 3, utilities: 3, materials: 3 },
  },
  // שוק בינלאומי כולל, מחוץ לארה"ב (Total International ex-US).
  intl_total: {
    label: { he: "בינלאומי כולל (ללא ארה\"ב)", en: "Total International (ex-US)" },
    regions: { europe: 33, em: 27, japan: 14, apac_dev: 10, uk: 9, canada: 7 },
    sectors: { financials: 24, industrials: 14, tech: 13, consumer_disc: 11, healthcare: 9,
               consumer_stap: 8, materials: 7, communication: 5, energy: 5, utilities: 3, real_estate: 1 },
  },
};

/* ---------- הסבר קצר לכל מדד: מה בפועל אתם מחזיקים כשמשקיעים בו ----------
   מספרי החברות/המדינות הם הערכה מקורבת (כמו כל הנתונים כאן), ומנוסחים ב"כ-". */
const INDEX_BLURBS = {
  sp500:      { he: '500 החברות הגדולות בבורסה האמריקאית — חשיפה מרוכזת לכלכלת ארה"ב.',
                en: "The 500 largest US companies — concentrated exposure to the US economy." },
  acwi:       { he: 'מדד עולמי רחב: כ-3,000 חברות מ-48 מדינות, מפותחות ומתעוררות (כ-63% מהמשקל בארה"ב).',
                en: "A broad global index: ~3,000 companies from 48 developed and emerging countries (~63% weighted to the US)." },
  msci_world: { he: 'מדד עולמי של שווקים מפותחים בלבד: כ-1,400 חברות מ-23 מדינות, בלי שווקים מתעוררים.',
                en: "A developed-markets global index: ~1,400 companies from 23 countries, without emerging markets." },
  nasdaq100:  { he: '100 החברות הגדולות בנאסד"ק — הטיה חזקה מאוד לטכנולוגיה אמריקאית.',
                en: "The 100 largest Nasdaq companies — a very strong tilt to US technology." },
  ta35:       { he: '35 החברות הגדולות בבורסת תל אביב — הליבה של השוק הישראלי.',
                en: "The 35 largest companies on the Tel Aviv exchange — the core of the Israeli market." },
  ta125:      { he: '125 החברות הגדולות בבורסת תל אביב — תמונה רחבה של השוק הישראלי.',
                en: "The 125 largest Tel Aviv companies — a broad view of the Israeli market." },
  ta90:       { he: '90 החברות הבינוניות בתל אביב (ת"א 125 פחות ת"א 35) — השוק הישראלי בלי החברות הגדולות ביותר.',
                en: "The 90 mid-cap Tel Aviv companies (TA-125 minus TA-35) — the Israeli market without its largest companies." },
  europe_dev: { he: 'כ-600 חברות גדולות ובינוניות מ-17 מדינות באירופה.',
                en: "~600 large and mid-cap companies from 17 European countries." },
  emerging:   { he: 'אלפי חברות משווקים מתעוררים (סין, הודו, טאיוואן, ברזיל ועוד) — ללא מדינות מפותחות.',
                en: "Thousands of companies from emerging markets (China, India, Taiwan, Brazil and more) — no developed markets." },
  japan_idx:  { he: 'מאות חברות יפניות גדולות ובינוניות — חשיפה ממוקדת לכלכלת יפן בלבד.',
                en: "Hundreds of large and mid-cap Japanese companies — exposure focused on Japan alone." },
  us_total:   { he: 'כמעט כל השוק האמריקאי הנסחר — אלפי חברות, מהגדולות ועד הקטנות.',
                en: "Almost the entire investable US market — thousands of companies, from the largest to the smallest." },
  intl_total: { he: 'כל העולם מלבד ארה"ב — אלפי חברות ממדינות מפותחות ומתעוררות כאחד.',
                en: "The whole world except the US — thousands of companies from both developed and emerging markets." },
  ai_tech:    { he: 'קרן ממוקדת בבינה מלאכותית וטכנולוגיה — כ-66 חברות בלבד, מרוכזת כמעט כולה בסקטור אחד. לא פיזור רחב.',
                en: "A fund focused on AI and technology — only ~66 companies, almost entirely in one sector. Not broad diversification." },
  defense:    { he: 'קרן ממוקדת בחברות ביטחון וטכנולוגיה צבאית — מרוכזת בסקטור התעשייה, עם חשיפה גם לאירופה.',
                en: "A fund focused on defense and military-tech companies — concentrated in industrials, with European exposure too." },
  nuclear:    { he: 'קרן ממוקדת באנרגיה גרעינית ואורניום — סקטור צר של חברות אנרגיה, תשתיות וכרייה.',
                en: "A fund focused on nuclear energy and uranium — a narrow slice of energy, utility and mining companies." },
  uranium:    { he: 'קרן ממוקדת בחברות כריית אורניום — סקטור צר מאוד, ומוטה מאוד לקנדה.',
                en: "A fund focused on uranium-mining companies — a very narrow sector, heavily tilted to Canada." },
};

/* ---------- יחסים ידועים בין מדדים ----------
   מודל ה"אזור × סקטור" לא יודע אילו *חברות* מרכיבות כל מדד. לכן שני מדדים
   ישראליים בעלי תמהיל סקטוריאלי דומה נראים לו חופפים — גם כשאין ביניהם ולו
   מניה אחת משותפת. כאן נרשמים יחסים שידועים במפורש, והם גוברים על החישוב.
   הערך הוא אחוז החפיפה (0–100).

   ta35|ta90   = 0  — יחס הגדרתי: ת"א 90 הוא ת"א 125 בניכוי ת"א 35,
                      ולכן אין ביניהם אף מניה משותפת.
   ta125|ta35  = 80 — יחס הכלה: ת"א 35 מהווה כ-80% משווי השוק של ת"א 125.
   ta125|ta90  = 20 — יחס הכלה: היתרה.
                      שני האחרונים הם הערכות משקל, לא ערכים הגדרתיים.

   המפתח: צמד מזהי המדדים, ממוינים אלפביתית ומופרדים ב-"|".              */
const INDEX_RELATIONS = {
  "ta35|ta90": 0,
  "ta125|ta35": 80,
  "ta125|ta90": 20,
  // הכלה: מדד S&P 500 מהווה כ-80% משווי השוק האמריקאי הכולל, וכולו מוכל בו.
  "sp500|us_total": 80,
};

/* ---------- מטבעות ----------
   currency הוא *מטבע המסחר* בלבד — המטבע שבו קונים את הנייר.
   הוא אינו מעיד על חשיפת המטבע של הנכסים הבסיסיים: גם קרן שקלית על
   מדד S&P 500 מחזיקה מניות אמריקאיות ולכן נותנת חשיפה לדולר.
   הוא משמש כאן אך ורק כדי להמיר סכומים למטבע אחיד לפני חישוב המשקלים. */
const CURRENCIES = {
  ILS: { symbol: "₪", he: "שקל",  en: "Shekel" },
  USD: { symbol: "$", he: "דולר", en: "Dollar" },
};
const BASE_CURRENCY = "ILS";        // המטבע שאליו מומר הכל
const DEFAULT_FX = { USD: 3.70 };   // ברירת מחדל בלבד; המשתמש עורך ונשמר מקומית

/* ---------- קרנות ----------
   secNo:    מספר נייר ערך בבורסת תל אביב. null = אין, או טרם אומת מול מקור.
   ticker:   סימול לקרנות שאינן נסחרות בת"א (למשל קרנות אמריקאיות).
   currency: מטבע המסחר. בהיעדרו — ILS.
   fee:      דמי ניהול שנתיים באחוזים (הערכה). null = לא ידוע.         */
const FUNDS = [
  { secNo: "1159250", verified: true,  index: "sp500",      fee: 0.07,
    name: { he: "iShares Core S&P 500 UCITS ETF", en: "iShares Core S&P 500 UCITS ETF" } },
  { secNo: "1159235", verified: true,  index: "acwi",       fee: 0.20,
    name: { he: "iShares MSCI ACWI UCITS ETF", en: "iShares MSCI ACWI UCITS ETF" } },
  { secNo: "5130620", verified: true,  index: "ta90",       fee: null,
    name: { he: 'MTF מחקה (4A) ת"א 90', en: "MTF Index Tracking (4A) TA-90" } },

  // קרן אמריקאית (NYSE Arca) — נסחרת בדולרים, אין לה מספר נייר בת"א.
  { secNo: null, ticker: "ARTY", verified: false, index: "ai_tech", fee: null, currency: "USD",
    name: { he: "iShares Future AI & Tech ETF", en: "iShares Future AI & Tech ETF" } },

  // קרנות אמריקאיות נוספות הנסחרות בדולרים.
  { secNo: null, ticker: "VTI",  verified: false, index: "us_total",   fee: 0.03, currency: "USD",
    name: { he: "Vanguard Total Stock Market ETF", en: "Vanguard Total Stock Market ETF" } },
  { secNo: null, ticker: "VXUS", verified: false, index: "intl_total", fee: 0.05, currency: "USD",
    name: { he: "Vanguard Total International Stock ETF", en: "Vanguard Total International Stock ETF" } },
  { secNo: null, ticker: "SHLD", verified: false, index: "defense",    fee: null, currency: "USD",
    name: { he: "Global X Defense Tech ETF", en: "Global X Defense Tech ETF" } },
  { secNo: null, ticker: "NLR",  verified: false, index: "nuclear",    fee: null, currency: "USD",
    name: { he: "VanEck Uranium and Nuclear ETF", en: "VanEck Uranium and Nuclear ETF" } },
  { secNo: null, ticker: "URA",  verified: false, index: "uranium",    fee: null, currency: "USD",
    name: { he: "Global X Uranium ETF", en: "Global X Uranium ETF" } },

  { secNo: null, verified: false, index: "msci_world", fee: null,
    name: { he: "iShares Core MSCI World UCITS ETF", en: "iShares Core MSCI World UCITS ETF" } },
  { secNo: null, verified: false, index: "msci_world", fee: null,
    name: { he: "Invesco MSCI World UCITS ETF", en: "Invesco MSCI World UCITS ETF" } },
  { secNo: null, verified: false, index: "sp500", fee: null,
    name: { he: "Invesco S&P 500 UCITS ETF", en: "Invesco S&P 500 UCITS ETF" } },
  { secNo: null, verified: false, index: "sp500", fee: null,
    name: { he: "קסם S&P 500", en: "Kesem S&P 500" } },
  { secNo: null, verified: false, index: "sp500", fee: null,
    name: { he: "הראל S&P 500", en: "Harel S&P 500" } },
  { secNo: null, verified: false, index: "sp500", fee: null,
    name: { he: "תכלית S&P 500", en: "Tachlit S&P 500" } },
  { secNo: null, verified: false, index: "nasdaq100", fee: null,
    name: { he: 'iShares Nasdaq 100 UCITS ETF', en: "iShares Nasdaq 100 UCITS ETF" } },
  { secNo: null, verified: false, index: "nasdaq100", fee: null,
    name: { he: 'קסם נאסד"ק 100', en: "Kesem Nasdaq 100" } },
  { secNo: null, verified: false, index: "ta35", fee: null,
    name: { he: 'תכלית ת"א 35', en: "Tachlit TA-35" } },
  { secNo: null, verified: false, index: "ta125", fee: null,
    name: { he: 'קסם ת"א 125', en: "Kesem TA-125" } },
  { secNo: null, verified: false, index: "emerging", fee: null,
    name: { he: "iShares Core MSCI EM IMI UCITS ETF", en: "iShares Core MSCI EM IMI UCITS ETF" } },
  { secNo: null, verified: false, index: "europe_dev", fee: null,
    name: { he: "iShares STOXX Europe 600 UCITS ETF", en: "iShares STOXX Europe 600 UCITS ETF" } },
  { secNo: null, verified: false, index: "japan_idx", fee: null,
    name: { he: "iShares MSCI Japan UCITS ETF", en: "iShares MSCI Japan UCITS ETF" } },
];

/* ---------- מניות בודדות מוכרות ----------
   מניה בודדת = 100% אזור אחד, 100% סקטור אחד.
   מטבע המסחר נגזר מהאזור: הישראליות נסחרות בת"א בשקלים, והשאר —
   כולל האירופיות והאסייתיות שברשימה — נסחרות בארה"ב כ-ADR בדולרים.
   בכל מקרה המשתמש יכול לשנות את המטבע בשורה עצמה.                    */
const stockCurrency = (stock) => (stock.region === "israel" ? "ILS" : "USD");
const STOCKS = [
  { ticker: "AAPL",  region: "us",     sector: "tech",          name: { he: "Apple", en: "Apple" } },
  { ticker: "MSFT",  region: "us",     sector: "tech",          name: { he: "Microsoft", en: "Microsoft" } },
  { ticker: "NVDA",  region: "us",     sector: "tech",          name: { he: "Nvidia", en: "Nvidia" } },
  { ticker: "AVGO",  region: "us",     sector: "tech",          name: { he: "Broadcom", en: "Broadcom" } },
  { ticker: "GOOGL", region: "us",     sector: "communication", name: { he: "Alphabet (Google)", en: "Alphabet (Google)" } },
  { ticker: "META",  region: "us",     sector: "communication", name: { he: "Meta", en: "Meta" } },
  { ticker: "AMZN",  region: "us",     sector: "consumer_disc", name: { he: "Amazon", en: "Amazon" } },
  { ticker: "TSLA",  region: "us",     sector: "consumer_disc", name: { he: "Tesla", en: "Tesla" } },
  { ticker: "JPM",   region: "us",     sector: "financials",    name: { he: "JPMorgan Chase", en: "JPMorgan Chase" } },
  { ticker: "BRK.B", region: "us",     sector: "financials",    name: { he: "Berkshire Hathaway", en: "Berkshire Hathaway" } },
  { ticker: "V",     region: "us",     sector: "financials",    name: { he: "Visa", en: "Visa" } },
  { ticker: "LLY",   region: "us",     sector: "healthcare",    name: { he: "Eli Lilly", en: "Eli Lilly" } },
  { ticker: "UNH",   region: "us",     sector: "healthcare",    name: { he: "UnitedHealth", en: "UnitedHealth" } },
  { ticker: "JNJ",   region: "us",     sector: "healthcare",    name: { he: "Johnson & Johnson", en: "Johnson & Johnson" } },
  { ticker: "XOM",   region: "us",     sector: "energy",        name: { he: "ExxonMobil", en: "ExxonMobil" } },
  { ticker: "WMT",   region: "us",     sector: "consumer_stap", name: { he: "Walmart", en: "Walmart" } },
  { ticker: "TEVA",  region: "israel", sector: "healthcare",    name: { he: "טבע", en: "Teva" } },
  { ticker: "LUMI",  region: "israel", sector: "financials",    name: { he: "בנק לאומי", en: "Bank Leumi" } },
  { ticker: "POLI",  region: "israel", sector: "financials",    name: { he: "בנק הפועלים", en: "Bank Hapoalim" } },
  { ticker: "NICE",  region: "israel", sector: "tech",          name: { he: "נייס", en: "NICE" } },
  { ticker: "ESLT",  region: "israel", sector: "industrials",   name: { he: 'אלביט מערכות', en: "Elbit Systems" } },
  { ticker: "ASML",  region: "europe", sector: "tech",          name: { he: "ASML", en: "ASML" } },
  { ticker: "NOVO",  region: "europe", sector: "healthcare",    name: { he: "Novo Nordisk", en: "Novo Nordisk" } },
  { ticker: "NESN",  region: "europe", sector: "consumer_stap", name: { he: "Nestlé", en: "Nestlé" } },
  { ticker: "TM",    region: "japan",  sector: "consumer_disc", name: { he: "Toyota", en: "Toyota" } },
  { ticker: "TSM",   region: "em",     sector: "tech",          name: { he: "TSMC", en: "TSMC" } },
  { ticker: "SSNLF", region: "em",     sector: "tech",          name: { he: "Samsung", en: "Samsung" } },
];
