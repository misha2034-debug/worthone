/* =========================================================
   portfolio.js — מנוע מחשבון החפיפה והפיזור של WorthOne
   כל החישוב מתבצע בדפדפן. שום נתון לא נשלח לשרת.

   מודל: כל החזקה מיוצגת כמטריצת חשיפה על פני (אזור × סקטור).
   החפיפה בין שתי החזקות = סכום המינימום בכל תא — מדד סטנדרטי
   לחשיפה משותפת, בטווח 0%–100%.
   ========================================================= */

const LANG = document.documentElement.lang === "en" ? "en" : "he";
const RTL = LANG === "he";

const PALETTE = ["#4f46e5", "#14b8a6", "#f59e0b", "#ec4899", "#22c55e", "#8b5cf6",
                 "#3b82f6", "#ef4444", "#06b6d4", "#a855f7"];

const STORAGE_KEY = "worthone_portfolio_" + LANG;
const FX_KEY = "worthone_fx_usd";   // משותף לשתי השפות — זה אותו שער

/* ---------- מחרוזות ממשק ---------- */
const T = {
  he: {
    unnamed: "ללא שם",
    searchPh: "מספר נייר, שם קרן או סימול מניה",
    amountPh: "0",
    currencyLabel: "מטבע",
    fxLabel: "שער דולר–שקל",
    totalLabel: "שווי התיק",
    unknownPrompt: "לא מזוהה — בחרו את המדד שהנייר עוקב אחריו:",
    chooseIndex: "בחרו מדד…",
    singleStock: "מניה בודדת",
    emptyChart: "הזינו את ההחזקות שלכם וכאן יופיע הפילוח",
    emptyAnalysis: "הוסיפו שתי החזקות לפחות כדי לקבל ניתוח חפיפה.",
    avgOverlap: "כמה ההחזקות דומות",
    effBets: "כמו כמה החזקות שונות",
    topRegion: "החשיפה הגדולה ביותר",
    avgFee: "דמי ניהול משוקללים",
    unknownFee: "לא ידוע",
    regionTitle: "חשיפה גאוגרפית",
    sectorTitle: "חשיפה סקטוריאלית",
    pairTitle: "חפיפה בין זוגות החזקות",
    analysisTitle: "ניתוח התיק",
    resetConfirm: "לאפס את כל ההחזקות?",
    of: "מתוך",
    verified: "מספר נייר מאומת",
  },
  en: {
    unnamed: "Unnamed",
    searchPh: "Security number, fund name or stock ticker",
    amountPh: "0",
    currencyLabel: "Currency",
    fxLabel: "USD–ILS rate",
    totalLabel: "Portfolio value",
    unknownPrompt: "Not recognised — choose the index this security tracks:",
    chooseIndex: "Choose an index…",
    singleStock: "Single stock",
    emptyChart: "Enter your holdings and the breakdown will appear here",
    emptyAnalysis: "Add at least two holdings to get an overlap analysis.",
    avgOverlap: "How similar the holdings are",
    effBets: "Like how many different holdings",
    topRegion: "Largest exposure",
    avgFee: "Weighted management fee",
    unknownFee: "Unknown",
    regionTitle: "Geographic exposure",
    sectorTitle: "Sector exposure",
    pairTitle: "Overlap between pairs of holdings",
    analysisTitle: "Portfolio analysis",
    resetConfirm: "Reset all holdings?",
    of: "of",
    verified: "Verified security number",
  },
}[LANG];

const $ = (s) => document.querySelector(s);
const num = (n, d = 2) => Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: d });
// סכום במטבע נתון. ברירת המחדל היא מטבע הבסיס (שקל).
const fmt = (n, cur = BASE_CURRENCY) => CURRENCIES[cur].symbol + num(n);
const pct = (n) => n.toFixed(1) + "%";

/* =========================================================
   שכבת נתונים: פתרון קלט → החזקה מזוהה
   ========================================================= */

// מנרמל וקטור כך שיסתכם ל-100
function normalise(vec) {
  const sum = Object.values(vec).reduce((a, b) => a + b, 0);
  if (sum <= 0) return {};
  const out = {};
  for (const k in vec) out[k] = (vec[k] / sum) * 100;
  return out;
}

// מטריצת חשיפה: תא (אזור|סקטור) = משקל_אזור × משקל_סקטור / 100. הסכום = 100.
function buildMatrix(regions, sectors) {
  const r = normalise(regions), s = normalise(sectors);
  const m = {};
  for (const rk in r) for (const sk in s) m[rk + "|" + sk] = (r[rk] * s[sk]) / 100;
  return m;
}

