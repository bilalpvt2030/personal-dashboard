/* =========================================================
   financial-health.js
   Computes a single 0-100 "Financial Health Score" from three
   independent signals, weighted and combined - a small, honest
   heuristic rather than anything claiming real financial advice.

   Concepts demonstrated: pure functions with no DOM/state side
   effects (easy to reason about and could be unit tested in
   isolation), weighted-average math, Math.round/clamp.

   The three signals:
   - Savings rate this month (income vs expenses)
   - Budget adherence (how much of each set budget was overspent)
   - Task completion rate (a simple productivity proxy)
   ========================================================= */

import { sumBy, currentMonthKey } from "./utils.js";

function clamp(n, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

function computeHealthScore({ income, expenses, budgets, tasks }) {
  const thisMonth = currentMonthKey();
  const monthIncome = sumBy(income.filter((i) => i.date.slice(0, 7) === thisMonth), (i) => i.amount);
  const monthExpense = sumBy(expenses.filter((e) => e.date.slice(0, 7) === thisMonth), (e) => e.amount);

  // Savings rate: 0% saved -> 50 pts, 30%+ saved -> 100 pts, overspending -> down to 0.
  const savingsRate = monthIncome > 0 ? (monthIncome - monthExpense) / monthIncome : 0;
  const savingsScore = clamp(50 + savingsRate * 166.7);

  // Budget adherence: average of (1 - overspend ratio) across categories with a budget set.
  const budgetEntries = Object.entries(budgets);
  let budgetScore = 100; // no budgets set yet - don't penalise, just neutral/full marks
  if (budgetEntries.length > 0) {
    const monthExpensesByCat = {};
    expenses
      .filter((e) => e.date.slice(0, 7) === thisMonth)
      .forEach((e) => {
        monthExpensesByCat[e.category] = (monthExpensesByCat[e.category] || 0) + e.amount;
      });
    const perCategoryScores = budgetEntries.map(([cat, limit]) => {
      const spent = monthExpensesByCat[cat] || 0;
      if (spent <= limit) return 100;
      const overRatio = (spent - limit) / limit;
      return clamp(100 - overRatio * 100);
    });
    budgetScore = perCategoryScores.reduce((a, b) => a + b, 0) / perCategoryScores.length;
  }

  // Task completion rate.
  const taskScore = tasks.length > 0 ? (tasks.filter((t) => t.status === "Done").length / tasks.length) * 100 : 100;

  const overall = Math.round(savingsScore * 0.5 + budgetScore * 0.3 + taskScore * 0.2);

  return {
    overall: clamp(overall),
    savingsScore: Math.round(savingsScore),
    budgetScore: Math.round(budgetScore),
    taskScore: Math.round(taskScore),
  };
}

export { computeHealthScore };
