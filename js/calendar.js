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
                ${events.slice(0, 2).map((ev) => `<span class="calendar-event">${escapeHTML(ev.text)}</span>`).join("")}
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
    cell.addEventListener("click", () => promptAddEvent(cell.dataset.date))
  );
}

function promptAddEvent(dateKeyStr) {
  const text = window.prompt("Add a short note for this day:");
  if (!text || !text.trim()) return;

  updateState((state) => {
    if (!state.calendarEvents[dateKeyStr]) state.calendarEvents[dateKeyStr] = [];
    state.calendarEvents[dateKeyStr].push({ id: generateId(), text: text.trim() });
    return state;
  });
  showToast("Added to calendar", "success");
}

function initCalendar() {
  subscribe(render);
  render();
}

export { initCalendar, render as renderCalendar };
