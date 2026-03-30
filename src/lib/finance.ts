import { todayKey } from "@/lib/date";
import { BudgetPlan, FinanceCategory, FinanceRecord, FinanceSummary } from "@/lib/types";

export function getMonthKey(dateKey: string): string {
  return dateKey.slice(0, 7);
}

export function isDateInMonth(dateKey: string, monthKey: string): boolean {
  return getMonthKey(dateKey) === monthKey;
}

export function summarizeFinance(
  records: FinanceRecord[],
  categories: FinanceCategory[],
  budgetPlans: BudgetPlan[],
  baseDate: string = todayKey(),
): FinanceSummary {
  const monthKey = getMonthKey(baseDate);
  const monthBudget = budgetPlans.find((item) => item.monthKey === monthKey)?.monthlyBudget ?? 0;

  let todayExpense = 0;
  let todayIncome = 0;
  let monthExpense = 0;
  let monthIncome = 0;

  const categoryExpenseMap = new Map<string, number>();

  records.forEach((record) => {
    const amount = Math.max(0, record.amount);
    if (record.date === baseDate) {
      if (record.type === "expense") {
        todayExpense += amount;
      } else {
        todayIncome += amount;
      }
    }

    if (!isDateInMonth(record.date, monthKey)) {
      return;
    }

    if (record.type === "expense") {
      monthExpense += amount;
      categoryExpenseMap.set(record.categoryId, (categoryExpenseMap.get(record.categoryId) ?? 0) + amount);
    } else {
      monthIncome += amount;
    }
  });

  const expenseCategories = categories.filter((item) => item.type === "expense");
  let topExpenseCategoryId: string | undefined;
  let topExpense = 0;

  expenseCategories.forEach((category) => {
    const value = categoryExpenseMap.get(category.id) ?? 0;
    if (value > topExpense) {
      topExpense = value;
      topExpenseCategoryId = category.id;
    }
  });

  return {
    todayExpense,
    todayIncome,
    monthExpense,
    monthIncome,
    monthBudget,
    monthRemaining: monthBudget - monthExpense,
    topExpenseCategoryId,
  };
}
