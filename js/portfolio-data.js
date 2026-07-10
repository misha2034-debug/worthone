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
};

/* ---------- קרנות סל הנסחרות בתל אביב ----------
   secNo: מספר נייר ערך. null = טרם אומת מול מקור רשמי (חיפוש לפי שם בלבד).
   fee:   דמי ניהול שנתיים באחוזים (הערכה). null = לא ידוע.            */
const FUNDS = [
  { secNo: "1159250", verified: true,  index: "sp500",      fee: 0.07,
    name: { he: "iShares Core S&P 500 UCITS ETF", en: "iShares Core S&P 500 UCITS ETF" } },
  { secNo: "1159235", verified: true,  index: "acwi",       fee: 0.20,
    name: { he: "iShares MSCI ACWI UCITS ETF", en: "iShares MSCI ACWI UCITS ETF" } },

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
   מניה בודדת = 100% אזור אחד, 100% סקטור אחד.                        */
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
