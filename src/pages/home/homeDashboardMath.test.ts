/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {Budget} from '../../Types';
import {makeExpense} from '../../testUtils';
import {calculateBudgetProgress} from '../budget/budgetMath';
import {budgetAlerts, currentMonthExpenses, daysForRange, rangeStats, summarizeMonth} from './homeDashboardMath';

const now = new Date('2026-10-11T12:00:00+05:30');

const budget = (name: string, amount: number, tag: string): Budget => ({
  id: name,
  name,
  amount,
  tagList: [tag],
  modifiedDate: 1,
});

describe('currentMonthExpenses', () => {
  it('keeps only the current calendar month', () => {
    const inMonth = makeExpense({id: 'in', date: Date.parse('2026-10-02T10:00:00+05:30')});
    const out = makeExpense({id: 'out', date: Date.parse('2026-09-30T10:00:00+05:30')});
    expect(currentMonthExpenses([inMonth, out], now).map((expense) => expense.id)).toEqual(['in']);
  });
});

describe('summarizeMonth', () => {
  const expenses = [
    makeExpense({id: 'd1', cost: 80, costType: 'debit', vendor: 'ZOMATO user@ybl', tag: 'food'}),
    makeExpense({id: 'd2', cost: 20, costType: 'debit', vendor: 'Zomato', tag: 'food'}),
    makeExpense({id: 'd3', cost: 50, costType: 'debit', vendor: 'Shell', tag: ''}),
    makeExpense({id: 'c1', cost: 30, costType: 'credit', vendor: 'Refund', tag: 'food'}),
  ];

  it('sums debits as spent and credits as received', () => {
    const summary = summarizeMonth(expenses);
    expect(summary.spent).toBe(150);
    expect(summary.received).toBe(30);
  });

  it('ranks the top debit vendors by display name', () => {
    const summary = summarizeMonth(expenses);
    expect(summary.topVendors.map((vendor) => vendor.label)).toEqual(['zomato', 'shell']);
    expect(summary.topVendors[0].amount).toBe(100);
  });

  it('reports tag share of debit spending', () => {
    const summary = summarizeMonth(expenses);
    expect(summary.tags).toEqual([
      {label: 'food', percent: 67},
      {label: 'Untagged', percent: 33},
    ]);
  });

  it('groups debit share by primary tag only', () => {
    const summary = summarizeMonth([
      makeExpense({id: 'a', cost: 80, costType: 'debit', tags: ['food', 'zomato']}),
      makeExpense({id: 'b', cost: 20, costType: 'debit', tags: ['travel', 'zomato']}),
    ]);
    expect(summary.tags.map((item) => item.label)).toEqual(['food', 'travel']);
    expect(summary.tags.map((item) => item.label)).not.toContain('zomato');
  });

  it('returns empty lists when there is no spending', () => {
    expect(summarizeMonth([])).toEqual({
      spent: 0,
      received: 0,
      topVendors: [],
      tags: [],
    });
  });
});

describe('rangeStats', () => {
  const expenses = [
    makeExpense({id: 'd1', cost: 70, costType: 'debit'}),
    makeExpense({id: 'c1', cost: 20, costType: 'credit'}),
  ];

  it('uses the selected range length for the daily average', () => {
    expect(daysForRange('7d')).toBe(7);
    expect(rangeStats(expenses, 7)).toEqual({
      spent: 70,
      received: 20,
      net: -50,
      count: 2,
      avgPerDay: 10,
    });
  });

  it('treats an empty range as zero and avoids dividing by zero', () => {
    expect(rangeStats([], 0)).toEqual({
      spent: 0,
      received: 0,
      net: 0,
      count: 0,
      avgPerDay: 0,
    });
  });
});

describe('budgetAlerts', () => {
  it('keeps budgets at 80% or more', () => {
    const expenses = [
      makeExpense({cost: 80, costType: 'debit', tag: 'food'}),
      makeExpense({id: 't', cost: 79, costType: 'debit', tag: 'travel'}),
    ];
    const progress = calculateBudgetProgress(expenses, [
      budget('Food', 100, 'food'),
      budget('Travel', 100, 'travel'),
    ]);
    expect(budgetAlerts(progress).map((item) => item.budget.name)).toEqual(['Food']);
  });

  it('is empty when nothing is over the cutoff', () => {
    const progress = calculateBudgetProgress(
      [makeExpense({cost: 10, costType: 'debit', tag: 'food'})],
      [budget('Food', 100, 'food')],
    );
    expect(budgetAlerts(progress)).toEqual([]);
  });
});
