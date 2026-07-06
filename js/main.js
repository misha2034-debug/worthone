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
});
