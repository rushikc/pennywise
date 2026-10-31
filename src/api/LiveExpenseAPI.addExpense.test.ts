/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const mockSetDoc = jest.fn().mockResolvedValue(undefined);
const mockDoc = jest.fn((...args: unknown[]) => ({
  id: args[args.length - 1],
  path: args.slice(1).join('/'),
}));

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
}));

jest.mock('firebase/firestore/lite', () => ({
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  deleteDoc: jest.fn(),
  doc: (...args: unknown[]) => mockDoc(...args),
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
    addVendorTag: jest.fn(),
    addConfig: jest.fn(),
    getData: jest.fn(),
    getAllData: jest.fn(),
    deleteExpense: jest.fn(),
  },
}));

import {LiveExpenseAPI} from './LiveExpenseAPI';
import {FinanceIndexDB} from './FinanceIndexDB';
import {makeExpense} from '../testUtils';

describe('LiveExpenseAPI.addExpense', () => {
  beforeEach(() => {
    mockSetDoc.mockClear();
    mockDoc.mockClear();
    jest.mocked(FinanceIndexDB.addExpenseList).mockClear();
  });

  it('updates the existing Firestore doc when expense.id is set', async () => {
    const gmailId = '18c4gmailMessageId';
    const saved = await LiveExpenseAPI.addExpense(makeExpense({
      id: gmailId,
      mailId: gmailId,
      vendor: 'ZOMATO',
    }), 'update');

    expect(saved.id).toBe(gmailId);
    expect(mockDoc).toHaveBeenCalledWith(
      expect.anything(),
      'users',
      'uid-test',
      'expense',
      gmailId,
    );
    expect(mockSetDoc).toHaveBeenCalledTimes(1);
    const payload = mockSetDoc.mock.calls[0][1] as {mailId: string; vendor: string};
    expect(payload.mailId).toBe(gmailId);
    expect(payload.vendor).toBe('ZOMATO');
  });

  it('generates a date+vendor key only for new expenses without an id', async () => {
    const saved = await LiveExpenseAPI.addExpense(makeExpense({
      id: '',
      mailId: 'manual-uuid',
      vendor: 'CAFE PLACE',
    }));

    expect(saved.id).toContain('CAFE PLACE');
    expect(saved.id).not.toBe('');
    expect(mockDoc).toHaveBeenCalledWith(
      expect.anything(),
      'users',
      'uid-test',
      'expense',
      saved.id,
    );
  });

  it('does not use the placeholder id manual as a document id', async () => {
    const saved = await LiveExpenseAPI.addExpense(makeExpense({
      id: 'manual',
      mailId: 'manual-uuid-2',
      vendor: 'BAKERY',
    }));

    expect(saved.id).not.toBe('manual');
    expect(saved.id).toContain('BAKERY');
  });
});
