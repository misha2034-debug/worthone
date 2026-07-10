/* =========================================================
   portfolio.js — מנוע מחשבון החפיפה והפיזור של WorthOne
   כל החישוב מתבצע בדפדפן. שום נתון לא נשלח לשרת.

   מודל: כל החזקה מיוצגת כמטריצת חשיפה על פני (אזור × סקטור).
   החפיפה בין שתי החזקות = סכום המינימום בכל תא — מדד סטנדרטי
   לחשיפה משותפת, בטווח 0%–100%.
   ========================================================= */

const LANG = document.documentElement.lang === "en" ? "en" : "he";
const RTL = LANG === "he";

const PALETTE = ["#4f46e5", "#7c3aed", "#06b6d4", "#8b5cf6", "#3b82f6",
                 "#a855f7", "#0ea5e9", "#6366f1", "#c026d3", "#2563eb"];

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
    avgOverlap: "חפיפה ממוצעת בתיק",
    effBets: "מספר הימורים עצמאיים",
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
    avgOverlap: "Average portfolio overlap",
    effBets: "Effective independent bets",
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
      `החפיפה הממוצעת בין ההחזקות שלכם היא ${pct(avgOv)} — גבוהה מאוד. בפועל, רוב הכסף חשוף לאותן חברות ולאותם שווקים, כך שהוספת הקרנות זו לזו מוסיפה פחות פיזור ממה שנדמה.`,
      `The average overlap between your holdings is ${pct(avgOv)} — very high. In practice most of your money is exposed to the same companies and markets, so holding these funds together adds less diversification than it appears.`,
      "warn");
    else if (avgOv >= 40) say(
      `החפיפה הממוצעת בין ההחזקות היא ${pct(avgOv)} — בינונית. יש חפיפה מהותית, אך גם רכיבים שמוסיפים פיזור אמיתי.`,
      `The average overlap between your holdings is ${pct(avgOv)} — moderate. There's meaningful overlap, but also components that add real diversification.`,
      "neutral");
    // ניסוח זהיר: זהו ממוצע בין *זוגות*. הוא לא מעיד לבדו על פיזור התיק
    // כולו, שמושפע גם מריכוז המשקלים. ראו את סעיף הפיזור האפקטיבי.
    else say(
      `החפיפה הממוצעת בין זוגות ההחזקות היא ${pct(avgOv)} — נמוכה. ההחזקות מכסות שווקים וסקטורים שונים זו מזו. שימו לב שזהו ממוצע בין זוגות בלבד, ולא מדד לפיזור התיק כולו.`,
      `The average overlap between pairs of holdings is ${pct(avgOv)} — low. The holdings cover markets and sectors that differ from one another. Note this is an average across pairs only, not a measure of the portfolio's overall diversification.`,
      "good");
  }

  /* --- ריכוזיות גאוגרפית ---
     שלוש מדרגות. בלי מדרגת הביניים, חשיפה של 64% לאזור בודד הייתה מוצגת
     בנימה חיובית רק משום שלא חצתה את סף האזהרה. */
  if (topR && topR[1] >= 75) say(
    `${pct(topR[1])} מהתיק חשוף ל${REGIONS[topR[0]][LANG]}. גם אם אתם מחזיקים קרן "עולמית", המשקל בפועל של אזור בודד גבוה מאוד.`,
    `${pct(topR[1])} of the portfolio is exposed to ${REGIONS[topR[0]].en}. Even if you hold a "global" fund, the effective weight of a single region is very high.`,
    "warn");
  else if (topR && topR[1] >= 55) say(
    `${pct(topR[1])} מהתיק חשוף ל${REGIONS[topR[0]][LANG]} — נתח מהותי, גם אם הוא לא קיצוני. התיק פרוס על ${nRegions} אזורים במשקל של 5% ומעלה, אך אזור אחד עדיין מכריע.`,
    `${pct(topR[1])} of the portfolio is exposed to ${REGIONS[topR[0]].en} — a substantial share, though not extreme. The portfolio spans ${nRegions} regions at 5% or more, but one region still dominates.`,
    "neutral");
  else if (topR) say(
    `החשיפה הגדולה ביותר היא ל${REGIONS[topR[0]][LANG]} (${pct(topR[1])}), והתיק פרוס על ${nRegions} אזורים במשקל של 5% ומעלה.`,
    `The largest exposure is to ${REGIONS[topR[0]].en} (${pct(topR[1])}), and the portfolio spans ${nRegions} regions at 5% or more.`,
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
    const eb = effBets.toFixed(1), nom = nominal.toFixed(1);

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
        `מתוך ${n} החזקות, התיק מתנהג כמו ${eb} עצמאיות. שני גורמים פועלים כאן: ריכוז המשקלים לבדו מוריד אותו ל-${nom}, והחפיפה בין ההחזקות מורידה אותו הלאה ל-${eb}. הגורם הדומיננטי הוא ${bigger ? "ריכוז המשקלים" : "החפיפה"}.`,
        `Out of ${n} holdings, the portfolio behaves like ${eb} independent ones. Two forces are at work: weight concentration alone brings it down to ${nom}, and overlap between holdings brings it further down to ${eb}. The dominant factor is ${bigger ? "weight concentration" : "overlap"}.`,
        tone);
    } else if (weightsMatter) {
      say(
        `מתוך ${n} החזקות, התיק מתנהג כמו ${eb} עצמאיות. הסיבה היא ריכוז המשקלים — החזקה אחת תופסת נתח גדול מדי. החפיפה בין ההחזקות כמעט לא משפיעה כאן.`,
        `Out of ${n} holdings, the portfolio behaves like ${eb} independent ones. The cause is weight concentration — one holding takes too large a share. Overlap between holdings has almost no effect here.`,
        tone);
    } else if (overlapMatters) {
      say(
        `מתוך ${n} החזקות, התיק מתנהג כמו ${eb} עצמאיות. המשקלים דווקא מאוזנים — מה שמקטין את הפיזור זו החפיפה בין ההחזקות עצמן.`,
        `Out of ${n} holdings, the portfolio behaves like ${eb} independent ones. The weights are actually balanced — what reduces the diversification is the overlap between the holdings themselves.`,
        tone);
    } else {
      say(
        `התיק מתנהג כמו ${eb} החזקות עצמאיות מתוך ${n} — המשקלים מאוזנים והחפיפה נמוכה.`,
        `The portfolio behaves like ${eb} independent holdings out of ${n} — the weights are balanced and the overlap is low.`,
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
    `החפיפה הגדולה ביותר היא בין "${worst.a.label}" ל"${worst.b.label}" — ${pct(worst.o)}. השניים מכסים במידה רבה את אותו שוק.`,
    `The largest overlap is between "${worst.a.label}" and "${worst.b.label}" — ${pct(worst.o)}. The two largely cover the same market.`,
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
