/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {configureStore} from '@reduxjs/toolkit';
import expenseReducer, {expenseSlice} from './expenseSlice';
import {makeExpense} from '../testUtils';

jest.mock('../api/FinanceIndexDB', () => ({
  FinanceIndexDB: {addVendorTag: jest.fn()},
}));

const makeStore = () => configureStore({reducer: {expense: expenseReducer}});

describe('expenseSlice', () => {
  it('mergeSaveExpense removes originals and appends the merged expense', () => {
    const a = makeExpense({id: 'a', mailId: 'ma'});
    const b = makeExpense({id: 'b', mailId: 'mb', vendor: 'OTHER'});
    const merged = makeExpense({id: 'm', mailId: 'mm', vendor: 'SHOP'});
    const store = makeStore();
    store.dispatch(expenseSlice.actions.setExpenseList([a, b]));
    store.dispatch(expenseSlice.actions.mergeSaveExpense({
      originalExpenses: [a, b],
      mergedExpense: merged,
    }));
    expect(store.getState().expense.expenseList.map((e) => e.id)).toEqual(['m']);
  });

  it('deleteExpense removes the matching mailId', () => {
    const keep = makeExpense({id: 'keep', mailId: 'mail-keep'});
    const drop = makeExpense({id: 'drop', mailId: 'mail-drop'});
    const store = makeStore();
    store.dispatch(expenseSlice.actions.setExpenseList([keep, drop]));
    store.dispatch(expenseSlice.actions.deleteExpense(drop));
    expect(store.getState().expense.expenseList.map((e) => e.mailId)).toEqual(['mail-keep']);
  });

  it('updateExpense matches by mailId', () => {
    const existing = makeExpense({id: 'a', mailId: 'mail-1', tag: undefined, enrichedAt: 9});
    const store = makeStore();
    store.dispatch(expenseSlice.actions.setExpenseList([existing]));
    store.dispatch(expenseSlice.actions.updateExpense({
      ...existing,
      tags: ['food', 'zomato'],
      tag: 'food',
      description: 'note',
      enrichedAt: 9,
      modifiedDate: 42,
    }));
    const updated = store.getState().expense.expenseList[0];
    expect(updated.tags).toEqual(['food', 'zomato']);
    expect(updated.tag).toBe('food');
    expect(updated.description).toBe('note');
    expect(updated.enrichedAt).toBe(9);
    expect(updated.modifiedDate).toBe(42);
  });

  it('addTag dedupes and restores from legacy', () => {
    const store = makeStore();
    store.dispatch(expenseSlice.actions.setLegacyTagList(['food']));
    store.dispatch(expenseSlice.actions.addTag('food'));
    store.dispatch(expenseSlice.actions.addTag('food'));
    expect(store.getState().expense.tagList).toEqual(['food']);
    expect(store.getState().expense.legacyTagList).toEqual([]);
  });

  it('deleteTag moves the name to legacyTagList', () => {
    const store = makeStore();
    store.dispatch(expenseSlice.actions.setTagList(['food', 'rent']));
    store.dispatch(expenseSlice.actions.deleteTag('food'));
    expect(store.getState().expense.tagList).toEqual(['rent']);
    expect(store.getState().expense.legacyTagList).toEqual(['food']);
  });
});
