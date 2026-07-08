# Personal Productivity & Finance Dashboard

A single-page dashboard built with vanilla JavaScript (no framework) to practice
JS concepts beyond the internship syllabus - real state management, modular
architecture, and a full CRUD app across nine connected modules.

This is a separate project from the internship demo code (`JavaScript-IP`) -
that one stays untouched. This one is a bigger, self-directed build to show
range: closures, ES modules, array methods, the DOM, events, localStorage,
and a charting library, all working together in one real app.

## What it does

- **Dashboard** - live clock, greeting, animated summary cards (income,
  expenses, balance, open tasks), upcoming tasks, recent activity, goals snapshot.
- **Income Manager** - log income by source, see monthly/all-time totals.
- **Expense Manager** - log expenses with category + UPI/Cash/Card payment
  method, search, filter by category, sort by date or amount.
- **Smart Budget Planner** - set a monthly limit per category, see spent vs
  remaining with a colour-coded progress bar, get warned when you go over.
- **Analytics** - category breakdown (doughnut), income vs expenses (bar),
  6-month trend (line) - built with Chart.js on top of the same state.
- **Task Manager** - title, description, priority, category, deadline,
  status; filter by status; checkbox to mark done.
- **Notes** - quick sticky notes, colour-coded automatically.
- **Goals** - numeric progress bar goals (e.g. "508 / 616 lectures").
- **Calendar** - month view, today/weekend highlighting, click a day to
  attach a short note.
- **Global search** - searches tasks, expenses, and notes from the top bar.
- **Toast notifications** - every action (add/delete/budget exceeded) shows
  a non-blocking toast instead of `alert()`.

All data is stored in the browser via `localStorage` - nothing leaves your
machine, no backend needed.

## How it's built (so you can explain it)

```
personal-dashboard-app/
  index.html          # shell: sidebar nav, top bar, one <section> per view
  css/styles.css       # all styling - one file, CSS custom properties for theme
  js/
    state.js           # single source of truth + localStorage + pub/sub
    utils.js            # formatters, date helpers, animateNumber(), debounce()
    toast.js             # notification system
    income.js            # Income Manager module
    expenses.js           # Expense Manager module
    budget.js              # Budget Planner module
    analytics.js            # Chart.js wiring
    tasks.js                  # Task Manager module
    notes.js                   # Notes module
    goals.js                    # Goals module
    calendar.js                  # Calendar module
    search.js                     # global search
    app.js                         # wires navigation + mounts every module
```

**The core pattern used everywhere:** every module keeps no local copy of
data - it reads from `getState()`, and every change goes through
`updateState()`, which saves to `localStorage` and notifies every module to
re-render (`subscribe()`/`notify()` - a small pub/sub built with an array and
`forEach`). Each module's `render()` rebuilds its section's HTML from
scratch with a template string and re-attaches event listeners - this is the
same idea as the DOM Task Tracker from the internship demo, just applied
across nine modules that all share one state object instead of one.

Switching tabs (`app.js` → `switchView()`) toggles the `hidden` class on the
right `<section>` and re-runs that module's `render()` - each module
guards its own `render()` with `if (root.classList.contains("hidden")) return;`
so hidden tabs don't do unnecessary work.

## Concepts this demonstrates (mapped to what you can point to)

| Concept | Where |
|---|---|
| Closures / module pattern | `state.js` (`subscribers`, `persist`, `notify` are private) |
| Array methods (map/filter/reduce/sort) | almost every module, e.g. `expenses.js` `filteredExpenses()` |
| Destructuring & spread | `const { income, expenses } = getState()`, `[...tasks].sort(...)` |
| Template literals + dynamic DOM | every module's `render()` |
| Event delegation | `income.js`/`expenses.js`/`tasks.js` (`tbody.addEventListener("click", ...)`) |
| localStorage + JSON | `state.js` `loadState()`/`persist()` |
| Debounce | `utils.js`, used in `expenses.js` search box and `search.js` |
| `Date` object arithmetic | `calendar.js` (building the month grid), `utils.js` |
| `requestAnimationFrame` | `utils.js` `animateNumber()` - the dashboard's counting-up cards |
| `setInterval` | `dashboard.js` live clock |
| ES module import/export | every file - `app.js` ties all nine modules together |
| Third-party library integration | `analytics.js` - Chart.js, fed with data shaped by our own array methods |
| XSS-safe rendering | `utils.js` `escapeHTML()` - used anywhere user text is inserted |

## Running it

No build step, no install. Since it uses ES modules (`type="module"` in
`index.html`), open it through a local server rather than double-clicking
the file (same reason as the `14-modules` folder in the internship demo):

- **VS Code**: install the "Live Server" extension, right-click
  `index.html` → "Open with Live Server".
- **Or**, from a terminal in this folder: `python3 -m http.server 8080`,
  then open `http://localhost:8080` in your browser.

## Status / what's genuinely finished vs a good next step

Everything listed above is fully working end-to-end (tested by scripting a
full click-through of every tab, every form, and verifying `localStorage`
after each action). Deliberately **not** included yet, so this stays
something you can explain rather than a black box: drag-and-drop reordering,
push-style reminders/notifications, and a dedicated "weekend planner" widget
- the Calendar and Tasks modules already cover the same underlying need
(deadlines + a clickable calendar), and those three are natural v2 additions
if you want to keep extending this.
