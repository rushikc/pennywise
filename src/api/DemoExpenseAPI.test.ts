/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const mockGetDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockSetDoc = jest.fn();
const mockIndexedDBOpen = jest.fn();
const mockIndexedDBDelete = jest.fn();

jest.mock('firebase/firestore/lite', () => ({
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getFirestore: jest.fn(),
}));

jest.mock('./FinanceIndexDB', () => ({
  FinanceIndexDB: {
    initDB: jest.fn(),
    addExpenseList: jest.fn(),
    addVendorTag: jest.fn(),
    addConfig: jest.fn(),
    getData: jest.fn(),
    getAllData: jest.fn(),
    clearIndexedDBData: jest.fn(),
    deleteExpense: jest.fn(),
    addBudgetList: jest.fn(),
    deleteBudget: jest.fn(),
  },
}));

import {DemoExpenseAPI} from './DemoExpenseAPI';
import {FinanceIndexDB} from './FinanceIndexDB';
import {makeExpense} from '../testUtils';

describe('DemoExpenseAPI', () => {
  beforeAll(() => {
    Object.defineProperty(global, 'indexedDB', {
      configurable: true,
      value: {
        open: mockIndexedDBOpen,
        deleteDatabase: mockIndexedDBDelete,
      },
    });
  });

  beforeEach(async () => {
    mockGetDoc.mockClear();
    mockGetDocs.mockClear();
    mockSetDoc.mockClear();
    mockIndexedDBOpen.mockClear();
    mockIndexedDBDelete.mockClear();
    jest.mocked(FinanceIndexDB.addExpenseList).mockClear();
    await DemoExpenseAPI.getExpenseList(0);
  });

  it('shifts mock expenses to look recent', async () => {
    const expenses = await DemoExpenseAPI.getExpenseList();
    expect(expenses.length).toBeGreaterThan(0);
    const newest = Math.max(...expenses.map((item) => item.date));
    expect(Math.abs(newest - Date.now())).toBeLessThan(24 * 60 * 60 * 1000);
  });

  it('supports expense CRUD for the session', async () => {
    const created = await DemoExpenseAPI.addExpense(makeExpense({
      id: '',
      mailId: 'demo-mail-crud',
      vendor: 'DEMO SHOP',
      cost: 42.1,
    }));
    expect(created.id).toContain('DEMO SHOP');
    expect(created.cost).toBe(42.1);

    const afterAdd = await DemoExpenseAPI.getExpenseList();
    expect(afterAdd.some((item) => item.mailId === 'demo-mail-crud')).toBe(true);

    await DemoExpenseAPI.addExpense({
      ...created,
      tag: 'food',
    }, 'update');
    const tagged = (await DemoExpenseAPI.getExpenseList()).find((item) => item.mailId === 'demo-mail-crud');
    expect(tagged?.tag).toBe('food');

    await DemoExpenseAPI.deleteExpense(created);
    const afterDelete = await DemoExpenseAPI.getExpenseList();
    expect(afterDelete.some((item) => item.mailId === 'demo-mail-crud')).toBe(false);
  });

  it('updates an existing expense by id instead of generating a date+vendor key', async () => {
    const gmailId = 'gmail-message-id-abc';
    const created = await DemoExpenseAPI.addExpense(makeExpense({
      id: gmailId,
      mailId: gmailId,
      vendor: 'ZOMATO',
      tag: undefined,
    }));
    expect(created.id).toBe(gmailId);

    await DemoExpenseAPI.addExpense({
      ...created,
      tag: 'food',
    }, 'update');
    const tagged = (await DemoExpenseAPI.getExpenseList()).find((item) => item.mailId === gmailId);
    expect(tagged?.id).toBe(gmailId);
    expect(tagged?.tag).toBe('food');
    expect((await DemoExpenseAPI.getExpenseList()).filter((item) => item.mailId === gmailId)).toHaveLength(1);
  });

  it('treats the placeholder id manual as a new expense', async () => {
    const created = await DemoExpenseAPI.addExpense(makeExpense({
      id: 'manual',
      mailId: 'manual-mail',
      vendor: 'MANUAL VEND',
    }));
    expect(created.id).not.toBe('manual');
    expect(created.id).toContain('MANUAL VEN');
  });

  it('supports budget, tag, vendor tag and bank config writes', async () => {
    const budget = await DemoExpenseAPI.addBudget({
      id: '',
      name: 'Demo Budget',
      amount: 1000,
      tagList: ['food'],
      modifiedDate: Date.now(),
    });
    expect(budget.id.startsWith('demo_budget_')).toBe(true);

    const updatedBudget = await DemoExpenseAPI.updateBudget({...budget, amount: 1500});
    expect(updatedBudget.amount).toBe(1500);
    expect((await DemoExpenseAPI.getBudgetList()).some((item) => item.id === budget.id && item.amount === 1500)).toBe(true);

    await DemoExpenseAPI.deleteBudget(budget);
    expect((await DemoExpenseAPI.getBudgetList()).some((item) => item.id === budget.id)).toBe(false);

    await DemoExpenseAPI.updateTagList(['food', 'demo-tag']);
    expect(await DemoExpenseAPI.getTagList()).toEqual(['food', 'demo-tag']);

    await DemoExpenseAPI.updateVendorTag({id: '', vendor: 'DEMO VENDOR', tag: 'food', date: 0});
    const vendorTags = await DemoExpenseAPI.getVendorTagList();
    expect(vendorTags.some((item) => item.vendor === 'DEMO VENDOR' && item.id === 'DEMO VENDOR')).toBe(true);
    await DemoExpenseAPI.deleteVendorTag('DEMO VENDOR');
    expect((await DemoExpenseAPI.getVendorTagList()).some((item) => item.vendor === 'DEMO VENDOR')).toBe(false);

    await DemoExpenseAPI.updateEmailParseBankList([{
      id: 'demo-bank',
      displayName: 'Demo Bank',
      matchStrings: ['DEMOBANK'],
    }]);
    expect(await DemoExpenseAPI.getEmailParseBankList()).toEqual([{
      id: 'demo-bank',
      displayName: 'Demo Bank',
      matchStrings: ['DEMOBANK'],
    }]);

    await DemoExpenseAPI.updateBankConfig({enableUpi: true, creditCards: ['1234']});
    expect(await DemoExpenseAPI.getBankConfig()).toEqual({enableUpi: true, creditCards: ['1234']});

    await DemoExpenseAPI.updateDarkMode(true);
    expect(await DemoExpenseAPI.getDarkModeConfig()).toBe(true);
  });

  it('auto-tags untagged in-memory expenses from vendor tags', async () => {
    await DemoExpenseAPI.updateVendorTag({
      id: 'AUTO VENDOR',
      vendor: 'AUTO VENDOR',
      tag: 'food',
      date: Date.now(),
    });
    await DemoExpenseAPI.addExpense(makeExpense({
      mailId: 'auto-tag-mail',
      vendor: 'AUTO VENDOR',
      tag: undefined,
    }));

    const count = await DemoExpenseAPI.autoTagPastExpenses(0);
    expect(count).toBeGreaterThan(0);
    const tagged = (await DemoExpenseAPI.getExpenseList()).find((item) => item.mailId === 'auto-tag-mail');
    expect(tagged?.tag).toBe('food');
    expect(tagged?.tags).toEqual(['food']);
  });

  it('re-seeds and drops session writes when getExpenseList receives a date override', async () => {
    await DemoExpenseAPI.addExpense(makeExpense({mailId: 'session-only', vendor: 'SESSION'}));
    expect((await DemoExpenseAPI.getExpenseList()).some((item) => item.mailId === 'session-only')).toBe(true);

    await DemoExpenseAPI.getExpenseList(1);
    expect((await DemoExpenseAPI.getExpenseList()).some((item) => item.mailId === 'session-only')).toBe(false);
  });

  it('exposes pending duplicate pairs and resolves them with duplicateLogic', async () => {
    const pairs = await DemoExpenseAPI.getDuplicateCandidates();
    expect(pairs.length).toBeGreaterThan(0);
    const [pair] = pairs;
    await DemoExpenseAPI.resolveDuplicate(pair.keep, pair.drop, 'confirmed');
    const remaining = await DemoExpenseAPI.getDuplicateCandidates();
    expect(remaining.some((item) => item.drop.mailId === pair.drop.mailId)).toBe(false);
    const visible = await DemoExpenseAPI.getExpenseList();
    expect(visible.some((item) => item.mailId === pair.drop.mailId)).toBe(false);
  });

  it('never touches IndexedDB or Firestore', async () => {
    await DemoExpenseAPI.addExpense(makeExpense({mailId: 'no-io', vendor: 'NOIO'}));
    await DemoExpenseAPI.getBudgetList();
    await DemoExpenseAPI.getVendorTagList();
    expect(mockGetDoc).not.toHaveBeenCalled();
    expect(mockGetDocs).not.toHaveBeenCalled();
    expect(mockSetDoc).not.toHaveBeenCalled();
    expect(mockIndexedDBOpen).not.toHaveBeenCalled();
    expect(FinanceIndexDB.addExpenseList).not.toHaveBeenCalled();
    expect(FinanceIndexDB.getAllData).not.toHaveBeenCalled();
  });
});