function matrixForIndex(indexId) {
  const p = INDEX_PROFILES[indexId];
  return buildMatrix(p.regions, p.sectors);
}

function matrixForStock(stock) {
  return { [stock.region + "|" + stock.sector]: 100 };
}

// חיפוש: מספר נייר מדויק, סימול מדויק, או התאמת שם חלקית
function resolveQuery(q) {
  const s = q.trim().toLowerCase();
  if (!s) return null;

  const fund = FUNDS.find((f) => f.secNo === s) ||
               FUNDS.find((f) => f.ticker && f.ticker.toLowerCase() === s) ||
               FUNDS.find((f) => f.name[LANG].toLowerCase() === s) ||
               FUNDS.find((f) => f.name[LANG].toLowerCase().includes(s) && s.length >= 3);
  if (fund) {
    return {
      kind: "fund", label: fund.name[LANG], verified: fund.verified, fee: fund.fee,
      currency: fund.currency || BASE_CURRENCY,
      indexId: fund.index, sub: INDEX_PROFILES[fund.index].label[LANG],
      matrix: matrixForIndex(fund.index),
    };
  }

  const stock = STOCKS.find((x) => x.ticker.toLowerCase() === s) ||
                STOCKS.find((x) => x.name[LANG].toLowerCase() === s) ||
                STOCKS.find((x) => x.name[LANG].toLowerCase().includes(s) && s.length >= 3);
  if (stock) {
    return {
      kind: "stock", label: stock.name[LANG] + " (" + stock.ticker + ")", verified: false, fee: null,
      currency: stockCurrency(stock),
      indexId: null, sub: T.singleStock + " · " + REGIONS[stock.region][LANG] + " · " + SECTORS[stock.sector][LANG],
      matrix: matrixForStock(stock),
    };
  }
  return null;
}

/* =========================================================
   מתמטיקה: חפיפה, ריכוזיות, חשיפה מצרפית
   ========================================================= */

// חפיפה בין שתי מטריצות = Σ min(תא_א, תא_ב). תוצאה ב-0..100.
function matrixOverlap(a, b) {
  let sum = 0;
  for (const k in a) if (k in b) sum += Math.min(a[k], b[k]);
  return sum;
}

/* חפיפה בין שתי החזקות.
   אם ידוע לנו יחס מפורש בין שני המדדים (הכלה או זרות מוחלטת) — הוא גובר.
   אחרת נופלים לחישוב על מטריצת האזור×סקטור, שהוא קירוב בלבד: הוא לא יודע
   אילו חברות מרכיבות כל מדד, ולכן עלול לדווח חפיפה בין מדדים שאין להם אף
   מניה משותפת. ראו INDEX_RELATIONS ב-portfolio-data.js. */
function overlap(a, b) {
  const ia = a.indexId, ib = b.indexId;
  if (ia && ib && ia !== ib) {
    const key = [ia, ib].sort().join("|");
    if (key in INDEX_RELATIONS) return INDEX_RELATIONS[key];
  }
  return matrixOverlap(a.matrix, b.matrix);
}

// חשיפה מצרפית של התיק: ממוצע משוקלל של מטריצות ההחזקות
function portfolioMatrix(holdings) {
  const m = {};
  for (const h of holdings)
    for (const k in h.matrix) m[k] = (m[k] || 0) + (h.weight * h.matrix[k]) / 100;
  return m;
}

// קיפול מטריצה לווקטור אזורים או סקטורים
function collapse(matrix, axis) {
  const idx = axis === "region" ? 0 : 1;
  const out = {};
  for (const k in matrix) {
    const key = k.split("|")[idx];
    out[key] = (out[key] || 0) + matrix[k];
  }
  return out;
}

/* "מספר הימורים עצמאיים" = 1 / (wᵀ·S·w), כש-S היא מטריצת החפיפה בין ההחזקות.
   זו הכללה של מדד הרפינדל: כשאין חפיפה כלל (S = מטריצת היחידה) הנוסחה
   מתכנסת ל-1/Σw² הרגיל. אבל כששתי קרנות חופפות, הן נספרות כהימור אחד —
   וזה בדיוק מה שהכלי הזה אמור למדוד. האלכסון יוצא 1 אוטומטית, כי
   overlap(m,m) = Σ min(m,m) = Σ m = 100. */
function effectiveBets(holdings) {
  let q = 0;
  for (let i = 0; i < holdings.length; i++)
    for (let j = 0; j < holdings.length; j++)
      q += (holdings[i].weight / 100) * (holdings[j].weight / 100) *
           (overlap(holdings[i], holdings[j]) / 100);
  return q > 0 ? 1 / q : 0;
}

