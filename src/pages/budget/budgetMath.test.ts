/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {calculateBudgetProgress, filterExpensesByMonth} from './budgetMath';
import {makeExpense} from '../../testUtils';
import {Budget} from '../../Types';

const sept = {month: 8, year: 2026, label: 'Sep 2026', value: '2026-09'};

const foodBudget = (amount = 1000): Budget => ({
  id: 'b1',
  name: 'Food',
  amount,
  tagList: ['food'],
  modifiedDate: 1,
});

describe('filterExpensesByMonth', () => {
  it('keeps expenses in the selected month', () => {
    const inMonth = makeExpense({id: 'in', date: Date.parse('2026-09-10T12:00:00+05:30')});
    const out = makeExpense({id: 'out', date: Date.parse('2026-08-10T12:00:00+05:30')});
    expect(filterExpensesByMonth([inMonth, out], sept).map((e) => e.id)).toEqual(['in']);
  });
});

describe('calculateBudgetProgress', () => {
  it('sums only debits for an All budget', () => {
    const [progress] = calculateBudgetProgress([
      makeExpense({cost: 80, costType: 'debit', tag: 'food'}),
      makeExpense({id: 'c', cost: 20, costType: 'credit', tag: 'food'}),
    ], [{...foodBudget(), tagList: ['All']}]);
    expect(progress.spent).toBe(80);
  });

  it('matches tags case-insensitively and ignores credits and untagged', () => {
    const [progress] = calculateBudgetProgress([
      makeExpense({cost: 50, costType: 'debit', tag: 'Food'}),
      makeExpense({id: 'c', cost: 10, costType: 'credit', tag: 'food'}),
      makeExpense({id: 'u', cost: 40, costType: 'debit', tag: undefined}),
    ], [foodBudget()]);
    expect(progress.spent).toBe(50);
  });

  it('matches the primary tag only, including legacy primaries', () => {
    const [progress] = calculateBudgetProgress([
      makeExpense({id: 'a', cost: 20, costType: 'debit', tags: ['food', 'zomato']}),
      makeExpense({id: 'b', cost: 15, costType: 'debit', tags: ['tech']}),
      makeExpense({id: 'c', cost: 40, costType: 'debit', tags: ['rent', 'food']}),
    ], [{...foodBudget(), tagList: ['food', 'tech']}]);
    expect(progress.spent).toBe(35);
  });

  it('floors remaining at 0 and allows percentage over 100', () => {
    const [progress] = calculateBudgetProgress([
      makeExpense({cost: 150, costType: 'debit', tag: 'food'}),
    ], [foodBudget(100)]);
    expect(progress.remaining).toBe(0);
    expect(progress.percentage).toBe(150);
  });
});
