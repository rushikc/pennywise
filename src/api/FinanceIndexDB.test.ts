/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

jest.mock('./liveIndexedDbName', () => ({
  liveIndexedDbName: () => 'Finance-uid-test',
}));

import {FinanceIndexDB} from './FinanceIndexDB';
import {setDataMode} from '../pages/login/dataMode';
import {makeExpense} from '../testUtils';

const DB_NAME = 'Finance-uid-test';

const deleteDb = (): Promise<void> => new Promise((resolve, reject) => {
  const request = indexedDB.deleteDatabase(DB_NAME);
  request.onsuccess = () => resolve();
  request.onerror = () => reject(request.error);
  request.onblocked = () => reject(new Error('delete blocked'));
});

const openAtVersion = (version: number, upgrade: (db: IDBDatabase) => void): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, version);
    request.onupgradeneeded = () => upgrade(request.result);
    request.onsuccess = () => {
      request.result.close();
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
};

describe('FinanceIndexDB', () => {
  beforeEach(async () => {
    setDataMode('live');
    await deleteDb();
  });

  afterEach(() => {
    setDataMode('demo');
  });

  it('recreates stores on a schema version bump and drops stale rows', async () => {
    await openAtVersion(4, (db) => {
      const store = db.createObjectStore('expense', {keyPath: 'mailId'});
      store.put(makeExpense({id: 'stale', mailId: 'stale', vendor: 'OLD'}));
    });

    const rows = await FinanceIndexDB.getAllData('expense');
    expect(rows).toEqual([]);
  });

  it('recovers when a store is missing at the current version', async () => {
    await openAtVersion(5, (db) => {
      db.createObjectStore('config', {keyPath: 'key'});
    });

    await expect(FinanceIndexDB.getAllData('expense')).resolves.toEqual([]);
    await FinanceIndexDB.addExpenseList([makeExpense({id: 'fresh', mailId: 'fresh'})]);
    const stored = await FinanceIndexDB.getData('expense', 'fresh');
    expect(stored?.mailId).toBe('fresh');
  });

  it('round-trips put, get, and delete', async () => {
    const expense = makeExpense({id: 'm1', mailId: 'm1', vendor: 'Cafe'});
    await FinanceIndexDB.addExpenseList([expense]);
    await expect(FinanceIndexDB.getData('expense', 'm1')).resolves.toMatchObject({vendor: 'Cafe'});
    await FinanceIndexDB.deleteExpense('m1');
    await expect(FinanceIndexDB.getData('expense', 'm1')).resolves.toBeUndefined();
  });

  it('clears the database on sign-out', async () => {
    await FinanceIndexDB.addExpenseList([makeExpense({id: 'm1', mailId: 'm1'})]);
    await FinanceIndexDB.clearIndexedDBData();
    await FinanceIndexDB.addExpenseList([makeExpense({id: 'm2', mailId: 'm2'})]);
    const rows = await FinanceIndexDB.getAllData('expense');
    expect(rows.map((row) => row.mailId)).toEqual(['m2']);
  });

  it('does not open IndexedDB in demo mode', async () => {
    setDataMode('demo');
    const opened: string[] = [];
    const original = indexedDB.open.bind(indexedDB);
    indexedDB.open = ((name: string, version?: number) => {
      opened.push(name);
      return original(name, version);
    }) as typeof indexedDB.open;

    await FinanceIndexDB.addExpenseList([makeExpense({id: 'm1', mailId: 'm1'})]);
    await expect(FinanceIndexDB.getAllData('expense')).resolves.toEqual([]);
    expect(opened).toEqual([]);
    indexedDB.open = original;
  });
});