// חפיפה ממוצעת משוקללת על פני כל זוגות ההחזקות
function averageOverlap(holdings) {
  let num = 0, den = 0;
  for (let i = 0; i < holdings.length; i++)
    for (let j = i + 1; j < holdings.length; j++) {
      const w = (holdings[i].weight / 100) * (holdings[j].weight / 100);
      num += w * overlap(holdings[i], holdings[j]);
      den += w;
    }
  return den > 0 ? num / den : 0;
}

/* =========================================================
   ניתוח מילולי — נגזר מהמספרים, בלי המלצות השקעה
   ========================================================= */
function buildAnalysis(holdings, pMatrix, avgOv, effBets) {
  const out = [];
  const regions = collapse(pMatrix, "region");
  const sectors = collapse(pMatrix, "sector");
  const topR = Object.entries(regions).sort((a, b) => b[1] - a[1])[0];
  const topS = Object.entries(sectors).sort((a, b) => b[1] - a[1])[0];
  const nRegions = Object.values(regions).filter((v) => v >= 5).length;

  const say = (he, en, tone = "neutral") => out.push({ text: LANG === "he" ? he : en, tone });

  /* --- חפיפה כוללת --- */
  if (holdings.length >= 2) {
    if (avgOv >= 70) say(
      `ההחזקות שלכם דומות מאוד זו לזו (חפיפה ממוצעת ${pct(avgOv)}). בפועל אתם קונים שוב ושוב את אותן חברות ואותם שווקים, כך שלהחזיק את כולן יחד מוסיף הרבה פחות פיזור ממה שנראה.`,
      `Your holdings are very similar to one another (average overlap ${pct(avgOv)}). In practice you're buying the same companies and markets over and over, so holding them all together adds far less diversification than it appears.`,
      "warn");
    else if (avgOv >= 40) say(
      `יש דמיון בינוני בין ההחזקות (חפיפה ממוצעת ${pct(avgOv)}) — חלקן מחזיקות נכסים דומים, אבל יש גם כאלה שבאמת מוסיפות פיזור.`,
      `There's moderate similarity between your holdings (average overlap ${pct(avgOv)}) — some hold similar assets, but others genuinely add diversification.`,
      "neutral");
    else say(
      `ההחזקות שלכם שונות זו מזו (חפיפה ממוצעת נמוכה, ${pct(avgOv)}) — כל אחת מחזיקה נכסים אחרים. זהו סימן טוב, אבל הוא לבדו לא מספיק כדי לומר שהתיק מפוזר — צריך לבדוק גם איך הכסף מחולק (ראו בהמשך).`,
      `Your holdings differ from one another (low average overlap, ${pct(avgOv)}) — each holds different assets. That's a good sign, but on its own it isn't enough to call the portfolio diversified — how the money is split matters too (see below).`,
      "good");
  }

  /* --- ריכוזיות גאוגרפית ---
     שלוש מדרגות. בלי מדרגת הביניים, חשיפה של 64% לאזור בודד הייתה מוצגת
     בנימה חיובית רק משום שלא חצתה את סף האזהרה. */
  if (topR && topR[1] >= 75) say(
    `${pct(topR[1])} מהכסף שלכם חשוף לשוק אחד — ${REGIONS[topR[0]][LANG]}. כמעט כל התיק תלוי בשוק הזה, גם אם יש לכם קרן ש"נשמעת עולמית" (הרבה קרנות כאלה מחזיקות בעיקר ${REGIONS[topR[0]][LANG]}).`,
    `${pct(topR[1])} of your money is exposed to a single market — ${REGIONS[topR[0]].en}. Almost the whole portfolio depends on that market, even if you hold a fund that "sounds global" (many such funds hold mostly ${REGIONS[topR[0]].en}).`,
    "warn");
  else if (topR && topR[1] >= 55) say(
    `${pct(topR[1])} מהכסף שלכם חשוף ל${REGIONS[topR[0]][LANG]} — נתח גדול, גם אם לא קיצוני. שאר הכסף מגיע לאזורים נוספים בעולם, אבל אזור אחד עדיין קובע את הטון.`,
    `${pct(topR[1])} of your money is exposed to ${REGIONS[topR[0]].en} — a large share, though not extreme. The rest reaches other regions, but one region still sets the tone.`,
    "neutral");
  else if (topR) say(
    `החשיפה הגדולה ביותר שלכם היא ל${REGIONS[topR[0]][LANG]} (${pct(topR[1])} מהתיק), והשאר מחולק יפה בין אזורים נוספים בעולם.`,
    `Your largest exposure is to ${REGIONS[topR[0]].en} (${pct(topR[1])} of the portfolio), and the rest is nicely spread across other regions.`,
    nRegions >= 3 ? "good" : "neutral");

  /* --- ריכוזיות סקטוריאלית --- */
  if (topS && topS[1] >= 35) say(
    `${pct(topS[1])} מהתיק מרוכז בסקטור ${SECTORS[topS[0]][LANG]}. זהו הסקטור הדומיננטי, והתיק יושפע ממנו במידה ניכרת.`,
    `${pct(topS[1])} of the portfolio is concentrated in ${SECTORS[topS[0]].en}. It is the dominant sector and will move the portfolio considerably.`,
    "warn");

  /* --- פיזור אפקטיבי ---
     הירידה ממספר ההחזקות אל "ההימורים העצמאיים" נובעת משני גורמים נפרדים,
     והיא מתפרקת אליהם בשרשרת:

         N  ──(ריכוז משקלים)──▶  nominal  ──(חפיפה)──▶  effBets

     nominal = 1/Σw² הוא הפיזור האפקטיבי אילו ההחזקות היו זרות לחלוטין;
     כל הירידה מ-N אליו נובעת ממשקלים לא שווים. הירידה הנוספת ממנו אל
     effBets נובעת אך ורק מהחפיפה. חשוב לדווח על שניהם: תיק עם ארבע החזקות
     שאחת מהן היא חצי מהתיק יכול להראות "חפיפה נמוכה" ועדיין להיות מרוכז. */
  if (holdings.length >= 2) {
    const n = holdings.length;
    const nominal = 1 / holdings.reduce((s, h) => s + (h.weight / 100) ** 2, 0);
    const eb = effBets.toFixed(1);

    const weightLoss = n - nominal;         // כמה "אבד" בגלל ריכוז משקלים
    const overlapLoss = nominal - effBets;  // כמה אבד בנוסף בגלל חפיפה
    const weightsMatter = nominal < n * 0.85;
    const overlapMatters = effBets < nominal * 0.85;
    // אזהרה גם במונחים מוחלטים (פחות משני הימורים) וגם ביחס למספר ההחזקות:
    // 1.7 מתוך 4 הוא ריכוז אמיתי, גם אם 1.7 לבדו אינו נמוך במיוחד.
    const tone = (effBets < 1.6 || effBets < n * 0.45) ? "warn"
               : effBets < n * 0.65 ? "neutral" : "good";

    if (weightsMatter && overlapMatters) {
      const bigger = weightLoss >= overlapLoss;
      say(
        `יש לכם ${n} החזקות, אבל בפועל התיק מתנהג כאילו יש בו רק כ-${eb} החזקות שונות. שתי סיבות לכך: חלק גדול מהכסף מרוכז בהחזקה אחת או שתיים, וגם חלק מההחזקות מחזיקות נכסים דומים ולכן "כפולות" זו לזו. המשמעותי יותר כאן הוא ${bigger ? "ריכוז הכסף בהחזקה בודדת" : "הדמיון בין ההחזקות"}.`,
        `You have ${n} holdings, but in practice the portfolio behaves as if it holds only about ${eb} different ones. Two reasons: much of the money sits in one or two holdings, and some holdings own similar assets and so "double up." The bigger factor here is ${bigger ? "money concentrated in a single holding" : "the similarity between holdings"}.`,
        tone);
    } else if (weightsMatter) {
      say(
        `יש לכם ${n} החזקות, אבל בפועל התיק מתנהג כאילו יש בו רק כ-${eb} שונות. הסיבה: חלק גדול מהכסף מרוכז בהחזקה אחת, והיא זו שקובעת את התמונה. ההחזקות עצמן דווקא שונות זו מזו.`,
        `You have ${n} holdings, but in practice the portfolio behaves as if it holds only about ${eb} different ones. The reason: much of the money is concentrated in a single holding, and it drives the picture. The holdings themselves are actually quite different from each other.`,
        tone);
    } else if (overlapMatters) {
      say(
        `יש לכם ${n} החזקות, אבל בפועל התיק מתנהג כאילו יש בו רק כ-${eb} שונות. הכסף אמנם מחולק ביניהן במאוזן, אבל חלקן מחזיקות נכסים דומים — כלומר אתם קונים פחות או יותר את אותו דבר כמה פעמים.`,
        `You have ${n} holdings, but in practice the portfolio behaves as if it holds only about ${eb} different ones. The money is split evenly between them, but some hold similar assets — meaning you're buying more or less the same thing several times.`,
        tone);
    } else {
      say(
        `התיק שלכם מפוזר יפה: ${n} ההחזקות גם מחולקות במשקל מאוזן וגם מחזיקות נכסים שונים זו מזו, כך שכל אחת באמת תורמת לפיזור.`,
        `Your portfolio is well spread: the ${n} holdings are both evenly weighted and hold assets different from one another, so each one genuinely adds to the diversification.`,
        "good");
    }
  }

  /* --- הזוג החופף ביותר --- */
  let worst = null;
  for (let i = 0; i < holdings.length; i++)
    for (let j = i + 1; j < holdings.length; j++) {
      const o = overlap(holdings[i], holdings[j]);
      if (!worst || o > worst.o) worst = { o, a: holdings[i], b: holdings[j] };
    }
  if (worst && worst.o >= 60) say(
    `הזוג הכי דומה בתיק הוא "${worst.a.label}" ו"${worst.b.label}" — הם חופפים ב-${pct(worst.o)}, כלומר מחזיקים בגדול את אותו שוק. אם אתם מחזיקים את שניהם, שווה לשקול אם באמת צריך את שניהם.`,
    `The most similar pair in your portfolio is "${worst.a.label}" and "${worst.b.label}" — they overlap ${pct(worst.o)}, meaning they largely hold the same market. If you hold both, it's worth asking whether you really need both.`,
    "warn");

  return out;
}

