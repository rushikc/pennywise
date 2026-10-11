/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import dayjs from 'dayjs';
import {Budget, BudgetProgress, Expense, MonthYear} from '../../Types';
import {isEmpty} from '../../utility/utility';

export const filterExpensesByMonth = (expenses: Expense[], monthYear: MonthYear): Expense[] => {
  return expenses.filter(expense => {
    const expenseDate = dayjs(new Date(expense.date));
    return expenseDate.year() === monthYear.year && expenseDate.month() === monthYear.month;
  });
};

export const calculateBudgetProgress = (expenses: Expense[], budgets: Budget[]): BudgetProgress[] => {
  return budgets.map(budget => {
    let spent: number;

    if (budget.tagList.includes('All')) {
      spent = expenses
        .filter(expense => expense.costType === 'debit')
        .reduce((sum, expense) => sum + expense.cost, 0);
    } else {
      spent = expenses
        .filter(expense => !isEmpty(expense.tag))
        .filter(expense => expense.costType === 'debit')
        .filter(expense =>
          budget.tagList.some(tag => expense.tag?.toLowerCase() === tag.toLowerCase())
        )
        .reduce((sum, expense) => sum + expense.cost, 0);
    }

    const remaining = Math.max(0, budget.amount - spent);
    const percentage = (spent / budget.amount) * 100;

    return {
      budget,
      spent,
      remaining,
      percentage
    };
  });
};
