/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {Expense} from './Types';

export const makeExpense = (overrides: Partial<Expense> = {}): Expense => ({
  id: 'exp-1',
  mailId: 'mail-1',
  cost: 100,
  costType: 'debit',
  date: Date.now(),
  modifiedDate: Date.now(),
  user: 'rushi',
  type: 'upi',
  vendor: 'SHOP',
  operation: 'add',
  ...overrides,
});