/* =========================================================
   תצוגה
   ========================================================= */
const blankRow = () => ({ query: "", amount: "", manualIndex: "", currency: "" });

let holdings = loadHoldings();
let fxRate = loadFx();   // כמה שקלים שווה דולר אחד

function loadHoldings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (Array.isArray(saved) && saved.length) return saved;
  } catch (e) {}
  return [blankRow(), blankRow()];
}
function saveHoldings() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings)); } catch (e) {}
}
function loadFx() {
  const saved = parseFloat(localStorage.getItem(FX_KEY));
  return saved > 0 ? saved : DEFAULT_FX.USD;
}
function saveFx() {
  try { localStorage.setItem(FX_KEY, String(fxRate)); } catch (e) {}
}

/* המרה למטבע הבסיס. מטבע הבסיס עצמו תמיד ביחס 1. */
function toBase(amount, currency) {
  if (currency === BASE_CURRENCY) return amount;
  const rate = currency === "USD" ? fxRate : 1;
  return amount * rate;
}

// מפעיל את שכבת הנתונים על כל שורה ומחזיר רק החזקות תקפות עם משקל
function resolveAll() {
  const rows = holdings.map((h, i) => {
    let res = resolveQuery(h.query);
    if (!res && h.manualIndex && INDEX_PROFILES[h.manualIndex]) {
      res = {
        kind: "manual", label: h.query.trim() || T.unnamed, verified: false, fee: null,
        indexId: h.manualIndex, sub: INDEX_PROFILES[h.manualIndex].label[LANG],
        matrix: matrixForIndex(h.manualIndex),
      };
    }
    const amount = parseFloat(h.amount) || 0;
    if (!res || amount <= 0) return null;
    // מטבע: בחירה מפורשת של המשתמש גוברת על ברירת המחדל של הנייר
    const currency = h.currency || res.currency || BASE_CURRENCY;
    return {
      ...res, amount, currency,
      amountBase: toBase(amount, currency),   // הכל מומר לשקלים לפני שקילה
      color: PALETTE[i % PALETTE.length],
    };
  }).filter(Boolean);

  // המשקלים נגזרים מהסכום המומר — אחרת דולר ושקל היו נספרים כשווים
  const total = rows.reduce((s, r) => s + r.amountBase, 0);
  rows.forEach((r) => (r.weight = total > 0 ? (r.amountBase / total) * 100 : 0));
  return { rows, total };
}

