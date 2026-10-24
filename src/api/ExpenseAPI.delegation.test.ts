/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const mockLiveGetExpenseList = jest.fn().mockResolvedValue([]);
const mockDemoGetExpenseList = jest.fn().mockResolvedValue([]);
const mockLiveAddExpense = jest.fn();
const mockDemoAddExpense = jest.fn();

jest.mock('./LiveExpenseAPI', () => ({
  LiveExpenseAPI: {
    getExpenseList: (...args: unknown[]) => mockLiveGetExpenseList(...args),
    addExpense: (...args: unknown[]) => mockLiveAddExpense(...args),
    getTagList: jest.fn(),
    getBudgetList: jest.fn(),
    getVendorTagList: jest.fn(),
    getDarkModeConfig: jest.fn(),
    processData: jest.fn(),
  },
}));

jest.mock('./DemoExpenseAPI', () => ({
  DemoExpenseAPI: {
    getExpenseList: (...args: unknown[]) => mockDemoGetExpenseList(...args),
    addExpense: (...args: unknown[]) => mockDemoAddExpense(...args),
    getTagList: jest.fn(),
    getBudgetList: jest.fn(),
    getVendorTagList: jest.fn(),
    getDarkModeConfig: jest.fn(),
    processData: jest.fn(),
  },
}));

import {setDataMode} from '../pages/login/dataMode';
import {ExpenseAPI} from './ExpenseAPI';
import {makeExpense} from '../testUtils';

describe('ExpenseAPI delegation', () => {
  beforeEach(() => {
    mockLiveGetExpenseList.mockClear();
    mockDemoGetExpenseList.mockClear();
    mockLiveAddExpense.mockClear();
    mockDemoAddExpense.mockClear();
  });

  it('calls the demo layer and never the live layer in demo mode', async () => {
    setDataMode('demo');
    await ExpenseAPI.getExpenseList();
    await ExpenseAPI.addExpense(makeExpense());
    expect(mockDemoGetExpenseList).toHaveBeenCalledTimes(1);
    expect(mockDemoAddExpense).toHaveBeenCalledTimes(1);
    expect(mockLiveGetExpenseList).not.toHaveBeenCalled();
    expect(mockLiveAddExpense).not.toHaveBeenCalled();
  });

  it('calls the live layer in live mode', async () => {
    setDataMode('live');
    await ExpenseAPI.getExpenseList();
    expect(mockLiveGetExpenseList).toHaveBeenCalledTimes(1);
    expect(mockDemoGetExpenseList).not.toHaveBeenCalled();
  });
});
