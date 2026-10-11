/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {Expense} from '../../../Types';

export const signedExpenseTotal = (expenses: Pick<Expense, 'cost' | 'costType'>[]): number => {
  return expenses.reduce((sum, exp) => {
    return sum + (exp.costType === 'debit' ? -exp.cost : exp.cost);
  }, 0);
};

export const mergedCostAndType = (total: number): {cost: number; costType: Expense['costType']} => {
  return {
    cost: Math.abs(total),
    costType: total < 0 ? 'debit' : 'credit',
  };
};
