/* =========================================================
   calendar.js
   Month-view calendar for 2026 - highlights today and weekends,
   click a day to attach a short note/event to it.

   Concepts demonstrated: Date object arithmetic (getDay, getDate,
   setMonth), building a 2D-ish grid from a flat array with padding
   cells, template literals inside a loop.
   ========================================================= */

import { getState, updateState, generateId, subscribe } from "./state.js";
import { todayISO, escapeHTML } from "./utils.js";
import { showToast } from "./toast.js";
import { formModal, confirmModal } from "./modal.js";

const EVENT_TYPES = ["Reminder", "Meeting", "Birthday", "Salary Day", "Bill Due", "Weekend Plan", "Task", "Other"];
const EVENT_COLORS = {
  Reminder: "#6366f1",
  Meeting: "#3b82f6",
  Birthday: "#ec4899",
  "Salary Day": "#22c55e",
  "Bill Due": "#ef4444",
  "Weekend Plan": "#f59e0b",
  Task: "#a855f7",
  Other: "#6b7280",
};

let viewYear = new Date().getFullYear();
let viewMonth = new Date().getMonth(); // 0-indexed

function dateKey(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function render() {
  const root = document.getElementById("view-calendar");
  if (!root || root.classList.contains("hidden")) return;

  const { calendarEvents } = getState();
  const today = todayISO();

  const firstDay = new Date(viewYear, viewMonth, 1);
  const startWeekday = firstDay.getDay(); // 0 = Sunday
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const monthName = firstDay.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  root.innerHTML = `
    <div class="view-header">
      <div><h2>Calendar</h2><p class="muted">Click any day to add a quick note or event.</p></div>
      <div class="calendar-nav">
        <button class="btn btn--sm" id="cal-prev">&larr;</button>
        <span class="calendar-nav__label">${monthName}</span>
        <button class="btn btn--sm" id="cal-next">&rarr;</button>
      </div>
    </div>

    <div class="card">
      <div class="calendar-grid calendar-grid--head">
        ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => `<div class="calendar-dow">${d}</div>`).join("")}
      </div>
      <div class="calendar-grid">
        ${cells
          .map((d) => {
            if (d === null) return `<div class="calendar-cell calendar-cell--empty"></div>`;
            const key = dateKey(viewYear, viewMonth, d);
            const weekday = new Date(viewYear, viewMonth, d).getDay();
            const isWeekend = weekday === 0 || weekday === 6;
            const isToday = key === today;
            const events = calendarEvents[key] || [];
            return `
              <div class="calendar-cell ${isWeekend ? "calendar-cell--weekend" : ""} ${isToday ? "calendar-cell--today" : ""}" data-date="${key}">
                <span class="calendar-cell__num">${d}</span>
                ${events
                  .slice(0, 2)
                  .map(
                    (ev) =>
                      `<span class="calendar-event" data-event-id="${ev.id}" data-date="${key}" style="background:${EVENT_COLORS[ev.type] || EVENT_COLORS.Other}" title="${escapeHTML(ev.type || "Other")} - click to remove">${escapeHTML(ev.text)}</span>`
                  )
                  .join("")}
                ${events.length > 2 ? `<span class="calendar-event calendar-event--more">+${events.length - 2} more</span>` : ""}
              </div>`;
          })
          .join("")}
      </div>
    </div>
  `;

  document.getElementById("cal-prev").addEventListener("click", () => {
    viewMonth--;
    if (viewMonth < 0) {
      viewMonth = 11;
      viewYear--;
    }
    render();
  });
  document.getElementById("cal-next").addEventListener("click", () => {
    viewMonth++;
    if (viewMonth > 11) {
      viewMonth = 0;
      viewYear++;
    }
    render();
  });

  root.querySelectorAll(".calendar-cell:not(.calendar-cell--empty)").forEach((cell) =>
    cell.addEventListener("click", (e) => {
      const chip = e.target.closest(".calendar-event:not(.calendar-event--more)");
      if (chip) {
        e.stopPropagation();
        return removeEvent(chip.dataset.date, chip.dataset.eventId);
      }
      addEventForDate(cell.dataset.date);
    })
  );
}

async function addEventForDate(dateKeyStr) {
  const result = await formModal({
    title: `Add event - ${dateKeyStr}`,
    submitLabel: "Add to calendar",
    fields: [
      { name: "type", label: "Type", type: "select", options: EVENT_TYPES, value: "Reminder" },
      { name: "text", label: "What's happening?", type: "text" },
    ],
  });
  if (!result || !result.text.trim()) return;

  updateState((state) => {
    if (!state.calendarEvents[dateKeyStr]) state.calendarEvents[dateKeyStr] = [];
    state.calendarEvents[dateKeyStr].push({ id: generateId(), text: result.text.trim(), type: result.type });
    return state;
  });
  showToast("Added to calendar", "success");
}

async function removeEvent(dateKeyStr, eventId) {
  const ok = await confirmModal({ title: "Remove this calendar event?", confirmLabel: "Remove", danger: true });
  if (!ok) return;

  updateState((state) => {
    state.calendarEvents[dateKeyStr] = (state.calendarEvents[dateKeyStr] || []).filter((ev) => ev.id !== eventId);
    if (state.calendarEvents[dateKeyStr].length === 0) delete state.calendarEvents[dateKeyStr];
    return state;
  });
  showToast("Event removed", "info");
}

function initCalendar() {
  subscribe(render);
  render();
}

export { initCalendar, render as renderCalendar };
