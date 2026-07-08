/* =========================================================
   app.js
   Entry point: wires up the sidebar navigation, mounts every
   module, and exposes switchView() so any module can navigate
   (used by dashboard quick actions and global search results).

   Concepts demonstrated: ES module imports/exports tying all the
   other files together, event listeners, classList toggling for
   a single-page-app-style view switch (no framework/router needed).
   ========================================================= */

import { initDashboard, renderDashboard } from "./dashboard.js";
import { initIncome, renderIncome } from "./income.js";
import { initExpenses, renderExpenses } from "./expenses.js";
import { initBudget, renderBudget } from "./budget.js";
import { initAnalytics, renderAnalytics } from "./analytics.js";
import { initTasks, renderTasks } from "./tasks.js";
import { initNotes, renderNotes } from "./notes.js";
import { initGoals, renderGoals } from "./goals.js";
import { initCalendar, renderCalendar } from "./calendar.js";
import { initSearch } from "./search.js";
import { initQuickAdd } from "./quick-add.js";

const VIEWS = ["dashboard", "income", "expenses", "budget", "analytics", "tasks", "notes", "goals", "calendar"];

// Every module's render() function bails out early if its own section is
// still hidden (see e.g. income.js). That means switching TO a tab has to
// explicitly re-render it - otherwise a tab you haven't touched since page
// load, or since the last state change, would show up blank.
const RENDERERS = {
  dashboard: renderDashboard,
  income: renderIncome,
  expenses: renderExpenses,
  budget: renderBudget,
  analytics: renderAnalytics,
  tasks: renderTasks,
  notes: renderNotes,
  goals: renderGoals,
  calendar: renderCalendar,
};

function switchView(viewName) {
  if (!VIEWS.includes(viewName)) return;

  VIEWS.forEach((v) => {
    document.getElementById(`view-${v}`)?.classList.toggle("hidden", v !== viewName);
    document.querySelector(`.nav-link[data-view="${v}"]`)?.classList.toggle("nav-link--active", v === viewName);
  });

  // Re-render the freshly-shown view now that it's no longer hidden.
  RENDERERS[viewName]?.();

  document.querySelector(".app-shell")?.classList.remove("sidebar-open"); // close mobile nav
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function initNav() {
  document.querySelectorAll(".nav-link").forEach((link) =>
    link.addEventListener("click", () => switchView(link.dataset.view))
  );

  document.getElementById("menu-toggle")?.addEventListener("click", () => {
    document.querySelector(".app-shell")?.classList.toggle("sidebar-open");
  });
}

function initGreetingBadge() {
  const el = document.getElementById("current-date-badge");
  if (el) {
    el.textContent = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initGreetingBadge();
  initDashboard();
  initIncome();
  initExpenses();
  initBudget();
  initAnalytics();
  initTasks();
  initNotes();
  initGoals();
  initCalendar();
  initSearch();
  initQuickAdd();
});

export { switchView };
