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
});
