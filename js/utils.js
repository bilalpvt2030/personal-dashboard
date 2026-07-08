/* =========================================================
   utils.js
   Small shared helper functions used across every module.

   Concepts demonstrated: pure functions, template literals,
   Intl API, array methods (reduce/filter/sort/map), default
   parameters, ternary/nullish patterns.
   ========================================================= */

const CURRENCY = "INR";

function formatCurrency(amount) {
  const value = Number(amount) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: CURRENCY,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr, options = { day: "numeric", month: "short", year: "numeric" }) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", options);
}

function todayISO() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

function currentMonthKey(dateStr) {
  // "2026-07-09" -> "2026-07"
  return (dateStr || todayISO()).slice(0, 7);
}

function isSameMonth(dateStr, monthKey) {
  return currentMonthKey(dateStr) === monthKey;
}

function sumBy(list, fn) {
  return list.reduce((total, item) => total + (Number(fn(item)) || 0), 0);
}

function groupBy(list, fn) {
  return list.reduce((groups, item) => {
    const key = fn(item);
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
    return groups;
  }, {});
}

// Escapes text before inserting into innerHTML - prevents XSS from
// anything the user types into a form field (see 16-security-notes in
// the JS internship demo for the full explanation of why this matters).
function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = String(str ?? "");
  return div.innerHTML;
}

function greetingForNow() {
  const hour = new Date().getHours();
  if (hour < 5) return "Burning the midnight oil";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}

function debounce(fn, delay = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// Simple animated count-up used by the dashboard summary cards.
function animateNumber(el, from, to, { duration = 600, formatter = (n) => Math.round(n) } = {}) {
  const start = performance.now();
  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const value = from + (to - from) * eased;
    el.textContent = formatter(value);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

export {
  formatCurrency,
  formatDate,
  todayISO,
  currentMonthKey,
  isSameMonth,
  sumBy,
  groupBy,
  escapeHTML,
  greetingForNow,
  debounce,
  animateNumber,
};
