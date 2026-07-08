/* =========================================================
   expenses.js
   Expense Manager: UPI-style categories + payment methods,
   add/edit/delete, search + filter + sort.

   Concepts demonstrated: array methods chained together
   (filter -> sort -> map), controlled inputs, debounce for the
   search box, Set for unique category list.
   ========================================================= */

import { getState, updateState, generateId, subscribe } from "./state.js";
import { formatCurrency, formatDate, todayISO, currentMonthKey, sumBy, escapeHTML, debounce } from "./utils.js";
import { showToast } from "./toast.js";

const CATEGORIES = ["Food & Dining", "Groceries", "Transport", "Rent", "Utilities", "Recharge/Bills", "Shopping", "Entertainment", "Health", "Education", "Subscriptions", "Other"];
const METHODS = ["UPI", "Cash", "Debit Card", "Credit Card", "Net Banking"];

let searchQuery = "";
let categoryFilter = "all";
let sortBy = "date-desc";

function filteredExpenses() {
  const { expenses } = getState();
  let list = [...expenses];

  if (categoryFilter !== "all") list = list.filter((e) => e.category === categoryFilter);
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    list = list.filter(
      (e) => e.title.toLowerCase().includes(q) || (e.note || "").toLowerCase().includes(q)
    );
  }

  const sorters = {
    "date-desc": (a, b) => b.date.localeCompare(a.date),
    "date-asc": (a, b) => a.date.localeCompare(b.date),
    "amount-desc": (a, b) => b.amount - a.amount,
    "amount-asc": (a, b) => a.amount - b.amount,
  };
  list.sort(sorters[sortBy]);
  return list;
}

function render() {
  const root = document.getElementById("view-expenses");
  if (!root || root.classList.contains("hidden")) return;

  const { expenses } = getState();
  const list = filteredExpenses();
  const thisMonth = currentMonthKey();
  const monthTotal = sumBy(expenses.filter((e) => e.date.slice(0, 7) === thisMonth), (e) => e.amount);
  const allTimeTotal = sumBy(expenses, (e) => e.amount);
  const topCategory = topSpendCategory(expenses);

  root.innerHTML = `
    <div class="view-header">
      <div>
        <h2>Expense Manager</h2>
        <p class="muted">Log spends with category and payment method, UPI-style.</p>
      </div>
    </div>

    <div class="stat-row">
      <div class="stat-card"><span class="stat-label">This month</span><span class="stat-value">${formatCurrency(monthTotal)}</span></div>
      <div class="stat-card"><span class="stat-label">All time</span><span class="stat-value">${formatCurrency(allTimeTotal)}</span></div>
      <div class="stat-card"><span class="stat-label">Top category</span><span class="stat-value stat-value--sm">${topCategory}</span></div>
    </div>

    <form id="expense-form" class="card form-grid">
      <div class="field field--wide">
        <label for="exp-title">What was it for?</label>
        <input id="exp-title" type="text" placeholder="e.g. Swiggy order, Auto to college" required />
      </div>
      <div class="field">
        <label for="exp-amount">Amount (₹)</label>
        <input id="exp-amount" type="number" min="1" step="1" required />
      </div>
      <div class="field">
        <label for="exp-category">Category</label>
        <select id="exp-category">${CATEGORIES.map((c) => `<option>${c}</option>`).join("")}</select>
      </div>
      <div class="field">
        <label for="exp-method">Payment method</label>
        <select id="exp-method">${METHODS.map((m) => `<option>${m}</option>`).join("")}</select>
      </div>
      <div class="field">
        <label for="exp-date">Date</label>
        <input id="exp-date" type="date" value="${todayISO()}" required />
      </div>
      <div class="field field--wide">
        <label for="exp-note">Note (optional)</label>
        <input id="exp-note" type="text" placeholder="e.g. split with roommate" />
      </div>
      <button type="submit" class="btn btn--primary">Add expense</button>
    </form>

    <div class="card">
      <div class="list-toolbar">
        <h3 class="card__title">All expenses</h3>
        <div class="list-toolbar__controls">
          <input id="exp-search" type="search" placeholder="Search title or note..." value="${escapeHTML(searchQuery)}" />
          <select id="exp-filter-category">
            <option value="all">All categories</option>
            ${CATEGORIES.map((c) => `<option value="${c}" ${categoryFilter === c ? "selected" : ""}>${c}</option>`).join("")}
          </select>
          <select id="exp-sort">
            <option value="date-desc" ${sortBy === "date-desc" ? "selected" : ""}>Newest first</option>
            <option value="date-asc" ${sortBy === "date-asc" ? "selected" : ""}>Oldest first</option>
            <option value="amount-desc" ${sortBy === "amount-desc" ? "selected" : ""}>Amount: high to low</option>
            <option value="amount-asc" ${sortBy === "amount-asc" ? "selected" : ""}>Amount: low to high</option>
          </select>
        </div>
      </div>
      ${
        list.length === 0
          ? emptyState()
          : `<div class="table-wrap"><table class="data-table">
              <thead><tr><th>Date</th><th>Title</th><th>Category</th><th>Method</th><th>Amount</th><th></th></tr></thead>
              <tbody>
                ${list
                  .map(
                    (e) => `
                  <tr data-id="${e.id}">
                    <td>${formatDate(e.date)}</td>
                    <td>${escapeHTML(e.title)}${e.note ? `<div class="muted small">${escapeHTML(e.note)}</div>` : ""}</td>
                    <td><span class="tag">${escapeHTML(e.category)}</span></td>
                    <td class="muted">${escapeHTML(e.method)}</td>
                    <td class="amount amount--negative">-${formatCurrency(e.amount)}</td>
                    <td><button class="icon-btn delete-expense" title="Delete" data-id="${e.id}">&times;</button></td>
                  </tr>`
                  )
                  .join("")}
              </tbody>
            </table></div>`
      }
    </div>
  `;

  document.getElementById("expense-form").addEventListener("submit", handleAdd);
  root.querySelector(".data-table tbody")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".delete-expense");
    if (btn) handleDelete(btn.dataset.id);
  });

  document.getElementById("exp-search").addEventListener(
    "input",
    debounce((e) => {
      searchQuery = e.target.value;
      render();
    }, 200)
  );
  document.getElementById("exp-filter-category").addEventListener("change", (e) => {
    categoryFilter = e.target.value;
    render();
  });
  document.getElementById("exp-sort").addEventListener("change", (e) => {
    sortBy = e.target.value;
    render();
  });
}

