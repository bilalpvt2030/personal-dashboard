/* =========================================================
   goals.js
   Goals with numeric progress + a small milestone checklist.

   Concepts demonstrated: nested arrays inside objects (milestones
   inside a goal), Array.prototype.every for "all milestones done",
   percentage clamping.
   ========================================================= */

import { getState, updateState, generateId, subscribe } from "./state.js";
import { escapeHTML, todayISO } from "./utils.js";
import { showToast } from "./toast.js";
import { confirmModal } from "./modal.js";
import { ringSVG } from "./progress-ring.js";

function daysRemaining(deadline) {
  if (!deadline) return null;
  const ms = new Date(deadline) - new Date(todayISO());
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function render() {
  const root = document.getElementById("view-goals");
  if (!root || root.classList.contains("hidden")) return;

  const { goals } = getState();

  root.innerHTML = `
    <div class="view-header">
      <div><h2>Goals</h2><p class="muted">Bigger targets, tracked with a simple progress bar.</p></div>
    </div>

    <form id="goal-form" class="card form-grid">
      <div class="field field--wide">
        <label for="goal-title">Goal</label>
        <input id="goal-title" type="text" placeholder="e.g. Finish the full JS course" required />
      </div>
      <div class="field">
        <label for="goal-target">Target (number)</label>
        <input id="goal-target" type="number" min="1" step="1" placeholder="e.g. 616 (lectures)" required />
      </div>
      <div class="field">
        <label for="goal-current">Current progress</label>
        <input id="goal-current" type="number" min="0" step="1" value="0" />
      </div>
      <div class="field">
        <label for="goal-deadline">Deadline (optional)</label>
        <input id="goal-deadline" type="date" />
      </div>
      <button type="submit" class="btn btn--primary">Add goal</button>
    </form>

    ${
      goals.length === 0
        ? `<div class="card">${emptyState()}</div>`
        : `<div class="goals-grid">${goals
            .map((g) => {
              const pct = Math.min(Math.round((g.current / g.target) * 100), 100);
              const remaining = daysRemaining(g.deadline);
              return `
              <div class="card goal-card" data-id="${g.id}">
                <div class="goal-card__head">
                  <h3>${escapeHTML(g.title)}</h3>
                  <button class="icon-btn delete-goal" data-id="${g.id}" title="Delete">&times;</button>
                </div>
                <div class="goal-card__body">
                  ${ringSVG(pct, 64)}
                  <div class="goal-card__stats">
                    <div class="goal-card__meta">
                      <span>${g.current} / ${g.target}</span>
                      <span>${pct}%${pct >= 100 ? " · Complete" : ""}</span>
                    </div>
                    ${
                      remaining !== null
                        ? `<span class="muted small">${remaining >= 0 ? `${remaining} day${remaining === 1 ? "" : "s"} left` : "Deadline passed"}</span>`
                        : ""
                    }
                  </div>
                </div>
                <div class="goal-card__controls">
                  <button class="btn btn--sm goal-decrement" data-id="${g.id}">-1</button>
                  <button class="btn btn--sm goal-increment" data-id="${g.id}">+1</button>
                </div>
              </div>`;
            })
            .join("")}</div>`
    }
  `;

  document.getElementById("goal-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("goal-title").value.trim();
    const target = parseFloat(document.getElementById("goal-target").value);
    const current = parseFloat(document.getElementById("goal-current").value) || 0;
    const deadline = document.getElementById("goal-deadline").value;
    if (!title || !target) {
      showToast("Enter a title and target.", "error");
      return;
    }
    updateState((state) => {
      state.goals.push({ id: generateId(), title, target, current, deadline, createdAt: new Date().toISOString() });
      return state;
    });
    showToast("Goal added", "success");
  });

  root.querySelectorAll(".delete-goal").forEach((btn) =>
    btn.addEventListener("click", async () => {
      const ok = await confirmModal({ title: "Delete this goal?", confirmLabel: "Delete", danger: true });
      if (!ok) return;
      updateState((state) => {
        state.goals = state.goals.filter((g) => g.id !== btn.dataset.id);
        return state;
      });
      showToast("Goal deleted", "info");
    })
  );

  root.querySelectorAll(".goal-increment").forEach((btn) =>
    btn.addEventListener("click", () => bumpGoal(btn.dataset.id, 1))
  );
  root.querySelectorAll(".goal-decrement").forEach((btn) =>
    btn.addEventListener("click", () => bumpGoal(btn.dataset.id, -1))
  );
}

function bumpGoal(id, delta) {
  updateState((state) => {
    const goal = state.goals.find((g) => g.id === id);
    if (goal) {
      goal.current = Math.max(0, Math.min(goal.target, goal.current + delta));
      if (goal.current === goal.target) showToast(`Goal complete: ${goal.title}`, "success");
    }
    return state;
  });
}

function emptyState() {
  return `
    <div class="empty-state">
      <span class="material-symbols-outlined empty-state__icon">flag</span>
      <p class="empty-state__title">No goals yet</p>
      <p class="empty-state__subtitle">Add a goal above to start tracking progress.</p>
    </div>`;
}

function initGoals() {
  subscribe(render);
  render();
}

export { initGoals, render as renderGoals };
