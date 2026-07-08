/* =========================================================
   state.js
   Central state management + localStorage persistence.

   Concepts demonstrated: JSON.stringify/parse, localStorage API,
   closures, object shorthand, spread operator, the module pattern
   (everything below is private except what we explicitly export),
   a tiny pub/sub system built with an array + forEach.
   ========================================================= */

const STORAGE_KEY = "pd_dashboard_state_v1";

// Default shape of the app's data. If nothing is in localStorage yet,
// we start from this.
function defaultState() {
  return {
    income: [],       // {id, source, amount, date, note}
    expenses: [],      // {id, title, amount, category, method, date, time, note}
    budgets: {},        // { [category]: monthlyLimit }
    tasks: [],         // {id, title, description, priority, status, deadline, category, completion, createdAt}
    notes: [],          // {id, text, color, createdAt}
    goals: [],          // {id, title, target, current, deadline, milestones: [{id,text,done}]}
    calendarEvents: {}, // { "YYYY-MM-DD": [{id, text}] }
    meta: {
      createdAt: new Date().toISOString(),
    },
  };
}

// Load from localStorage, falling back to defaults. Wrapped in try/catch
// because localStorage can throw (private browsing, corrupted JSON, etc).
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    // Merge with defaults so new fields added later don't break old saves.
    return { ...defaultState(), ...parsed };
  } catch (err) {
    console.error("Failed to load state, resetting.", err);
    return defaultState();
  }
}

let state = loadState();

// Subscribers are just functions we call after every change ("pub/sub").
// This is how every module re-renders itself when data changes, without
// modules needing to know about each other directly.
const subscribers = [];

function subscribe(fn) {
  subscribers.push(fn);
  return () => {
    const idx = subscribers.indexOf(fn);
    if (idx > -1) subscribers.splice(idx, 1);
  };
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function notify() {
  subscribers.forEach((fn) => fn(state));
}

// Every mutation in the app goes through this single function.
// `updater` receives the current state and should return the new state
// (or mutate and return it - kept simple on purpose for a learning project).
function updateState(updater) {
  state = updater(state) || state;
  persist();
  notify();
}

function getState() {
  return state;
}

// Small id generator - avoids pulling in a uuid library for a demo project.
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export { getState, updateState, subscribe, generateId, STORAGE_KEY };
