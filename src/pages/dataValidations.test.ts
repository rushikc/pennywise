/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

jest.mock('../api/ExpenseAPI', () => ({ExpenseAPI: {}}));
jest.mock('../store/expenseActions', () => ({
  setBudgetList: jest.fn(),
  setExpenseState: jest.fn(),
  setTagList: jest.fn(),
}));

import {filterExpensesByDate, groupExpenses, searchExpenses, DateRange} from './dataValidations';
import {makeExpense} from '../testUtils';
import dayjs from 'dayjs';

describe('groupExpenses', () => {
  it('returns empty object for empty input', () => {
    expect(groupExpenses([], 'days')).toEqual({});
  });

  it('groups by calendar day', () => {
    const date = Date.parse('2026-09-01T10:00:00+05:30');
    const grouped = groupExpenses([makeExpense({date})], 'days');
    expect(Object.keys(grouped)[0]).toBe('2026-09-01');
  });

  it('uses lowercase vendor keys and original labels', () => {
    const grouped = groupExpenses([makeExpense({vendor: 'Netflix'})], 'vendor');
    expect(grouped.netflix.groupLabel).toBe('Netflix');
  });

  it('buckets cost at 100, 500, and 1000 boundaries', () => {
    const grouped = groupExpenses([
      makeExpense({id: 'a', cost: 100}),
      makeExpense({id: 'b', cost: 101}),
      makeExpense({id: 'c', cost: 500}),
      makeExpense({id: 'd', cost: 501}),
      makeExpense({id: 'e', cost: 1000}),
      makeExpense({id: 'f', cost: 1001}),
    ], 'cost');
    expect(grouped.range_0_100.expenses).toHaveLength(1);
    expect(grouped.range_100_500.expenses).toHaveLength(2);
    expect(grouped.range_500_1000.expenses).toHaveLength(2);
    expect(grouped.range_1000_plus.expenses).toHaveLength(1);
  });

  it('groups missing tags as Untagged', () => {
    const grouped = groupExpenses([makeExpense({tag: undefined})], 'tags');
    expect(grouped.untagged.groupLabel).toBe('Untagged');
  });

  it('groups by primary tag and ignores extras', () => {
    const grouped = groupExpenses([
      makeExpense({id: 'a', tags: ['food', 'zomato']}),
      makeExpense({id: 'b', tags: ['food', 'swiggy']}),
    ], 'tags');
    expect(grouped.food.expenses).toHaveLength(2);
    expect(grouped.food.groupLabel).toBe('food');
  });

  it('groups mixed-case listed primaries together and keeps mystery unlisted', () => {
    const grouped = groupExpenses([
      makeExpense({id: 'a', tags: ['Food']}),
      makeExpense({id: 'b', tags: ['food']}),
      makeExpense({id: 'c', tags: ['mystery']}),
    ], 'tags', {tagList: ['food'], legacyTagList: []});
    expect(grouped.food.expenses).toHaveLength(2);
    expect(grouped.food.groupLabel).toBe('food');
    expect(grouped.mystery.groupLabel).toBe('mystery');
    expect(grouped.mystery.unlisted).toBe(true);
  });

  it('subtracts debits and adds credits in totals', () => {
    const grouped = groupExpenses([
      makeExpense({id: 'd', cost: 80, costType: 'debit', vendor: 'A'}),
      makeExpense({id: 'c', cost: 20, costType: 'credit', vendor: 'A'}),
    ], 'vendor');
    expect(grouped.a.totalAmount).toBe(-60);
  });
});

describe('filterExpensesByDate', () => {
  it('returns empty list for empty input', () => {
    expect(filterExpensesByDate([], '7d')).toEqual([]);
  });

  it('keeps expenses on the same calendar day as the start of the range', () => {
    const startOfWindow = dayjs().subtract(1, 'day').valueOf();
    const kept = filterExpensesByDate([makeExpense({date: startOfWindow})], '1d');
    expect(kept).toHaveLength(1);
  });

  it('defaults unknown ranges to 7 days', () => {
    const old = makeExpense({id: 'old', date: dayjs().subtract(20, 'day').valueOf()});
    const recent = makeExpense({id: 'new', date: Date.now()});
    const kept = filterExpensesByDate([old, recent], 'nope' as DateRange);
    expect(kept.map((e) => e.id)).toEqual(['new']);
  });
});

describe('searchExpenses', () => {
  const list = [
    makeExpense({id: '1', vendor: 'Netflix', cost: 199, tag: 'entertainment'}),
    makeExpense({id: '2', vendor: 'Rent', cost: 20000, tag: undefined}),
    makeExpense({
      id: '3',
      vendor: 'Zomato',
      cost: 12,
      tags: ['food', 'online food ordering'],
      description: 'birthday dinner',
    }),
  ];

  it('returns all expenses for a blank term', () => {
    expect(searchExpenses(list, '   ')).toHaveLength(3);
  });

  it('matches vendor, tag, and cost string case-insensitively', () => {
    expect(searchExpenses(list, 'NET').map((e) => e.id)).toEqual(['1']);
    expect(searchExpenses(list, 'enter').map((e) => e.id)).toEqual(['1']);
    expect(searchExpenses(list, '20000').map((e) => e.id)).toEqual(['2']);
  });

  it('matches extra tags and description', () => {
    expect(searchExpenses(list, 'online food').map((e) => e.id)).toEqual(['3']);
    expect(searchExpenses(list, 'birthday').map((e) => e.id)).toEqual(['3']);
  });

  it('does not match missing tags on tag search', () => {
    expect(searchExpenses(list, 'untagged')).toHaveLength(0);
  });
});
