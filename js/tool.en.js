/* =========================================================
   tool.en.js — WorthOne calculator engine (English version)
   All calculation runs in the user's browser. No data is sent to a server.
   ========================================================= */

const PALETTE = ["#4f46e5", "#7c3aed", "#06b6d4", "#8b5cf6", "#3b82f6",
                 "#a855f7", "#0ea5e9", "#6366f1", "#c026d3", "#2563eb"];

// Suggested default asset types (the user can rename them)
const DEFAULT_ASSETS = [
  { name: "Checking account", amount: "" },
  { name: "Provident fund for investment", amount: "" },
  { name: "Pension fund", amount: "" },
  { name: "Money market fund", amount: "" },
  { name: "Bank deposit", amount: "" },
  { name: "Self-managed trading account", amount: "" },
];

// Storage key. Data is saved locally on the device (localStorage) and never sent to a server.
const STORAGE_KEY = "worthone_assets_en";

function loadAssets() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch (e) { /* localStorage unavailable – fall back to defaults */ }
  return DEFAULT_ASSETS.map((a) => ({ ...a }));
}

function saveAssets() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(assets)); } catch (e) {}
}

let assets = loadAssets();

const $ = (sel) => document.querySelector(sel);

// Format a number as currency: 12345 -> "₪12,345"
const fmt = (n) => (n < 0 ? "-" : "") + "₪" + Math.abs(Math.round(n)).toLocaleString("en-US");

/* ---------- Render asset input rows ---------- */
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
             placeholder="Asset name" aria-label="Asset name">
      <input type="number" class="amount" value="${asset.amount}"
             placeholder="0 ₪" ${i === 0 ? "" : 'min="0" inputmode="numeric"'} aria-label="Amount">
      <button class="asset-del" title="Delete" aria-label="Delete row">×</button>
    `;
    row.querySelector(".name").addEventListener("input", (e) => {
      assets[i].name = e.target.value;
      update();
    });
    row.querySelector(".amount").addEventListener("input", (e) => {
      // Negatives allowed only in the first row (checking account); block them elsewhere
      if (i !== 0 && parseFloat(e.target.value) < 0) e.target.value = "0";
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

/* ---------- Add a new row ---------- */
function addAsset() {
  assets.push({ name: "", amount: "" });
  saveAssets();
  renderRows();
  const rows = document.querySelectorAll(".asset-row .name");
  if (rows.length) rows[rows.length - 1].focus();
}

/* ---------- Draw the donut chart in SVG ---------- */
function drawDonut(items, total) {
  const size = 240, r = 90, cx = size / 2, cy = size / 2, stroke = 36;
  const C = 2 * Math.PI * r;

  if (total <= 0) {
    return `<svg viewBox="0 0 ${size} ${size}" role="img" aria-label="Empty chart">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#e2e8f0" stroke-width="${stroke}"/>
    </svg>`;
  }

  let offset = 0;
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

  return `<svg viewBox="0 0 ${size} ${size}" role="img" aria-label="Net worth breakdown">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#f1f5f9" stroke-width="${stroke}"/>
    ${arcs}
  </svg>`;
}

/* ---------- Core calculation + view update ---------- */
function update() {
  saveAssets(); // auto-save on every change
  // All assets; net worth includes negative values (checking account overdraft)
  const parsed = assets.map((a, i) => ({
    name: a.name.trim() || "Unnamed",
    value: parseFloat(a.amount) || 0,
    color: PALETTE[i % PALETTE.length],
  }));
  const total = parsed.reduce((sum, a) => sum + a.value, 0);
  // The chart and legend show only positive assets (a negative slice can't be drawn)
  const items = parsed.filter((a) => a.value > 0);
  const positiveTotal = items.reduce((sum, a) => sum + a.value, 0);

  $("#net-worth").textContent = fmt(total);

  const donut = $("#donut");
  const legend = $("#legend");

  if (items.length === 0) {
    donut.innerHTML = drawDonut([], 0);
    legend.innerHTML = `<p class="empty-state">Enter your amounts and see how much you're worth here</p>`;
    return;
  }

  donut.innerHTML = drawDonut(items, positiveTotal);

  legend.innerHTML = items
    .slice()
    .sort((a, b) => b.value - a.value)
    .map((it) => {
      const pct = ((it.value / positiveTotal) * 100).toFixed(1);
      return `<div class="legend-item">
        <span class="dot" style="background:${it.color}"></span>
        <span class="lg-name">${it.name}</span>
        <span class="lg-pct">${fmt(it.value)} · ${pct}%</span>
      </div>`;
    }).join("");
}

/* ---------- Reset: clear saved data and restore defaults ---------- */
function resetAssets() {
  if (!confirm("Reset all data and restore the starting list?")) return;
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  assets = DEFAULT_ASSETS.map((a) => ({ ...a }));
  renderRows();
  update();
}

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded", () => {
  renderRows();
  update();
  const addBtn = $("#add-asset");
  if (addBtn) addBtn.addEventListener("click", addAsset);
  const resetBtn = $("#reset-assets");
  if (resetBtn) resetBtn.addEventListener("click", resetAssets);
});
