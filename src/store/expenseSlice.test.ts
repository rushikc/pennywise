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

  it('updateExpense matches by mailId', () => {
    const existing = makeExpense({id: 'a', mailId: 'mail-1', tag: undefined});
    const store = makeStore();
    store.dispatch(expenseSlice.actions.setExpenseList([existing]));
    store.dispatch(expenseSlice.actions.updateExpense({...existing, tag: 'food'}));
    expect(store.getState().expense.expenseList[0].tag).toBe('food');
  });

  it('addTag dedupes', () => {
    const store = makeStore();
    store.dispatch(expenseSlice.actions.addTag('food'));
    store.dispatch(expenseSlice.actions.addTag('food'));
    expect(store.getState().expense.tagList).toEqual(['food']);
  });
});
