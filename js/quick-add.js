/* =========================================================
   quick-add.js
   Top-bar "Quick Add" button - lets you log an Expense, Income,
   Task, or Note from anywhere in the app without switching tabs
   first. Reuses the same state.updateState() every module uses,
   so the target view re-renders itself automatically.

   Concepts demonstrated: a small in-memory "type" switch that
   swaps which fields formModal asks for, composing the existing
   modal system into a new higher-level feature instead of
   duplicating form logic.
   ========================================================= */

import { getState, updateState, generateId } from "./state.js";
import { todayISO } from "./utils.js";
import { showToast } from "./toast.js";
import { formModal } from "./modal.js";
import { switchView } from "./app.js";

const TYPES = {
  Expense: {
    icon: "receipt_long",
    fields: [
      { name: "title", label: "What was it for?", type: "text" },
      { name: "amount", label: "Amount (₹)", type: "number" },
    ],
    view: "expenses",
    save(state, values) {
      state.expenses.push({
        id: generateId(),
        title: values.title,
        amount: parseFloat(values.amount) || 0,
        category: "Others",
        method: "UPI",
        date: todayISO(),
        note: "",
      });
    },
  },
  Income: {
    icon: "payments",
    fields: [
      { name: "source", label: "Source", type: "text" },
      { name: "amount", label: "Amount (₹)", type: "number" },
    ],
    view: "income",
    save(state, values) {
      state.income.push({
        id: generateId(),
        source: values.source,
        amount: parseFloat(values.amount) || 0,
        date: todayISO(),
        note: "",
      });
    },
  },
  Task: {
    icon: "checklist",
    fields: [{ name: "title", label: "Task title", type: "text" }],
    view: "tasks",
    save(state, values) {
      state.tasks.push({
        id: generateId(),
        title: values.title,
        description: "",
        priority: "Medium",
        category: "Personal",
        deadline: todayISO(),
        status: "To Do",
        createdAt: new Date().toISOString(),
      });
    },
  },
  Note: {
    icon: "sticky_note_2",
    fields: [{ name: "text", label: "Note", type: "textarea" }],
    view: "notes",
    save(state, values) {
      state.notes.push({ id: generateId(), text: values.text, color: "#fef08a", pinned: false, createdAt: new Date().toISOString() });
    },
  },
};

async function openQuickAdd() {
  const typeResult = await formModal({
    title: "Quick Add",
    submitLabel: "Continue",
    fields: [{ name: "type", label: "What do you want to add?", type: "select", options: Object.keys(TYPES), value: "Expense" }],
  });
  if (!typeResult) return;

  const config = TYPES[typeResult.type];
  const values = await formModal({
    title: `Quick Add - ${typeResult.type}`,
    submitLabel: "Add",
    fields: config.fields,
  });
  if (!values) return;

  const hasContent = Object.values(values).some((v) => v && v.trim());
  if (!hasContent) {
    showToast("Enter something first.", "error");
    return;
  }

  updateState((state) => {
    config.save(state, values);
    return state;
  });

  showToast(`${typeResult.type} added`, "success");
  switchView(config.view);
}

function initQuickAdd() {
  document.getElementById("quick-add-btn")?.addEventListener("click", openQuickAdd);
}

export { initQuickAdd };
