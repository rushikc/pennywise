/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const mockGetDocs = jest.fn();
const whereCalls: Array<{field: string; op: string; value: number}> = [];

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  runTransaction: jest.fn(),
  doc: jest.fn(),
}));

jest.mock('firebase/firestore/lite', () => ({
  getDoc: jest.fn(),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  setDoc: jest.fn(),
  deleteDoc: jest.fn(),
  deleteField: () => ({__deleteField: true}),
  doc: jest.fn(),
  collection: jest.fn(() => 'expense-col'),
  query: (...args: unknown[]) => ({args}),
  where: (field: string, op: string, value: number) => {
    whereCalls.push({field, op, value});
    return {field, op, value};
  },
  getFirestore: jest.fn(() => ({})),
}));

jest.mock('../firebase/firebase-public', () => ({
  firebaseConfig: {projectId: 'demo-project'},
}));

jest.mock('./liveCurrentUid', () => ({
  currentUid: () => 'uid-test',
}));

jest.mock('../components/ErrorHandlers', () => ({
  ErrorHandlers: {handleApiError: jest.fn()},
}));

const cache = new Map<string, Record<string, unknown>>();
const config = new Map<string, unknown>();

jest.mock('./FinanceIndexDB', () => ({
  FinanceIndexDB: {
    getData: jest.fn(async (_store: string, key: string) => {
      if (!config.has(key)) {
        return undefined;
      }
      return {key, value: config.get(key)};
    }),
    addConfig: jest.fn(async (rows: Array<{key: string; value: unknown}>) => {
      rows.forEach((row) => config.set(row.key, row.value));
    }),
    addExpenseList: jest.fn(async (rows: Array<{mailId: string}>) => {
      rows.forEach((row) => cache.set(row.mailId, row));
    }),
    getAllData: jest.fn(async () => Array.from(cache.values())),
    deleteExpense: jest.fn(),
  },
}));

import {LiveExpenseAPI} from './LiveExpenseAPI';
import {EXPENSE_SCHEMA_VERSION, EXPENSE_SCHEMA_VERSION_KEY} from '../utility/constants';
import {getUnixTimestamp} from '../utility/utility';
import {makeExpense} from '../testUtils';

const docSnap = (expense: ReturnType<typeof makeExpense>) => ({
  id: expense.id,
  data: () => expense,
});

describe('LiveExpenseAPI.getExpenseList', () => {
  beforeEach(() => {
    cache.clear();
    config.clear();
    whereCalls.length = 0;
    mockGetDocs.mockReset();
    config.set(EXPENSE_SCHEMA_VERSION_KEY, EXPENSE_SCHEMA_VERSION);
    config.set('expenseLastUpdate', 5_000);
  });

  it('requests rows modified at or after the last sync', async () => {
    mockGetDocs.mockResolvedValue({docs: []});
    await LiveExpenseAPI.getExpenseList();
    expect(whereCalls).toEqual([{field: 'modifiedDate', op: '>=', value: 5_000}]);
  });

  it('drops rows marked delete and does not duplicate a second sync', async () => {
    const kept = makeExpense({id: 'keep', mailId: 'keep', vendor: 'Cafe', modifiedDate: 6_000});
    const removed = makeExpense({
      id: 'gone', mailId: 'gone', vendor: 'Old', operation: 'delete', modifiedDate: 6_000,
    });
    mockGetDocs.mockResolvedValue({docs: [docSnap(kept), docSnap(removed)]});

    const first = await LiveExpenseAPI.getExpenseList();
    expect(first.map((row) => row.mailId)).toEqual(['keep']);

    const second = await LiveExpenseAPI.getExpenseList();
    expect(second.map((row) => row.mailId)).toEqual(['keep']);
    expect(cache.size).toBe(2);
  });

  it('uses the override date for a full reload', async () => {
    const override = getUnixTimestamp('2020-01-01');
    mockGetDocs.mockResolvedValue({docs: []});
    await LiveExpenseAPI.getExpenseList(override);
    expect(whereCalls.at(-1)).toEqual({field: 'modifiedDate', op: '>=', value: override});
  });
});
