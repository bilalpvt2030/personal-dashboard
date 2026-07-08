/* =========================================================
   tasks.js
   Smart Task Manager: title, description, priority, status,
   deadline, category, completion %. Full CRUD + filter/sort.

   Concepts demonstrated: enums-as-arrays, Array.prototype.find,
   optional chaining, computed object keys, switch statement for
   priority styling.
   ========================================================= */

import { getState, updateState, generateId, subscribe } from "./state.js";
import { formatDate, todayISO, escapeHTML } from "./utils.js";
import { showToast } from "./toast.js";

const PRIORITIES = ["Low", "Medium", "High"];
const STATUSES = ["To Do", "In Progress", "Done"];
const CATEGORIES = ["Internship", "College", "Personal", "Health", "Errands"];

let statusFilter = "all";

function priorityClass(p) {
  switch (p) {
    case "High":
      return "priority--high";
    case "Medium":
      return "priority--medium";
    default:
      return "priority--low";
  }
}

function render() {
  const root = document.getElementById("view-tasks");
  if (!root || root.classList.contains("hidden")) return;

  const { tasks } = getState();
  const visible = statusFilter === "all" ? tasks : tasks.filter((t) => t.status === statusFilter);
  const sorted = [...visible].sort((a, b) => (a.deadline || "9999").localeCompare(b.deadline || "9999"));

  const doneCount = tasks.filter((t) => t.status === "Done").length;

  root.innerHTML = `
    <div class="view-header">
      <div>
        <h2>Task Manager</h2>
        <p class="muted">${doneCount} of ${tasks.length} tasks done</p>
      </div>
    </div>

    <form id="task-form" class="card form-grid">
      <div class="field field--wide">
        <label for="task-title">Title</label>
        <input id="task-title" type="text" placeholder="e.g. Finish Module 12 async exercises" required />
      </div>
      <div class="field field--wide">
        <label for="task-desc">Description (optional)</label>
        <input id="task-desc" type="text" placeholder="Any extra detail" />
      </div>
      <div class="field">
        <label for="task-priority">Priority</label>
        <select id="task-priority">${PRIORITIES.map((p) => `<option>${p}</option>`).join("")}</select>
      </div>
      <div class="field">
        <label for="task-category">Category</label>
        <select id="task-category">${CATEGORIES.map((c) => `<option>${c}</option>`).join("")}</select>
      </div>
      <div class="field">
        <label for="task-deadline">Deadline</label>
        <input id="task-deadline" type="date" value="${todayISO()}" />
      </div>
      <button type="submit" class="btn btn--primary">Add task</button>
    </form>

    <div class="card">
      <div class="list-toolbar">
        <h3 class="card__title">Tasks</h3>
        <div class="filter-pills">
          ${["all", ...STATUSES]
            .map(
              (s) => `<button class="pill ${statusFilter === s ? "pill--active" : ""}" data-status="${s}">${s === "all" ? "All" : s}</button>`
            )
            .join("")}
        </div>
      </div>
      ${
        sorted.length === 0
          ? emptyState()
          : `<div class="task-list">
              ${sorted
                .map(
                  (t) => `
                <div class="task-item ${t.status === "Done" ? "task-item--done" : ""}" data-id="${t.id}">
                  <input type="checkbox" class="task-toggle" data-id="${t.id}" ${t.status === "Done" ? "checked" : ""} />
                  <div class="task-item__body">
                    <div class="task-item__title-row">
                      <span class="task-item__title">${escapeHTML(t.title)}</span>
                      <span class="badge ${priorityClass(t.priority)}">${t.priority}</span>
                    </div>
                    ${t.description ? `<p class="muted small">${escapeHTML(t.description)}</p>` : ""}
                    <div class="task-item__meta">
                      <span class="tag">${escapeHTML(t.category)}</span>
                      <span class="muted small">Due ${formatDate(t.deadline)}</span>
                      <select class="task-status-select" data-id="${t.id}">
                        ${STATUSES.map((s) => `<option ${s === t.status ? "selected" : ""}>${s}</option>`).join("")}
                      </select>
                    </div>
                  </div>
                  <button class="icon-btn delete-task" data-id="${t.id}" title="Delete">&times;</button>
                </div>`
                )
                .join("")}
            </div>`
      }
    </div>
  `;

  document.getElementById("task-form").addEventListener("submit", handleAdd);

  root.querySelectorAll(".pill").forEach((btn) =>
    btn.addEventListener("click", () => {
      statusFilter = btn.dataset.status;
      render();
    })
  );

  root.querySelector(".task-list")?.addEventListener("click", (e) => {
    const del = e.target.closest(".delete-task");
    if (del) handleDelete(del.dataset.id);
  });

  root.querySelectorAll(".task-toggle").forEach((cb) =>
    cb.addEventListener("change", () => toggleDone(cb.dataset.id, cb.checked))
  );

  root.querySelectorAll(".task-status-select").forEach((sel) =>
    sel.addEventListener("change", () => setStatus(sel.dataset.id, sel.value))
  );
}

function handleAdd(e) {
  e.preventDefault();
  const title = document.getElementById("task-title").value.trim();
  const description = document.getElementById("task-desc").value.trim();
  const priority = document.getElementById("task-priority").value;
  const category = document.getElementById("task-category").value;
  const deadline = document.getElementById("task-deadline").value;

  if (!title) {
    showToast("Task needs a title.", "error");
    return;
  }

  updateState((state) => {
    state.tasks.push({
      id: generateId(),
      title,
      description,
      priority,
      category,
      deadline,
      status: "To Do",
      createdAt: new Date().toISOString(),
    });
    return state;
  });

  showToast(`Task added: ${title}`, "success");
}

function toggleDone(id, checked) {
  updateState((state) => {
    const task = state.tasks.find((t) => t.id === id);
    if (task) task.status = checked ? "Done" : "To Do";
    return state;
  });
}

function setStatus(id, status) {
  updateState((state) => {
    const task = state.tasks.find((t) => t.id === id);
    if (task) task.status = status;
    return state;
  });
}

function handleDelete(id) {
  updateState((state) => {
    state.tasks = state.tasks.filter((t) => t.id !== id);
    return state;
  });
  showToast("Task deleted", "info");
}

function emptyState() {
  return `
    <div class="empty-state">
      <span class="material-symbols-outlined empty-state__icon">checklist</span>
      <p class="empty-state__title">No tasks here</p>
      <p class="empty-state__subtitle">Add a task above, or clear your filter.</p>
    </div>`;
}

function initTasks() {
  subscribe(render);
  render();
}

export { initTasks, render as renderTasks };
