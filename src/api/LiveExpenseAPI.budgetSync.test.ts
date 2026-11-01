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
  collection: jest.fn(() => 'col'),
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

const budgets = new Map<string, Record<string, unknown>>();
const vendorTags = new Map<string, Record<string, unknown>>();
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
    addBudgetList: jest.fn(async (rows: Array<{id: string}>) => {
      rows.forEach((row) => budgets.set(row.id, row));
    }),
    addVendorTag: jest.fn(async (row: {vendor: string}) => {
      vendorTags.set(row.vendor, row);
    }),
    getAllData: jest.fn(async (store: string) => {
      if (store === 'budget') {
        return Array.from(budgets.values());
      }
      if (store === 'vendorTag') {
        return Array.from(vendorTags.values());
      }
      return [];
    }),
  },
}));

import {LiveExpenseAPI} from './LiveExpenseAPI';
import {
  BUDGET_LAST_UPDATE,
  SYNC_RESET_VERSION,
  SYNC_RESET_VERSION_KEY,
  TAG_LAST_UPDATE,
} from '../utility/constants';
import {getUnixTimestamp} from '../utility/utility';

const HOUR = 3600000;
const staleWatermark = Date.now() - HOUR;
const oldDate = Date.now() - 400 * 24 * HOUR;
const from2020 = getUnixTimestamp('2020-01-01');

const importedBudget = {
  id: 'imported-budget',
  name: 'Imported Food',
  amount: 100,
  tagList: ['food'],
  modifiedDate: oldDate,
  operation: 'update',
};

const importedVendorTag = {
  id: 'imported-vt',
  vendor: 'OLD VENDOR',
  tag: 'food',
  date: oldDate,
};

const docSnap = (row: {id: string}) => ({
  id: row.id,
  data: () => row,
});

describe('LiveExpenseAPI budget and vendor tag sync', () => {
  beforeEach(() => {
    budgets.clear();
    vendorTags.clear();
    config.clear();
    whereCalls.length = 0;
    mockGetDocs.mockReset();
    config.set(BUDGET_LAST_UPDATE, staleWatermark);
    config.set(TAG_LAST_UPDATE, staleWatermark);
    config.set(SYNC_RESET_VERSION_KEY, SYNC_RESET_VERSION);
  });

  it('skips old-dated budgets when the watermark is now minus one hour', async () => {
    mockGetDocs.mockResolvedValue({docs: []});
    const list = await LiveExpenseAPI.getBudgetList();
    expect(whereCalls).toEqual([{field: 'modifiedDate', op: '>=', value: staleWatermark}]);
    expect(list.some((row) => row.id === importedBudget.id)).toBe(false);
  });

  it('skips old-dated vendor tags when the watermark is now minus one hour', async () => {
    mockGetDocs.mockResolvedValue({docs: []});
    const list = await LiveExpenseAPI.getVendorTagList();
    expect(whereCalls).toEqual([{field: 'date', op: '>', value: staleWatermark}]);
    expect(list.some((row) => row.vendor === importedVendorTag.vendor)).toBe(false);
  });

  it('fetches old-dated budgets with the 2020 override', async () => {
    mockGetDocs.mockResolvedValue({docs: [docSnap(importedBudget)]});
    const list = await LiveExpenseAPI.getBudgetList(from2020);
    expect(whereCalls.at(-1)).toEqual({field: 'modifiedDate', op: '>=', value: from2020});
    expect(list.some((row) => row.id === importedBudget.id)).toBe(true);
  });

  it('fetches old-dated vendor tags with the 2020 override', async () => {
    mockGetDocs.mockResolvedValue({docs: [docSnap(importedVendorTag)]});
    const list = await LiveExpenseAPI.getVendorTagList(from2020);
    expect(whereCalls.at(-1)).toEqual({field: 'date', op: '>', value: from2020});
    expect(list.some((row) => row.vendor === importedVendorTag.vendor)).toBe(true);
  });

  it('resets watermarks once when the stored version is stale, then no-ops', async () => {
    config.set(SYNC_RESET_VERSION_KEY, 'legacy');
    await LiveExpenseAPI.resetSyncWatermarksIfNeeded();
    expect(config.get(SYNC_RESET_VERSION_KEY)).toBe(SYNC_RESET_VERSION);
    expect(config.get(BUDGET_LAST_UPDATE)).toBe(from2020);
    expect(config.get(TAG_LAST_UPDATE)).toBe(from2020);

    mockGetDocs.mockResolvedValue({docs: [docSnap(importedBudget)]});
    await LiveExpenseAPI.getBudgetList();
    expect(whereCalls.at(-1)).toEqual({field: 'modifiedDate', op: '>=', value: from2020});

    const afterFetch = Date.now() - HOUR;
    config.set(BUDGET_LAST_UPDATE, afterFetch);
    config.set(TAG_LAST_UPDATE, afterFetch);
    await LiveExpenseAPI.resetSyncWatermarksIfNeeded();
    expect(config.get(BUDGET_LAST_UPDATE)).toBe(afterFetch);
    expect(config.get(TAG_LAST_UPDATE)).toBe(afterFetch);
  });
});
