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

const deleteFieldSentinel = {__deleteField: true};

jest.mock('firebase/firestore/lite', () => ({
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  deleteDoc: jest.fn(),
  deleteField: () => deleteFieldSentinel,
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
    jest.restoreAllMocks();
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
    const payload = mockSetDoc.mock.calls[0][1] as {vendor: string};
    const options = mockSetDoc.mock.calls[0][2] as {merge: boolean};
    expect(payload.vendor).toBe('ZOMATO');
    expect(options).toEqual({merge: true});
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

  it('merges only owned fields and omits unknown keys on an existing id', async () => {
    jest.spyOn(LiveExpenseAPI, 'getTagConfig').mockResolvedValue({
      tagList: ['food'],
      legacyTagList: [],
    });
    const expense = {
      ...makeExpense({id: 'existing-1', vendor: 'SHOP', tags: ['food']}),
      foo: 'bar',
    } as ReturnType<typeof makeExpense> & {foo: string};

    await LiveExpenseAPI.addExpense(expense);

    const payload = mockSetDoc.mock.calls[0][1] as Record<string, unknown>;
    expect(payload.foo).toBeUndefined();
    expect(payload.mailId).toBeUndefined();
    expect(payload.tags).toEqual(['food']);
    expect(mockSetDoc.mock.calls[0][2]).toEqual({merge: true});
  });

  it('does not wipe a missing cached description when only the primary changes', async () => {
    jest.spyOn(LiveExpenseAPI, 'getTagConfig').mockResolvedValue({
      tagList: ['food', 'travel'],
      legacyTagList: [],
    });
    const expense = makeExpense({id: 'existing-2', vendor: 'SHOP', tags: ['travel']});
    delete (expense as {description?: string}).description;

    await LiveExpenseAPI.addExpense(expense);

    const payload = mockSetDoc.mock.calls[0][1] as Record<string, unknown>;
    expect(payload).not.toHaveProperty('description');
  });

  it('writes the tag mirror from tags even when the caller passed a mismatch', async () => {
    jest.spyOn(LiveExpenseAPI, 'getTagConfig').mockResolvedValue({
      tagList: ['food'],
      legacyTagList: [],
    });
    await LiveExpenseAPI.addExpense(makeExpense({
      id: 'existing-3',
      tags: ['food', 'zomato'],
      tag: 'travel',
    }));

    const payload = mockSetDoc.mock.calls[0][1] as {tags: string[]; tag: string | null};
    expect(payload.tags[0]).toBe('food');
    expect(payload.tag).toBe('food');
  });

  it('deletes description when the note is cleared', async () => {
    jest.spyOn(LiveExpenseAPI, 'getTagConfig').mockResolvedValue({
      tagList: ['food'],
      legacyTagList: [],
    });
    await LiveExpenseAPI.addExpense(makeExpense({
      id: 'existing-4',
      tags: ['food'],
      description: '',
    }));

    const payload = mockSetDoc.mock.calls[0][1] as {description: unknown};
    expect(payload.description).toEqual(deleteFieldSentinel);
  });
});
