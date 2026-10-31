/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const mockTxUpdate = jest.fn();
let serverData: Record<string, unknown> = {};

const mockRunTransaction = jest.fn(async (_db: unknown, fn: (tx: {
  get: () => Promise<{exists: () => boolean; id: string; data: () => Record<string, unknown>}>;
  update: (...args: unknown[]) => void;
}) => Promise<unknown>) => {
  const tx = {
    get: async () => ({
      exists: () => true,
      id: 'exp-1',
      data: () => serverData,
    }),
    update: (...args: unknown[]) => mockTxUpdate(...args),
  };
  return fn(tx);
});

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
}));

const deleteFieldSentinel = {__deleteField: true};

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  runTransaction: mockRunTransaction,
  doc: jest.fn((...args: unknown[]) => ({path: args.slice(1).join('/')})),
}));

jest.mock('firebase/firestore/lite', () => ({
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  deleteDoc: jest.fn(),
  deleteField: () => deleteFieldSentinel,
  doc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
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

jest.mock('./FinanceIndexDB', () => ({
  FinanceIndexDB: {
    addExpenseList: jest.fn().mockResolvedValue(undefined),
    getAllData: jest.fn().mockResolvedValue([]),
  },
}));

import {getDocs} from 'firebase/firestore/lite';
import {LiveExpenseAPI} from './LiveExpenseAPI';
import {FinanceIndexDB} from './FinanceIndexDB';
describe('LiveExpenseAPI.updateExpense', () => {
  beforeEach(() => {
    mockTxUpdate.mockClear();
    mockRunTransaction.mockClear();
    serverData = {
      vendor: 'SHOP',
      cost: 10,
      date: 1,
      type: 'upi',
      costType: 'debit',
      tags: ['food'],
      tag: 'food',
    };
  });

  it('keeps server extras and enrichedAt when the primary changes', async () => {
    serverData = {
      ...serverData,
      tags: ['food', 'zomato'],
      tag: 'food',
      enrichedAt: 99,
    };
    const saved = await LiveExpenseAPI.updateExpense('exp-1', {primary: 'travel'});
    expect(saved.tags).toEqual(['travel', 'zomato']);
    expect(saved.enrichedAt).toBe(99);
    const patch = mockTxUpdate.mock.calls[0][1] as Record<string, unknown>;
    expect(patch.tags).toEqual(['travel', 'zomato']);
    expect(patch).not.toHaveProperty('enrichedAt');
  });

  it('removes x while keeping a server-added y', async () => {
    serverData = {
      ...serverData,
      tags: ['food', 'x', 'y'],
    };
    const saved = await LiveExpenseAPI.updateExpense('exp-1', {removeExtras: ['x']});
    expect(saved.tags).toEqual(['food', 'y']);
  });

  it('does not write tags when only the description changes', async () => {
    serverData = {
      ...serverData,
      tags: ['food', 'zomato'],
      description: 'old',
    };
    await LiveExpenseAPI.updateExpense('exp-1', {description: 'new'});
    const patch = mockTxUpdate.mock.calls[0][1] as Record<string, unknown>;
    expect(patch.description).toBe('new');
    expect(patch.tags).toBeUndefined();
  });
});

describe('LiveExpenseAPI.autoTagPastExpenses', () => {
  it('skips a doc that was tagged between the query and the write', async () => {
    mockTxUpdate.mockClear();
    jest.mocked(FinanceIndexDB.getAllData).mockResolvedValueOnce([
      {id: 'V', vendor: 'SHOP', tag: 'food', date: 1},
    ]);
    jest.mocked(getDocs).mockResolvedValueOnce({
      forEach: (fn: (doc: {id: string; data: () => Record<string, unknown>}) => void) => {
        fn({id: 'exp-1', data: () => ({vendor: 'SHOP', tags: [], modifiedDate: 10})});
      },
    } as never);
    serverData = {vendor: 'SHOP', tags: ['travel'], tag: 'travel'};
    const count = await LiveExpenseAPI.autoTagPastExpenses(0);
    expect(count).toBe(0);
    expect(mockTxUpdate).not.toHaveBeenCalled();
  });
});
