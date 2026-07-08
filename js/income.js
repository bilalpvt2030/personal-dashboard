/* =========================================================
   income.js
   Income Manager: add/edit/delete income entries, list + totals.

   Concepts demonstrated: array methods (map/filter/reduce/sort),
   form handling, event delegation (one listener on the list
   container instead of one per row), template literals building
   HTML strings, destructuring.
   ========================================================= */

import { getState, updateState, generateId, subscribe } from "./state.js";
import { formatCurrency, formatDate, todayISO, currentMonthKey, sumBy, escapeHTML } from "./utils.js";
import { showToast } from "./toast.js";
import { confirmModal } from "./modal.js";

const SOURCES = ["Salary", "Freelancing", "Business", "Bonus", "Scholarship", "Pocket Money", "Parents", "Investment", "Other Income"];

function render() {
  const root = document.getElementById("view-income");
  if (!root || root.classList.contains("hidden")) return;

  const { income } = getState();
  const sorted = [...income].sort((a, b) => b.date.localeCompare(a.date));
  const thisMonth = currentMonthKey();
  const monthTotal = sumBy(income.filter((i) => i.date.slice(0, 7) === thisMonth), (i) => i.amount);
  const allTimeTotal = sumBy(income, (i) => i.amount);

  root.innerHTML = `
    <div class="view-header">
      <div>
        <h2>Income Manager</h2>
        <p class="muted">Track every rupee coming in - salary, freelance, gifts, anything.</p>
      </div>
    </div>

    <div class="stat-row">
      <div class="stat-card"><span class="stat-label">This month</span><span class="stat-value">${formatCurrency(monthTotal)}</span></div>
      <div class="stat-card"><span class="stat-label">All time</span><span class="stat-value">${formatCurrency(allTimeTotal)}</span></div>
      <div class="stat-card"><span class="stat-label">Entries</span><span class="stat-value">${income.length}</span></div>
    </div>

    <form id="income-form" class="card form-grid">
      <div class="field">
        <label for="income-source">Source</label>
        <select id="income-source" required>
          ${SOURCES.map((s) => `<option value="${s}">${s}</option>`).join("")}
        </select>
      </div>
      <div class="field">
        <label for="income-amount">Amount (₹)</label>
        <input id="income-amount" type="number" min="1" step="1" placeholder="e.g. 15000" required />
      </div>
      <div class="field">
        <label for="income-date">Date</label>
        <input id="income-date" type="date" value="${todayISO()}" required />
      </div>
      <div class="field field--wide">
        <label for="income-note">Note (optional)</label>
        <input id="income-note" type="text" placeholder="e.g. July stipend from internship" />
      </div>
      <button type="submit" class="btn btn--primary">Add income</button>
    </form>

    <div class="card">
      <h3 class="card__title">History</h3>
      ${
        sorted.length === 0
          ? emptyState("No income logged yet", "Add your first entry above to see it here.")
          : `<div class="table-wrap"><table class="data-table">
              <thead><tr><th>Date</th><th>Source</th><th>Note</th><th>Amount</th><th></th></tr></thead>
              <tbody>
                ${sorted
                  .map(
                    (i) => `
                  <tr data-id="${i.id}">
                    <td>${formatDate(i.date)}</td>
                    <td><span class="tag">${escapeHTML(i.source)}</span></td>
                    <td class="muted">${escapeHTML(i.note || "-")}</td>
                    <td class="amount amount--positive">+${formatCurrency(i.amount)}</td>
                    <td><button class="icon-btn delete-income" title="Delete" data-id="${i.id}">&times;</button></td>
                  </tr>`
                  )
                  .join("")}
              </tbody>
            </table></div>`
      }
    </div>
  `;

  document.getElementById("income-form").addEventListener("submit", handleAdd);

  // Event delegation: one click listener handles delete for every row,
  // even rows added after this listener was attached.
  root.querySelector(".data-table tbody")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".delete-income");
    if (!btn) return;
    handleDelete(btn.dataset.id);
  });
}

function handleAdd(e) {
  e.preventDefault();
  const source = document.getElementById("income-source").value;
  const amount = parseFloat(document.getElementById("income-amount").value);
  const date = document.getElementById("income-date").value;
  const note = document.getElementById("income-note").value.trim();

  if (!amount || amount <= 0) {
    showToast("Enter a valid amount.", "error");
    return;
  }

  updateState((state) => {
    state.income.push({ id: generateId(), source, amount, date, note });
    return state;
  });

  showToast(`Added ${formatCurrency(amount)} income from ${source}`, "success");
}

async function handleDelete(id) {
  const ok = await confirmModal({
    title: "Delete this income entry?",
    message: "This can't be undone.",
    confirmLabel: "Delete",
    danger: true,
  });
  if (!ok) return;

  updateState((state) => {
    state.income = state.income.filter((i) => i.id !== id);
    return state;
  });
  showToast("Income entry deleted", "info");
}

function emptyState(title, subtitle) {
  return `
    <div class="empty-state">
      <span class="material-symbols-outlined empty-state__icon">payments</span>
      <p class="empty-state__title">${title}</p>
      <p class="empty-state__subtitle">${subtitle}</p>
    </div>`;
}

function initIncome() {
  subscribe(render);
  render();
}

export { initIncome, render as renderIncome };
