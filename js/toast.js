/* =========================================================
   toast.js
   Small toast/notification system - replaces alert() with a
   non-blocking UI notification (used for "added", "deleted",
   "budget exceeded" etc across every module).

   Concepts demonstrated: DOM creation, setTimeout, classList,
   event delegation is NOT needed here since each toast wires
   its own listener - shown deliberately as the simpler approach.
   ========================================================= */

let container = null;

function ensureContainer() {
  if (container) return container;
  container = document.createElement("div");
  container.className = "toast-container";
  document.body.appendChild(container);
  return container;
}

// type: "success" | "error" | "warning" | "info"
function showToast(message, type = "success", duration = 3200) {
  const root = ensureContainer();
  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;

  const icons = { success: "check_circle", error: "error", warning: "warning", info: "info" };
  toast.innerHTML = `
    <span class="toast__icon material-symbols-outlined">${icons[type] || icons.info}</span>
    <span class="toast__msg"></span>
    <button class="toast__close" aria-label="Dismiss">&times;</button>
  `;
  toast.querySelector(".toast__msg").textContent = message;

  const remove = () => {
    toast.classList.add("toast--out");
    setTimeout(() => toast.remove(), 200);
  };

  toast.querySelector(".toast__close").addEventListener("click", remove);
  root.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("toast--in"));

  setTimeout(remove, duration);
}

export { showToast };
