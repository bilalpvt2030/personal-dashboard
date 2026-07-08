/* =========================================================
   search.js
   Global search across tasks, expenses, and notes from the
   top bar - shows a dropdown of matching results grouped by type.

   Concepts demonstrated: array concatenation with spread,
   debounce, building a result list from multiple data sources.
   ========================================================= */

import { getState } from "./state.js";
import { escapeHTML, formatCurrency, debounce } from "./utils.js";
import { switchView } from "./app.js";

function search(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const { tasks, expenses, notes } = getState();

  const taskResults = tasks
    .filter((t) => t.title.toLowerCase().includes(q))
    .map((t) => ({ type: "Task", label: t.title, sub: t.status, view: "tasks" }));

  const expenseResults = expenses
    .filter((e) => e.title.toLowerCase().includes(q))
    .map((e) => ({ type: "Expense", label: e.title, sub: formatCurrency(e.amount), view: "expenses" }));

  const noteResults = notes
    .filter((n) => n.text.toLowerCase().includes(q))
    .map((n) => ({ type: "Note", label: n.text.slice(0, 40), sub: "", view: "notes" }));

  return [...taskResults, ...expenseResults, ...noteResults].slice(0, 8);
}

function initSearch() {
  const input = document.getElementById("global-search");
  const dropdown = document.getElementById("search-dropdown");
  if (!input || !dropdown) return;

  const runSearch = debounce(() => {
    const results = search(input.value);
    if (results.length === 0) {
      dropdown.classList.add("hidden");
      dropdown.innerHTML = "";
      return;
    }
    dropdown.innerHTML = results
      .map(
        (r, i) => `
        <div class="search-result" data-view="${r.view}" data-idx="${i}">
          <span class="tag">${r.type}</span>
          <span class="search-result__label">${escapeHTML(r.label)}</span>
          <span class="muted small">${escapeHTML(r.sub)}</span>
        </div>`
      )
      .join("");
    dropdown.classList.remove("hidden");

    dropdown.querySelectorAll(".search-result").forEach((el) =>
      el.addEventListener("click", () => {
        switchView(el.dataset.view);
        dropdown.classList.add("hidden");
        input.value = "";
      })
    );
  }, 180);

  input.addEventListener("input", runSearch);
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".global-search-wrap")) dropdown.classList.add("hidden");
  });
}

export { initSearch };
