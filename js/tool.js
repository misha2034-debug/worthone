/* =========================================================
   tool.js — מנוע המחשבון וגרף העוגה של WorthOne
   כל החישוב מתבצע בדפדפן של המשתמש. שום נתון לא נשלח לשרת.
   ========================================================= */

// פלטת צבעים לנתחי הגרף (כחול→סגול + גוונים משלימים)
const PALETTE = ["#4f46e5", "#7c3aed", "#06b6d4", "#8b5cf6", "#3b82f6",
                 "#a855f7", "#0ea5e9", "#6366f1", "#c026d3", "#2563eb"];

// סוגי נכסים מוצעים כברירת מחדל (המשתמש יכול לשנות שם)
const DEFAULT_ASSETS = [
  { name: "עובר ושב", amount: "" },
  { name: "קופת גמל להשקעה", amount: "" },
  { name: "קרן פנסיה", amount: "" },
  { name: "קרן כספית", amount: "" },
  { name: "פיקדון בנקאי", amount: "" },
  { name: "חשבון מסחר עצמאי", amount: "" },
];

// מפתח שמירה בדפדפן. הנתונים נשמרים מקומית במכשיר בלבד (localStorage) ולא נשלחים לשרת.
const STORAGE_KEY = "worthone_assets_he";

// טעינת הנכסים השמורים, או ברירת המחדל אם אין שמירה
function loadAssets() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch (e) { /* localStorage לא זמין – נמשיך עם ברירת המחדל */ }
  return DEFAULT_ASSETS.map((a) => ({ ...a }));
}

// שמירת המצב הנוכחי בדפדפן
function saveAssets() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(assets)); } catch (e) {}
}

let assets = loadAssets();

const $ = (sel) => document.querySelector(sel);

// עיצוב מספר כמטבע שקלי: 12345 -> "₪12,345"
const fmt = (n) =>
  "₪" + Math.round(n).toLocaleString("en-US");

/* ---------- ציור שורות הזנת הנכסים ---------- */
function renderRows() {
  const wrap = $("#assets-list");
  wrap.innerHTML = "";
  assets.forEach((asset, i) => {
    const color = PALETTE[i % PALETTE.length];
    const row = document.createElement("div");
    row.className = "asset-row";
    row.innerHTML = `
      <span class="asset-dot" style="background:${color}"></span>
      <input type="text" class="name" value="${asset.name}"
             placeholder="שם הנכס" aria-label="שם הנכס">
      <input type="number" class="amount" value="${asset.amount}"
             placeholder="0 ₪" min="0" inputmode="numeric" aria-label="סכום">
      <button class="asset-del" title="מחיקה" aria-label="מחיקת שורה">×</button>
    `;
    // קישור אירועים לשורה הזו
    row.querySelector(".name").addEventListener("input", (e) => {
      assets[i].name = e.target.value;
      update();
    });
    row.querySelector(".amount").addEventListener("input", (e) => {
      assets[i].amount = e.target.value;
      update();
    });
    row.querySelector(".asset-del").addEventListener("click", () => {
      assets.splice(i, 1);
      renderRows();
      update();
    });
    wrap.appendChild(row);
  });
}

/* ---------- הוספת שורה חדשה ---------- */
function addAsset() {
  assets.push({ name: "", amount: "" });
  saveAssets();
  renderRows();
  // מיקוד בשדה השם החדש לחוויית הזנה נוחה
  const rows = document.querySelectorAll(".asset-row .name");
  if (rows.length) rows[rows.length - 1].focus();
}

/* ---------- ציור גרף עוגה (Donut) ב-SVG ---------- */
function drawDonut(items, total) {
  const size = 240, r = 90, cx = size / 2, cy = size / 2, stroke = 36;
  const C = 2 * Math.PI * r; // היקף המעגל

  if (total <= 0) {
    return `<svg viewBox="0 0 ${size} ${size}" role="img" aria-label="גרף ריק">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#e2e8f0" stroke-width="${stroke}"/>
    </svg>`;
  }

  let offset = 0;
  // כל נתח = קשת על טבעת. משתמשים ב-stroke-dasharray כדי לצייר אורך יחסי.
  const arcs = items.map((it) => {
    const frac = it.value / total;
    const len = frac * C;
    const seg = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
        stroke="${it.color}" stroke-width="${stroke}"
        stroke-dasharray="${len} ${C - len}"
        stroke-dashoffset="${-offset}"
        transform="rotate(-90 ${cx} ${cy})"
        style="transition:stroke-dasharray .4s ease, stroke-dashoffset .4s ease"/>`;
    offset += len;
    return seg;
  }).join("");

  return `<svg viewBox="0 0 ${size} ${size}" role="img" aria-label="התפלגות ההון העצמי">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#f1f5f9" stroke-width="${stroke}"/>
    ${arcs}
  </svg>`;
}

/* ---------- חישוב מרכזי + עדכון התצוגה ---------- */
function update() {
  saveAssets(); // שמירה אוטומטית בכל שינוי
  // נכסים תקפים בלבד (בעלי סכום חיובי). צבע יציב לפי מיקום הנכס ברשימה,
  // כך שאותו נכס מקבל אותו צבע גם בשורת ההזנה, גם בגרף וגם במקרא.
  const items = assets
    .map((a, i) => ({
      name: a.name.trim() || "ללא שם",
      value: parseFloat(a.amount) || 0,
      color: PALETTE[i % PALETTE.length],
    }))
    .filter((a) => a.value > 0);

  const total = items.reduce((sum, a) => sum + a.value, 0);

  // ההון העצמי הכולל
  $("#net-worth").textContent = fmt(total);

  const donut = $("#donut");
  const legend = $("#legend");

  if (total <= 0) {
    donut.innerHTML = drawDonut([], 0);
    legend.innerHTML = `<p class="empty-state">הזינו סכומים כדי לראות את הפילוח שלכם 👆</p>`;
    return;
  }

  donut.innerHTML = drawDonut(items, total);

  // מקרא (Legend) עם אחוזים, ממויין מהגדול לקטן
  legend.innerHTML = items
    .slice()
    .sort((a, b) => b.value - a.value)
    .map((it) => {
      const pct = ((it.value / total) * 100).toFixed(1);
      return `<div class="legend-item">
        <span class="dot" style="background:${it.color}"></span>
        <span class="lg-name">${it.name}</span>
        <span class="lg-pct">${fmt(it.value)} · ${pct}%</span>
      </div>`;
    }).join("");
}

/* ---------- איפוס: מחיקת השמירה וחזרה לברירת המחדל ---------- */
function resetAssets() {
  if (!confirm("לאפס את כל הנתונים ולחזור לרשימה ההתחלתית?")) return;
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  assets = DEFAULT_ASSETS.map((a) => ({ ...a }));
  renderRows();
  update();
}

/* ---------- אתחול ---------- */
document.addEventListener("DOMContentLoaded", () => {
  renderRows();
  update();
  const addBtn = $("#add-asset");
  if (addBtn) addBtn.addEventListener("click", addAsset);
  const resetBtn = $("#reset-assets");
  if (resetBtn) resetBtn.addEventListener("click", resetAssets);
});