function renderRows() {
  const wrap = $("#holdings-list");
  wrap.innerHTML = "";
  holdings.forEach((h, i) => {
    const res = resolveQuery(h.query);
    const unknown = !res && h.query.trim().length > 0;
    const cur = h.currency || res?.currency || BASE_CURRENCY;
    const row = document.createElement("div");
    row.className = "holding-row";
    row.innerHTML = `
      <div class="holding-main">
        <span class="asset-dot" style="background:${PALETTE[i % PALETTE.length]}"></span>
        <input type="text" class="hq" list="security-list" value="${escapeAttr(h.query)}"
               placeholder="${T.searchPh}" aria-label="${T.searchPh}">
        <input type="number" class="hamt" value="${escapeAttr(h.amount)}" min="0" step="any"
               inputmode="decimal" placeholder="${T.amountPh}" aria-label="${T.amountPh}">
        <select class="hcur" aria-label="${T.currencyLabel}">
          ${Object.entries(CURRENCIES).map(([code, c]) =>
            `<option value="${code}" ${cur === code ? "selected" : ""}>${c.symbol}</option>`).join("")}
        </select>
        <button class="asset-del" title="×" aria-label="delete">×</button>
      </div>
      ${res ? `<div class="holding-meta">
                 <span class="hm-index">${res.sub}</span>
                 ${res.verified ? `<span class="hm-badge" title="${T.verified}">✓</span>` : ""}
                 ${res.fee != null ? `<span class="hm-fee">${res.fee}%</span>` : ""}
                 ${cur !== BASE_CURRENCY && parseFloat(h.amount) > 0
                   ? `<span class="hm-conv">≈ ${fmt(toBase(parseFloat(h.amount), cur))}</span>` : ""}
               </div>` : ""}
      ${unknown ? `<div class="holding-unknown">
                     <label>${T.unknownPrompt}</label>
                     <select class="hidx">
                       <option value="">${T.chooseIndex}</option>
                       ${Object.entries(INDEX_PROFILES).map(([id, p]) =>
                         `<option value="${id}" ${h.manualIndex === id ? "selected" : ""}>${p.label[LANG]}</option>`).join("")}
                     </select>
                   </div>` : ""}
    `;
    row.querySelector(".hq").addEventListener("input", (e) => {
      // שומרים את מיקום הסמן *לפני* הרינדור מחדש, אחרת הוא יחזור להתחלה
      rememberCaret(e.target);
      holdings[i].query = e.target.value;
      renderRows(); update();
    });
    row.querySelector(".hamt").addEventListener("input", (e) => {
      if (parseFloat(e.target.value) < 0) e.target.value = "0";
      holdings[i].amount = e.target.value;
      // בלי renderRows: input[type=number] לא תומך ב-setSelectionRange, ולכן
      // בנייה מחדש של השורה הייתה מאבדת את הסמן ומהפכת את סדר הספרות.
      // מרעננים רק את תווית ההמרה, במקום.
      refreshConversion(row, i);
      update();
    });
    row.querySelector(".hcur").addEventListener("change", (e) => {
      holdings[i].currency = e.target.value;
      renderRows(); update();
    });
    row.querySelector(".asset-del").addEventListener("click", () => {
      holdings.splice(i, 1);
      if (!holdings.length) holdings.push({ query: "", amount: "", manualIndex: "" });
      renderRows(); update();
    });
    const sel = row.querySelector(".hidx");
    if (sel) sel.addEventListener("change", (e) => {
      holdings[i].manualIndex = e.target.value;
      renderRows(); update();
    });
    wrap.appendChild(row);
  });
  // שמירת מיקוד בשדה שנערך, כדי שההקלדה לא תיקטע ברינדור מחדש
  restoreFocus();
}

