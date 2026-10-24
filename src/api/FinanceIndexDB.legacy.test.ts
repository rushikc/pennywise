/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {deleteLegacyFinanceIdb, LEGACY_FINANCE_IDB_FLAG} from './FinanceIndexDB';

describe('deleteLegacyFinanceIdb', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('deletes the Finance database once and sets a flag', () => {
    const deleted: string[] = [];
    const original = indexedDB.deleteDatabase.bind(indexedDB);
    indexedDB.deleteDatabase = (name: string) => {
      deleted.push(name);
      return original(name);
    };
    deleteLegacyFinanceIdb();
    deleteLegacyFinanceIdb();
    expect(deleted).toEqual(['Finance']);
    expect(localStorage.getItem(LEGACY_FINANCE_IDB_FLAG)).toBe('1');
    indexedDB.deleteDatabase = original;
  });
});
