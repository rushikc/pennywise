/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const mockGetDocs = jest.fn();
const mockAddExpense = jest.fn().mockResolvedValue({});

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
}));

jest.mock('firebase/firestore/lite', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(),
  query: jest.fn(),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
}));

jest.mock('../firebase/firebase-public', () => ({
  firebaseConfig: {projectId: 'demo-project'},
}));

jest.mock('./ExpenseAPI', () => ({
  ExpenseAPI: {
    addExpense: (...args: unknown[]) => mockAddExpense(...args),
  },
}));

jest.mock('./liveCurrentUid', () => ({
  currentUid: () => 'uid-test',
}));

jest.mock('../components/ErrorHandlers', () => ({
  ErrorHandlers: {handleApiError: jest.fn()},
}));

import {ProcessData} from './ProcessData';
import {setDataMode} from '../pages/login/dataMode';

describe('ProcessData.processVendorNames', () => {
  beforeEach(() => {
    mockGetDocs.mockReset();
    mockAddExpense.mockClear();
    setDataMode('live');
  });

  afterEach(() => {
    setDataMode('demo');
  });

  it('trims a UPI vendor and collapses manual entry text', async () => {
    const docs = [
      {data: () => ({mailId: 'm1', vendor: 'shop@oksbi  City Cafe '})},
      {data: () => ({mailId: 'm2', vendor: 'pay@upi note manual entry abc'})},
      {data: () => ({mailId: 'm3', vendor: ''})},
    ];
    mockGetDocs.mockResolvedValue({
      docs,
      forEach: (fn: (doc: (typeof docs)[number]) => void) => docs.forEach(fn),
    });

    await ProcessData.processVendorNames();

    const vendors = mockAddExpense.mock.calls.map((call) => (call[0] as {vendor: string}).vendor);
    expect(vendors).toEqual([
      'CITY CAFE SHOP@OKSBI',
      'MANUAL ENTRY PAY@UPI',
      '',
    ]);
  });

  it('does not read Firestore in demo mode', async () => {
    setDataMode('demo');
    await ProcessData.processVendorNames();
    expect(mockGetDocs).not.toHaveBeenCalled();
    expect(mockAddExpense).not.toHaveBeenCalled();
  });
});