function topSpendCategory(expenses) {
  if (expenses.length === 0) return "-";
  const totals = {};
  expenses.forEach((e) => {
    totals[e.category] = (totals[e.category] || 0) + e.amount;
  });
  const [topCat] = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
  return topCat;
}

function handleAdd(e) {
  e.preventDefault();
  const title = document.getElementById("exp-title").value.trim();
  const amount = parseFloat(document.getElementById("exp-amount").value);
  const category = document.getElementById("exp-category").value;
  const method = document.getElementById("exp-method").value;
  const date = document.getElementById("exp-date").value;
  const note = document.getElementById("exp-note").value.trim();

  if (!title || !amount || amount <= 0) {
    showToast("Enter a title and valid amount.", "error");
    return;
  }

  updateState((state) => {
    state.expenses.push({ id: generateId(), title, amount, category, method, date, note });
    return state;
  });

  checkBudgetAfterAdd(category);
  showToast(`Logged ${formatCurrency(amount)} for ${title}`, "success");
}

function checkBudgetAfterAdd(category) {
  const { expenses, budgets } = getState();
  const limit = budgets[category];
  if (!limit) return;
  const thisMonth = currentMonthKey();
  const spent = sumBy(
    expenses.filter((e) => e.category === category && e.date.slice(0, 7) === thisMonth),
    (e) => e.amount
  );
  if (spent > limit) {
    showToast(`Budget exceeded for ${category}: ${formatCurrency(spent)} of ${formatCurrency(limit)}`, "warning", 4500);
  }
}

function handleDelete(id) {
  updateState((state) => {
    state.expenses = state.expenses.filter((e) => e.id !== id);
    return state;
  });
  showToast("Expense deleted", "info");
}

function emptyState() {
  return `
    <div class="empty-state">
      <span class="material-symbols-outlined empty-state__icon">receipt_long</span>
      <p class="empty-state__title">No expenses match your filters</p>
      <p class="empty-state__subtitle">Try clearing the search or category filter, or add a new expense above.</p>
    </div>`;
}

function initExpenses() {
  subscribe(render);
  render();
}

export { initExpenses, render as renderExpenses, CATEGORIES };
