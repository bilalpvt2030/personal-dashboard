/* =========================================================
   dashboard.js
   Overview screen: greeting + live clock, summary cards with
   animated counters, recent activity, upcoming tasks, quick
   actions that jump to other views.

   Concepts demonstrated: setInterval for a live clock, requestAnimationFrame
   (via animateNumber in utils.js), combining data from several
   parts of state into one view.
   ========================================================= */

import { getState, subscribe } from "./state.js";
import { formatCurrency, formatDate, greetingForNow, sumBy, currentMonthKey, animateNumber, escapeHTML } from "./utils.js";
import { switchView } from "./app.js";

let clockInterval = null;
let previousTotals = { income: 0, expenses: 0, balance: 0 };

function render() {
  const root = document.getElementById("view-dashboard");
  if (!root || root.classList.contains("hidden")) return;

  const { income, expenses, tasks, goals } = getState();
  const thisMonth = currentMonthKey();

  const monthIncome = sumBy(income.filter((i) => i.date.slice(0, 7) === thisMonth), (i) => i.amount);
  const monthExpense = sumBy(expenses.filter((e) => e.date.slice(0, 7) === thisMonth), (e) => e.amount);
  const balance = monthIncome - monthExpense;

  const upcomingTasks = [...tasks]
    .filter((t) => t.status !== "Done")
    .sort((a, b) => (a.deadline || "9999").localeCompare(b.deadline || "9999"))
    .slice(0, 5);

  const recentActivity = [
    ...income.map((i) => ({ kind: "income", label: `${i.source} income`, amount: i.amount, date: i.date })),
    ...expenses.map((e) => ({ kind: "expense", label: e.title, amount: -e.amount, date: e.date })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  root.innerHTML = `
    <div class="view-header">
      <div>
        <h2 id="dash-greeting">${greetingForNow()}, Bilal</h2>
        <p class="muted" id="dash-clock"></p>
      </div>
      <div class="quick-actions">
        <button class="btn btn--sm" data-goto="expenses">+ Expense</button>
        <button class="btn btn--sm" data-goto="income">+ Income</button>
        <button class="btn btn--sm" data-goto="tasks">+ Task</button>
      </div>
    </div>

    <div class="stat-row stat-row--dashboard">
      <div class="stat-card stat-card--accent">
        <span class="stat-label">Income this month</span>
        <span class="stat-value" id="counter-income">₹0</span>
      </div>
      <div class="stat-card stat-card--accent">
        <span class="stat-label">Expenses this month</span>
        <span class="stat-value" id="counter-expense">₹0</span>
      </div>
      <div class="stat-card stat-card--accent">
        <span class="stat-label">Balance</span>
        <span class="stat-value ${balance < 0 ? "stat-value--negative" : ""}" id="counter-balance">₹0</span>
      </div>
      <div class="stat-card stat-card--accent">
        <span class="stat-label">Open tasks</span>
        <span class="stat-value">${tasks.filter((t) => t.status !== "Done").length}</span>
      </div>
    </div>

    <div class="dashboard-grid">
      <div class="card">
        <h3 class="card__title">Upcoming tasks</h3>
        ${
          upcomingTasks.length === 0
            ? `<p class="muted small">Nothing due - you're clear.</p>`
            : `<ul class="simple-list">
                ${upcomingTasks
                  .map((t) => `<li><span>${escapeHTML(t.title)}</span><span class="muted small">${formatDate(t.deadline)}</span></li>`)
                  .join("")}
              </ul>`
        }
        <button class="btn btn--ghost btn--sm" data-goto="tasks">View all tasks</button>
      </div>

      <div class="card">
        <h3 class="card__title">Recent activity</h3>
        ${
          recentActivity.length === 0
            ? `<p class="muted small">No activity logged yet.</p>`
            : `<ul class="simple-list">
                ${recentActivity
                  .map(
                    (a) => `<li>
                      <span>${escapeHTML(a.label)}</span>
                      <span class="amount ${a.amount >= 0 ? "amount--positive" : "amount--negative"}">${a.amount >= 0 ? "+" : "-"}${formatCurrency(Math.abs(a.amount))}</span>
                    </li>`
                  )
                  .join("")}
              </ul>`
        }
      </div>

      <div class="card">
        <h3 class="card__title">Goals snapshot</h3>
        ${
          goals.length === 0
            ? `<p class="muted small">No goals set yet.</p>`
            : `<ul class="simple-list">
                ${goals
                  .slice(0, 4)
                  .map((g) => {
                    const pct = Math.min(Math.round((g.current / g.target) * 100), 100);
                    return `<li><span>${escapeHTML(g.title)}</span><span class="muted small">${pct}%</span></li>`;
                  })
                  .join("")}
              </ul>`
        }
        <button class="btn btn--ghost btn--sm" data-goto="goals">View goals</button>
      </div>
    </div>
  `;

  root.querySelectorAll("[data-goto]").forEach((btn) =>
    btn.addEventListener("click", () => switchView(btn.dataset.goto))
  );

  animateNumber(document.getElementById("counter-income"), previousTotals.income, monthIncome, {
    formatter: (n) => formatCurrency(n),
  });
  animateNumber(document.getElementById("counter-expense"), previousTotals.expenses, monthExpense, {
    formatter: (n) => formatCurrency(n),
  });
  animateNumber(document.getElementById("counter-balance"), previousTotals.balance, balance, {
    formatter: (n) => formatCurrency(n),
  });
  previousTotals = { income: monthIncome, expenses: monthExpense, balance };

  startClock();
}

function startClock() {
  if (clockInterval) clearInterval(clockInterval);
  const tick = () => {
    const el = document.getElementById("dash-clock");
    if (!el) {
      clearInterval(clockInterval);
      return;
    }
    const now = new Date();
    el.textContent = now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" }) +
      " · " + now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };
  tick();
  clockInterval = setInterval(tick, 1000);
}

function initDashboard() {
  subscribe(render);
  render();
}

export { initDashboard, render as renderDashboard };