/* שמירה ושחזור של מיקום הסמן סביב רינדור מחדש של הרשימה.

   שתי מלכודות:
   1. חייבים ללכוד את המיקום בכל אירוע input, לא רק ב-focusin. אחרת המיקום
      תמיד 0, הסמן קופץ להתחלה אחרי כל תו, והטקסט נכנס בסדר הפוך.
   2. input[type=number] אינו תומך בבחירת טקסט: selectionStart מחזיר null
      ו-setSelectionRange זורק InvalidStateError. לכן pos עשוי להיות null,
      ובמקרה כזה מסתפקים במיקוד בלי מיקום. */
let focusState = null;

function rememberCaret(el) {
  const row = el.closest(".holding-row");
  if (!row) return;
  const idx = [...row.parentNode.children].indexOf(row);
  let pos = null;
  try { pos = el.selectionStart; } catch (e) { /* שדה מספרי — אין תמיכה */ }
  focusState = { idx, cls: el.classList.contains("hq") ? "hq" : "hamt", pos };
}

document.addEventListener("focusin", (e) => {
  if (e.target.classList?.contains("hq") || e.target.classList?.contains("hamt"))
    rememberCaret(e.target);
});

function restoreFocus() {
  if (!focusState) return;
  const rows = document.querySelectorAll(".holding-row");
  const el = rows[focusState.idx]?.querySelector("." + focusState.cls);
  if (!el) return;
  el.focus();
  if (focusState.pos != null) {
    try { el.setSelectionRange(focusState.pos, focusState.pos); } catch (e) {}
  }
}

