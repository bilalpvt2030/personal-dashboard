/* =========================================================
   analytics.js
   Charts built from the same state used everywhere else -
   category breakdown, income vs expense, 6-month trend.

   Concepts demonstrated: data transformation with array methods
   before handing off to a charting library (Chart.js, loaded via
   CDN in index.html), destroying/recreating chart instances to
   avoid memory leaks on re-render.
   ========================================================= */

import { getState, subscribe } from "./state.js";
import { formatCurrency, sumBy, groupBy } from "./utils.js";

let categoryChart, trendChart, incomeExpenseChart;

function lastNMonthKeys(n) {
  const keys = [];
  const d = new Date();
  d.setDate(1);
  for (let i = 0; i < n; i++) {
    keys.unshift(d.toISOString().slice(0, 7));
    d.setMonth(d.getMonth() - 1);
  }
  return keys;
}

function monthLabel(key) {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-IN", { month: "short" });
}

function render() {
  const root = document.getElementById("view-analytics");
  if (!root || root.classList.contains("hidden")) return;

  const { income, expenses } = getState();

  if (income.length === 0 && expenses.length === 0) {
    root.innerHTML = `
      <div class="view-header"><div><h2>Analytics</h2><p class="muted">Visual breakdown of your income and spending.</p></div></div>
      <div class="card">
        <div class="empty-state">
          <span class="material-symbols-outlined empty-state__icon">bar_chart</span>
          <p class="empty-state__title">Nothing to chart yet</p>
          <p class="empty-state__subtitle">Add some income or expenses first, then come back here.</p>
        </div>
      </div>`;
    return;
  }

  root.innerHTML = `
    <div class="view-header">
      <div><h2>Analytics</h2><p class="muted">Visual breakdown of your income and spending.</p></div>
    </div>
    <div class="chart-grid">
      <div class="card chart-card">
        <h3 class="card__title">Spending by category</h3>
        <canvas id="chart-category"></canvas>
      </div>
      <div class="card chart-card">
        <h3 class="card__title">Income vs expenses</h3>
        <canvas id="chart-income-expense"></canvas>
      </div>
      <div class="card chart-card chart-card--wide">
        <h3 class="card__title">6-month trend</h3>
        <canvas id="chart-trend"></canvas>
      </div>
    </div>
  `;

  drawCategoryChart(expenses);
  drawIncomeExpenseChart(income, expenses);
  drawTrendChart(income, expenses);
}

function palette(n) {
  const colors = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#a855f7", "#ec4899", "#84cc16", "#14b8a6", "#f97316", "#3b82f6", "#eab308"];
  return Array.from({ length: n }, (_, i) => colors[i % colors.length]);
}

function drawCategoryChart(expenses) {
  const ctx = document.getElementById("chart-category");
  const grouped = groupBy(expenses, (e) => e.category);
  const labels = Object.keys(grouped);
  const data = labels.map((cat) => sumBy(grouped[cat], (e) => e.amount));

  if (categoryChart) categoryChart.destroy();
  if (labels.length === 0) return;

  categoryChart = new Chart(ctx, {
    type: "doughnut",
    data: { labels, datasets: [{ data, backgroundColor: palette(labels.length), borderWidth: 0 }] },
    options: {
      plugins: { legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 11 } } } },
      cutout: "62%",
    },
  });
}

function drawIncomeExpenseChart(income, expenses) {
  const ctx = document.getElementById("chart-income-expense");
  const totalIncome = sumBy(income, (i) => i.amount);
  const totalExpense = sumBy(expenses, (e) => e.amount);

  if (incomeExpenseChart) incomeExpenseChart.destroy();
  incomeExpenseChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Income", "Expenses"],
      datasets: [{ data: [totalIncome, totalExpense], backgroundColor: ["#22c55e", "#ef4444"], borderRadius: 6, maxBarThickness: 60 }],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { callback: (v) => formatCurrency(v) } } },
    },
  });
}

function drawTrendChart(income, expenses) {
  const ctx = document.getElementById("chart-trend");
  const months = lastNMonthKeys(6);

  const incomeByMonth = months.map((m) => sumBy(income.filter((i) => i.date.slice(0, 7) === m), (i) => i.amount));
  const expenseByMonth = months.map((m) => sumBy(expenses.filter((e) => e.date.slice(0, 7) === m), (e) => e.amount));

  if (trendChart) trendChart.destroy();
  trendChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: months.map(monthLabel),
      datasets: [
        { label: "Income", data: incomeByMonth, borderColor: "#22c55e", backgroundColor: "rgba(34,197,94,0.1)", tension: 0.35, fill: true },
        { label: "Expenses", data: expenseByMonth, borderColor: "#ef4444", backgroundColor: "rgba(239,68,68,0.1)", tension: 0.35, fill: true },
      ],
    },
    options: {
      plugins: { legend: { position: "bottom" } },
      scales: { y: { beginAtZero: true, ticks: { callback: (v) => formatCurrency(v) } } },
    },
  });
}

function initAnalytics() {
  subscribe(render);
  render();
}

export { initAnalytics, render as renderAnalytics };
