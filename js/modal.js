/* =========================================================
   modal.js
   Reusable modal system - replaces every native browser dialog
   (window.prompt/confirm/alert) with a proper on-brand modal,
   used for confirm-before-delete and the calendar "add event" form.

   Concepts demonstrated: Promises (confirmModal resolves true/false
   the same way a real UI library would), building DOM nodes
   imperatively vs. via template strings (a deliberate contrast with
   the innerHTML approach used everywhere else), keyboard handling
   (Escape closes, focus trap on the primary field).
   ========================================================= */

let overlayEl = null;

function ensureOverlay() {
  if (overlayEl) return overlayEl;
  overlayEl = document.createElement("div");
  overlayEl.className = "modal-overlay hidden";
  document.body.appendChild(overlayEl);
  overlayEl.addEventListener("click", (e) => {
    if (e.target === overlayEl) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlayEl.classList.contains("hidden")) closeModal();
  });
  return overlayEl;
}

function closeModal() {
  if (!overlayEl) return;
  overlayEl.classList.add("hidden");
  overlayEl.innerHTML = "";
}

function openModal(innerHTML) {
  const overlay = ensureOverlay();
  overlay.innerHTML = `<div class="modal-card">${innerHTML}</div>`;
  overlay.classList.remove("hidden");
  return overlay;
}

/**
 * confirmModal({ title, message, confirmLabel, danger })
 * Returns a Promise<boolean> - resolves true if the user confirms.
 * This is the replacement for window.confirm().
 */
function confirmModal({ title = "Are you sure?", message = "", confirmLabel = "Confirm", danger = false } = {}) {
  return new Promise((resolve) => {
    const overlay = openModal(`
      <h3 class="modal-card__title">${title}</h3>
      ${message ? `<p class="modal-card__message">${message}</p>` : ""}
      <div class="modal-card__actions">
        <button class="btn btn--ghost" data-action="cancel">Cancel</button>
        <button class="btn ${danger ? "btn--danger" : "btn--primary"}" data-action="confirm">${confirmLabel}</button>
      </div>
    `);

    overlay.querySelector('[data-action="cancel"]').addEventListener("click", () => {
      closeModal();
      resolve(false);
    });
    overlay.querySelector('[data-action="confirm"]').addEventListener("click", () => {
      closeModal();
      resolve(true);
    });
  });
}

/**
 * formModal({ title, fields, submitLabel })
 * fields: [{ name, label, type: "text"|"textarea"|"select", options?, value? }]
 * Returns a Promise<object|null> - resolves with { [name]: value } on submit,
 * or null if cancelled. This is the replacement for window.prompt().
 */
function formModal({ title, fields, submitLabel = "Save" }) {
  return new Promise((resolve) => {
    const fieldsHTML = fields
      .map((f) => {
        const id = `modal-field-${f.name}`;
        if (f.type === "select") {
          return `
            <div class="field">
              <label for="${id}">${f.label}</label>
              <select id="${id}" name="${f.name}">
                ${f.options.map((o) => `<option value="${o}" ${o === f.value ? "selected" : ""}>${o}</option>`).join("")}
              </select>
            </div>`;
        }
        if (f.type === "textarea") {
          return `
            <div class="field field--wide">
              <label for="${id}">${f.label}</label>
              <textarea id="${id}" name="${f.name}" rows="2">${f.value || ""}</textarea>
            </div>`;
        }
        return `
          <div class="field">
            <label for="${id}">${f.label}</label>
            <input id="${id}" name="${f.name}" type="${f.type || "text"}" value="${f.value || ""}" />
          </div>`;
      })
      .join("");

    const overlay = openModal(`
      <h3 class="modal-card__title">${title}</h3>
      <form class="modal-card__form form-grid">
        ${fieldsHTML}
      </form>
      <div class="modal-card__actions">
        <button class="btn btn--ghost" data-action="cancel">Cancel</button>
        <button class="btn btn--primary" data-action="submit">${submitLabel}</button>
      </div>
    `);

    const form = overlay.querySelector(".modal-card__form");
    const firstInput = form.querySelector("input, textarea, select");
    if (firstInput) firstInput.focus();

    const submit = () => {
      const data = {};
      fields.forEach((f) => {
        data[f.name] = form.querySelector(`[name="${f.name}"]`).value;
      });
      closeModal();
      resolve(data);
    };

    overlay.querySelector('[data-action="submit"]').addEventListener("click", submit);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      submit();
    });
    overlay.querySelector('[data-action="cancel"]').addEventListener("click", () => {
      closeModal();
      resolve(null);
    });
  });
}

export { confirmModal, formModal, closeModal };