/* ריענון נקודתי של תווית ההמרה לשקלים, בלי לבנות מחדש את השורה. */
function refreshConversion(row, i) {
  const meta = row.querySelector(".holding-meta");
  if (!meta) return;
  const res = resolveQuery(holdings[i].query);
  const cur = holdings[i].currency || res?.currency || BASE_CURRENCY;
  const amount = parseFloat(holdings[i].amount);
  let el = meta.querySelector(".hm-conv");

  if (cur !== BASE_CURRENCY && amount > 0) {
    if (!el) {
      el = document.createElement("span");
      el.className = "hm-conv";
      meta.appendChild(el);
    }
    el.textContent = "≈ " + fmt(toBase(amount, cur));
  } else if (el) {
    el.remove();
  }
}

function escapeAttr(s) {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

/* ---------- גרף עוגה ---------- */
function drawDonut(items) {
  const size = 240, r = 90, cx = size / 2, cy = size / 2, stroke = 36;
  const C = 2 * Math.PI * r;
  if (!items.length)
    return `<svg viewBox="0 0 ${size} ${size}" role="img" aria-label="empty">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#e2e8f0" stroke-width="${stroke}"/></svg>`;

  let offset = 0;
  const arcs = items.map((it) => {
    const len = (it.weight / 100) * C;
    const seg = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${it.color}"
      stroke-width="${stroke}" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-offset}"
      transform="rotate(-90 ${cx} ${cy})"
      style="transition:stroke-dasharray .4s ease, stroke-dashoffset .4s ease"/>`;
    offset += len;
    return seg;
  }).join("");
  return `<svg viewBox="0 0 ${size} ${size}" role="img" aria-label="portfolio breakdown">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#f1f5f9" stroke-width="${stroke}"/>${arcs}</svg>`;
}

/* ---------- מד עמודות אופקי ---------- */
function drawBars(vec, dict) {
  const rows = Object.entries(vec).filter(([, v]) => v >= 0.5).sort((a, b) => b[1] - a[1]);
  if (!rows.length) return "";
  const max = rows[0][1];
  return rows.map(([k, v]) => `
    <div class="bar-row">
      <span class="bar-label">${dict[k][LANG]}</span>
      <span class="bar-track"><span class="bar-fill" style="width:${(v / max) * 100}%"></span></span>
      <span class="bar-val">${pct(v)}</span>
    </div>`).join("");
}

/* ---------- לוח המחוונים ---------- */
function update() {
  saveHoldings();
  const { rows } = resolveAll();

  const donut = $("#p-donut"), legend = $("#p-legend");
  if (!rows.length) {
    donut.innerHTML = drawDonut([]);
    const t = $("#p-total");
    if (t) t.textContent = fmt(0);
    legend.innerHTML = `<p class="empty-state">${T.emptyChart}</p>`;
    $("#p-metrics").innerHTML = "";
    $("#p-exposure").innerHTML = "";
    $("#p-pairs").innerHTML = "";
    $("#p-analysis").innerHTML = `<p class="empty-state">${T.emptyAnalysis}</p>`;
    return;
  }

  donut.innerHTML = drawDonut(rows);
  // סכום התיק, תמיד במטבע הבסיס
  const totalEl = $("#p-total");
  if (totalEl) totalEl.textContent = fmt(rows.reduce((s, r) => s + r.amountBase, 0));

  legend.innerHTML = rows.slice().sort((a, b) => b.weight - a.weight).map((r) => `
    <div class="legend-item">
      <span class="dot" style="background:${r.color}"></span>
      <span class="lg-name">${r.label}</span>
      <span class="lg-pct">${r.currency !== BASE_CURRENCY
        ? fmt(r.amount, r.currency) + " · " : ""}${pct(r.weight)}</span>
    </div>`).join("");

  const pM = portfolioMatrix(rows);
  const regions = collapse(pM, "region");
  const sectors = collapse(pM, "sector");
  const avgOv = averageOverlap(rows);
  const eb = effectiveBets(rows);
  const topR = Object.entries(regions).sort((a, b) => b[1] - a[1])[0];

  // דמי ניהול משוקללים — רק אם ידועים לכל ההחזקות בעלות מדד
  const known = rows.filter((r) => r.fee != null);
  const knownW = known.reduce((s, r) => s + r.weight, 0);
  const feeTxt = knownW > 0
    ? (known.reduce((s, r) => s + r.fee * r.weight, 0) / knownW).toFixed(2) + "%"
    : T.unknownFee;

  $("#p-metrics").innerHTML = `
    ${metric(T.avgOverlap, rows.length >= 2 ? pct(avgOv) : "—", avgOv >= 70 ? "warn" : avgOv >= 40 ? "mid" : "good")}
    ${metric(T.effBets, rows.length >= 2 ? eb.toFixed(1) : "—", eb >= 2.5 ? "good" : eb >= 1.6 ? "mid" : "warn")}
    ${metric(T.topRegion, topR ? `${REGIONS[topR[0]][LANG]} · ${pct(topR[1])}` : "—", topR && topR[1] >= 75 ? "warn" : "good")}
    ${metric(T.avgFee, feeTxt, "neutral")}`;

  $("#p-exposure").innerHTML = `
    <div class="exposure-col"><h3>${T.regionTitle}</h3>${drawBars(regions, REGIONS)}</div>
    <div class="exposure-col"><h3>${T.sectorTitle}</h3>${drawBars(sectors, SECTORS)}</div>`;

  // טבלת חפיפה זוגית
  if (rows.length >= 2) {
    const pairs = [];
    for (let i = 0; i < rows.length; i++)
      for (let j = i + 1; j < rows.length; j++)
        pairs.push({ a: rows[i], b: rows[j], o: overlap(rows[i], rows[j]) });
    pairs.sort((x, y) => y.o - x.o);
    $("#p-pairs").innerHTML = `<h3>${T.pairTitle}</h3>` + pairs.map((p) => `
      <div class="pair-row">
        <span class="pair-names"><span class="dot" style="background:${p.a.color}"></span>${p.a.label}
          <span class="pair-x">↔</span>
          <span class="dot" style="background:${p.b.color}"></span>${p.b.label}</span>
        <span class="bar-track"><span class="bar-fill ${p.o >= 70 ? "hot" : p.o >= 40 ? "mid" : ""}"
          style="width:${p.o}%"></span></span>
        <span class="bar-val">${pct(p.o)}</span>
      </div>`).join("");
  } else $("#p-pairs").innerHTML = "";

  const analysis = buildAnalysis(rows, pM, avgOv, eb);
  $("#p-analysis").innerHTML = `<h3>${T.analysisTitle}</h3>` + (
    rows.length < 2
      ? `<p class="empty-state">${T.emptyAnalysis}</p>`
      : `<ul class="analysis-list">${analysis.map((a) =>
          `<li class="an-${a.tone}">${a.text}</li>`).join("")}</ul>`);
}

function metric(label, value, tone) {
  return `<div class="metric metric-${tone}">
    <span class="metric-val">${value}</span>
    <span class="metric-label">${label}</span>
  </div>`;
}

/* ---------- אתחול ---------- */
document.addEventListener("DOMContentLoaded", () => {
  // רשימת השלמה אוטומטית: קרנות (עם מספר נייר אם אומת) + מניות
  const dl = $("#security-list");
  if (dl) dl.innerHTML =
    FUNDS.map((f) => {
      const key = f.secNo || f.ticker || f.name[LANG];   // מה שיוקלד בשדה
      const hint = f.secNo || f.ticker;                   // מה שיוצג לצד השם
      return `<option value="${key}">${f.name[LANG]}${hint ? " · " + hint : ""}</option>`;
    }).join("") +
    STOCKS.map((s) => `<option value="${s.ticker}">${s.name[LANG]} · ${s.ticker}</option>`).join("");

  const asOf = $("#data-as-of");
  if (asOf) asOf.textContent = DATA_AS_OF[LANG];

  // שדה שער החליפין
  const fxInput = $("#fx-rate");
  if (fxInput) {
    fxInput.value = fxRate;
    fxInput.addEventListener("input", (e) => {
      const v = parseFloat(e.target.value);
      if (v > 0) { fxRate = v; saveFx(); renderRows(); update(); }
    });
  }
  const fxLabel = $("#fx-label");
  if (fxLabel) fxLabel.textContent = T.fxLabel;
  const totalLabel = $("#p-total-label");
  if (totalLabel) totalLabel.textContent = T.totalLabel;

  renderRows();
  update();
  $("#add-holding")?.addEventListener("click", () => {
    holdings.push(blankRow());
    renderRows(); update();
    const qs = document.querySelectorAll(".holding-row .hq");
    qs[qs.length - 1]?.focus();
  });
  $("#reset-holdings")?.addEventListener("click", () => {
    if (!confirm(T.resetConfirm)) return;
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    holdings = [blankRow(), blankRow()];
    renderRows(); update();
  });
});
