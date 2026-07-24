/* main.js — קוד משותף לכל הדפים */

// --- תפריט נייד: פתיחה/סגירה בלחיצה על כפתור ההמבורגר ---
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => {
      links.classList.toggle("open");
    });
  }

  // --- אקורדיון FAQ: לחיצה על שאלה פותחת/סוגרת את התשובה ---
  document.querySelectorAll(".faq-q").forEach((q) => {
    q.addEventListener("click", () => {
      const item = q.closest(".faq-item");
      const answer = item.querySelector(".faq-a");
      const isOpen = item.classList.toggle("open");
      // אנימציית גובה חלקה: 0 כשסגור, גובה התוכן כשפתוח
      answer.style.maxHeight = isOpen ? answer.scrollHeight + "px" : "0";
    });
  });

  // --- הופעה עדינה בגלילה: כל אלמנט עם .reveal מקבל .visible כשנכנס למסך ---
  const revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          io.unobserve(e.target); // מופיע פעם אחת, לא בכל גלילה
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    // דפדפן ישן — פשוט מציגים הכל
    revealEls.forEach((el) => el.classList.add("visible"));
  }

  // --- אפקט הקלדה (Typewriter) בשורת ה-hero ---
  const twText = document.querySelector(".hero-note .tw-text");
  if (twText) {
    const full = twText.getAttribute("data-text") || "";
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      // מכבדים העדפת "פחות תנועה" — מציגים את המשפט המלא ללא אנימציה
      twText.textContent = full;
    } else {
      const typeSpeed = 55, delSpeed = 28, holdFull = 2000, holdEmpty = 600, startDelay = 700;
      let i = 0, deleting = false;
      const tick = () => {
        i += deleting ? -1 : 1;
        twText.textContent = full.slice(0, i);
        if (!deleting && i >= full.length) { deleting = true; setTimeout(tick, holdFull); }
        else if (deleting && i <= 0) { deleting = false; setTimeout(tick, holdEmpty); }
        else { setTimeout(tick, deleting ? delSpeed : typeSpeed); }
      };
      setTimeout(tick, startDelay);
    }
  }

  /* --- גלגל היתרונות בדף הבית ---
     בונה עוגה מפוצלת ל-6 פלחים מעל הרשימה שכבר קיימת ב-HTML.
     בלי JS הרשימה נשארת קריאה במלואה — הגרף הוא שכבת שיפור בלבד. */
  const wheel = document.getElementById("benefits-wheel");
  if (wheel) {
    const items = [...wheel.querySelectorAll(".bw-item")];
    const svg = wheel.querySelector(".bw-svg");
    const centerIco = wheel.querySelector(".bw-center-ico");
    const NS = "http://www.w3.org/2000/svg";
    const CX = 160, CY = 160, R_OUT = 140, R_IN = 84, GAP = 2.4, N = items.length;

    const rad = (deg) => (deg * Math.PI) / 180;
    const pt = (r, deg) => [CX + r * Math.cos(rad(deg)), CY + r * Math.sin(rad(deg))];

    // טבעת-סקטור: קשת חיצונית, פנימה, קשת פנימית חזרה, סגירה
    function sectorPath(a0, a1) {
      const [x0, y0] = pt(R_OUT, a0), [x1, y1] = pt(R_OUT, a1);
      const [x2, y2] = pt(R_IN, a1), [x3, y3] = pt(R_IN, a0);
      const large = a1 - a0 > 180 ? 1 : 0;
      return `M${x0} ${y0} A${R_OUT} ${R_OUT} 0 ${large} 1 ${x1} ${y1} ` +
             `L${x2} ${y2} A${R_IN} ${R_IN} 0 ${large} 0 ${x3} ${y3} Z`;
    }

    const segs = items.map((item, i) => {
      const step = 360 / N;
      const a0 = -90 + i * step + GAP, a1 = -90 + (i + 1) * step - GAP;
      const mid = (a0 + a1) / 2;
      const p = document.createElementNS(NS, "path");
      p.setAttribute("d", sectorPath(a0, a1));
      p.setAttribute("fill", item.dataset.color);
      p.setAttribute("class", "bw-seg");
      p.setAttribute("tabindex", "0");
      p.setAttribute("role", "button");
      p.setAttribute("aria-label", item.querySelector(".bw-t").textContent);
      // כיוון השליפה החוצה של הפלח הפעיל — לאורך חוצה הזווית שלו
      p.style.setProperty("--dx", (Math.cos(rad(mid)) * 10).toFixed(2) + "px");
      p.style.setProperty("--dy", (Math.sin(rad(mid)) * 10).toFixed(2) + "px");
      svg.appendChild(p);
      return p;
    });

    let active = -1, auto = null;
    function stopAuto() { if (auto) { clearInterval(auto); auto = null; } }

    function setActive(i) {
      if (i === active) return;
      active = i;
      items.forEach((it, k) => it.classList.toggle("active", k === i));
      segs.forEach((p, k) => p.classList.toggle("on", k === i));
      centerIco.innerHTML = items[i].querySelector(".bw-ico svg").innerHTML;
      wheel.style.setProperty("--bw-active", items[i].dataset.color);
    }

    items.forEach((item, i) => {
      const btn = item.querySelector(".bw-btn");
      btn.addEventListener("click", () => { stopAuto(); setActive(i); });
      btn.addEventListener("mouseenter", () => setActive(i));
      btn.addEventListener("focus", () => setActive(i));
    });
    segs.forEach((p, i) => {
      p.addEventListener("mouseenter", () => setActive(i));
      p.addEventListener("focus", () => setActive(i));
      p.addEventListener("click", () => { stopAuto(); setActive(i); });
      p.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); stopAuto(); setActive(i); }
      });
    });
    wheel.addEventListener("mouseenter", stopAuto);
    wheel.addEventListener("pointerdown", stopAuto);

    wheel.classList.add("bw-ready");
    setActive(0);

    // סבב עדין בטעינה שנעצר במגע הראשון; מכבד העדפת "פחות תנועה"
    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduceMotion) auto = setInterval(() => setActive((active + 1) % N), 3600);
  }
});
