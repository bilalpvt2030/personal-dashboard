/* =========================================================
   budget.js
   Smart Budget Planner: set a monthly limit per category,
   see spent vs remaining with a colour-coded progress bar.

   Concepts demonstrated: Object.entries/keys, conditional
   (ternary) styling logic, Math.min/max for clamping percentages,
   reusing the CATEGORIES list from expenses.js (module imports
   composing together).
   ========================================================= */

import { getState, updateState, subscribe } from "./state.js";
import { formatCurrency, currentMonthKey, sumBy, escapeHTML } from "./utils.js";
import { showToast } from "./toast.js";
import { CATEGORIES } from "./expenses.js";

function render() {
  const root = document.getElementById("view-budget");
  if (!root || root.classList.contains("hidden")) return;

  const { budgets, expenses } = getState();
  const thisMonth = currentMonthKey();
  const monthExpenses = expenses.filter((e) => e.date.slice(0, 7) === thisMonth);

  const rows = CATEGORIES.map((cat) => {
    const limit = budgets[cat] || 0;
    const spent = sumBy(
      monthExpenses.filter((e) => e.category === cat),
      (e) => e.amount
    );
    return { cat, limit, spent };
  }).filter((r) => r.limit > 0 || r.spent > 0);

  const totalLimit = sumBy(rows, (r) => r.limit);
  const totalSpent = sumBy(rows, (r) => r.spent);

  root.innerHTML = `
    <div class="view-header">
      <div>
        <h2>Smart Budget Planner</h2>
        <p class="muted">Set a monthly limit per category and track how close you are.</p>
      </div>
    </div>

    <div class="stat-row">
      <div class="stat-card"><span class="stat-label">Total budgeted</span><span class="stat-value">${formatCurrency(totalLimit)}</span></div>
      <div class="stat-card"><span class="stat-label">Spent this month</span><span class="stat-value">${formatCurrency(totalSpent)}</span></div>
      <div class="stat-card"><span class="stat-label">Remaining</span><span class="stat-value">${formatCurrency(Math.max(totalLimit - totalSpent, 0))}</span></div>
    </div>

    <form id="budget-form" class="card form-grid">
      <div class="field">
        <label for="budget-category">Category</label>
        <select id="budget-category">${CATEGORIES.map((c) => `<option>${c}</option>`).join("")}</select>
      </div>
      <div class="field">
        <label for="budget-limit">Monthly limit (₹)</label>
        <input id="budget-limit" type="number" min="1" step="1" placeholder="e.g. 3000" required />
      </div>
      <button type="submit" class="btn btn--primary">Set budget</button>
    </form>

    <div class="card">
      <h3 class="card__title">This month's progress</h3>
      ${
        rows.length === 0
          ? emptyState()
          : rows
              .map((r) => {
                const pct = r.limit > 0 ? Math.min((r.spent / r.limit) * 100, 100) : 100;
                const status = r.limit === 0 ? "over" : r.spent > r.limit ? "over" : pct > 80 ? "warn" : "ok";
                return `
                <div class="budget-row">
                  <div class="budget-row__head">
                    <span>${escapeHTML(r.cat)}</span>
                    <span class="muted">${formatCurrency(r.spent)} / ${r.limit ? formatCurrency(r.limit) : "no limit set"}</span>
                  </div>
                  <div class="progress-bar">
                    <div class="progress-bar__fill progress-bar__fill--${status}" style="width:${pct}%"></div>
                  </div>
                  ${r.limit > 0 && r.spent > r.limit ? `<div class="budget-row__warning">Over budget by ${formatCurrency(r.spent - r.limit)}</div>` : ""}
                </div>`;
              })
              .join("")
      }
    </div>
  `;

  document.getElementById("budget-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const category = document.getElementById("budget-category").value;
    const limit = parseFloat(document.getElementById("budget-limit").value);
    if (!limit || limit <= 0) {
      showToast("Enter a valid budget amount.", "error");
      return;
    }
    updateState((state) => {
      state.budgets[category] = limit;
      return state;
    });
    showToast(`Budget set: ${formatCurrency(limit)} for ${category}`, "success");
  });
}

function emptyState() {
  return `
    <div class="empty-state">
      <span class="material-symbols-outlined empty-state__icon">savings</span>
      <p class="empty-state__title">No budgets set yet</p>
      <p class="empty-state__subtitle">Pick a category above and set a monthly limit to start tracking.</p>
    </div>`;
}

function initBudget() {
  subscribe(render);
  render();
}

export { initBudget, render as renderBudget };
