/* =========================================================
   notes.js
   Sticky notes grid - quick capture, colour-coded, searchable.

   Concepts demonstrated: array of small colour options picked
   with modulo, CSS custom property set from JS, contenteditable
   alternative avoided in favour of a plain textarea (simpler to
   reason about for a learning project).
   ========================================================= */

import { getState, updateState, generateId, subscribe } from "./state.js";
import { escapeHTML } from "./utils.js";
import { showToast } from "./toast.js";
import { confirmModal } from "./modal.js";

const COLORS = ["#fef08a", "#bbf7d0", "#bfdbfe", "#fecaca", "#e9d5ff", "#fed7aa"];

function render() {
  const root = document.getElementById("view-notes");
  if (!root || root.classList.contains("hidden")) return;

  const { notes } = getState();
  // Pinned notes float to the top, newest-first within each group.
  const sorted = [...notes].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.createdAt.localeCompare(a.createdAt));

  root.innerHTML = `
    <div class="view-header">
      <div><h2>Notes</h2><p class="muted">Quick sticky notes for anything worth remembering.</p></div>
    </div>

    <form id="note-form" class="card note-form">
      <textarea id="note-text" placeholder="Write a quick note..." rows="2" required></textarea>
      <button type="submit" class="btn btn--primary">Add note</button>
    </form>

    ${
      sorted.length === 0
        ? `<div class="card">${emptyState()}</div>`
        : `<div class="notes-grid">
            ${sorted
              .map(
                (n) => `
              <div class="note-card ${n.pinned ? "note-card--pinned" : ""}" style="background:${n.color}" data-id="${n.id}">
                ${n.pinned ? `<span class="material-symbols-outlined note-card__pin-icon">push_pin</span>` : ""}
                <p class="note-card__text">${escapeHTML(n.text)}</p>
                <div class="note-card__actions">
                  <button class="icon-btn pin-note" data-id="${n.id}" title="${n.pinned ? "Unpin" : "Pin"}">
                    <span class="material-symbols-outlined" style="font-size:16px">push_pin</span>
                  </button>
                  <button class="icon-btn delete-note" data-id="${n.id}" title="Delete">&times;</button>
                </div>
              </div>`
              )
              .join("")}
          </div>`
    }
  `;

  document.getElementById("note-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const textarea = document.getElementById("note-text");
    const text = textarea.value.trim();
    if (!text) return;

    updateState((state) => {
      const color = COLORS[state.notes.length % COLORS.length];
      state.notes.push({ id: generateId(), text, color, pinned: false, createdAt: new Date().toISOString() });
      return state;
    });
    showToast("Note added", "success");
  });

  root.querySelectorAll(".pin-note").forEach((btn) =>
    btn.addEventListener("click", () => {
      updateState((state) => {
        const note = state.notes.find((n) => n.id === btn.dataset.id);
        if (note) note.pinned = !note.pinned;
        return state;
      });
    })
  );

  root.querySelectorAll(".delete-note").forEach((btn) =>
    btn.addEventListener("click", async () => {
      const ok = await confirmModal({
        title: "Delete this note?",
        confirmLabel: "Delete",
        danger: true,
      });
      if (!ok) return;

      updateState((state) => {
        state.notes = state.notes.filter((n) => n.id !== btn.dataset.id);
        return state;
      });
      showToast("Note deleted", "info");
    })
  );
}

function emptyState() {
  return `
    <div class="empty-state">
      <span class="material-symbols-outlined empty-state__icon">sticky_note_2</span>
      <p class="empty-state__title">No notes yet</p>
      <p class="empty-state__subtitle">Jot something down above.</p>
    </div>`;
}

function initNotes() {
  subscribe(render);
  render();
}

export { initNotes, render as renderNotes };
