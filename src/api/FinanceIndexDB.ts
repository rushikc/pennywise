/*
Copyright (C) 2025 <rushikc> <rushikc.dev@gmail.com>

This program is free software; you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the
Free Software Foundation; version 3 of the License.

This program is distributed in the hope that it will be useful, but
WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details, or get a copy at
<https://www.gnu.org/licenses/gpl-3.0.txt>.
*/

import {Config, Expense, VendorTag, Budget} from '../Types';

const dbName = 'Finance';
const dbVersion = 5;

type TableNames = 'expense' | 'vendorTag' | 'config' | 'budget';
type StoreData = {
  expense: Expense;
  vendorTag: VendorTag;
  config: Config;
  budget: Budget;
};

export class FinanceIndexDB {

  /**
   * Initializes the IndexedDB database.
   * Creates object stores and indexes if they don't exist.
   */
  static initDB = (): void => {
    if (!indexedDB) {
      alert('IndexedDB is not available on this browser, this might increase firebase billing');
      console.debug('IndexedDB could not be found in this browser.');
      return;
    }

    console.debug('Initiating IndexedDB');
    const financeDB = indexedDB.open(dbName, dbVersion);

    financeDB.onupgradeneeded = () => {
      const db = financeDB.result;

      const expenseStore = db.createObjectStore('expense', {keyPath: 'mailId'});
      expenseStore.createIndex('vendor_index', ['vendor'], {unique: false});
      expenseStore.createIndex('date_index', ['date'], {unique: false});

      db.createObjectStore('vendorTag', {keyPath: 'vendor'});
      db.createObjectStore('config', {keyPath: 'key'});
      db.createObjectStore('budget', {keyPath: 'id'}); // Create budget store

      console.debug('Created finance IndexedDB');
    };
  };

  /**
   * Generic method to execute operations on IndexedDB stores
   */
  private static executeStoreOperation = <T>(
    storeName: TableNames,
    operation: (store: IDBObjectStore) => IDBRequest<T>,
    mode: IDBTransactionMode = 'readwrite'
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      const financeDB = indexedDB.open(dbName, dbVersion);

      financeDB.onsuccess = () => {
        try {
          const db = financeDB.result;
          const transaction = db.transaction(storeName, mode);
          const store = transaction.objectStore(storeName);
          const request = operation(store);

          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(new Error(`IndexedDB operation failed on ${storeName}`));
        } catch (error) {
          reject(error);
        }
      };

      financeDB.onerror = () => reject(new Error(`Failed to open IndexedDB: ${dbName}`));
    });
  };

  /**
   * Batch insert operations for better performance
   */
  private static batchInsert = <T extends TableNames>(
    storeName: T,
    items: StoreData[T][]
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const financeDB = indexedDB.open(dbName, dbVersion);

      financeDB.onsuccess = () => {
        try {
          const db = financeDB.result;
          const transaction = db.transaction(storeName, 'readwrite');
          const store = transaction.objectStore(storeName);

          items.forEach(item => store.put(item));

          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(new Error(`Batch insert failed on ${storeName}`));
        } catch (error) {
          reject(error);
        }
      };

      financeDB.onerror = () => reject(new Error(`Failed to open IndexedDB: ${dbName}`));
    });
  };

  /**
   * Adds a list of expenses to the 'expense' object store.
   */
  static addExpenseList = (expenseList: Expense[]): Promise<void> => {
    console.debug('addExpenseList IndexedDB');
    return this.batchInsert('expense', expenseList);
  };

  /**
   * Adds a vendor tag to the 'vendorTag' object store.
   */
  static addVendorTag = (vendorTag: VendorTag): Promise<void> => {
    console.debug('addVendorTag IndexedDB');
    return this.executeStoreOperation('vendorTag', (store) => store.put(vendorTag))
      .then(() => undefined);
  };

  /**
   * Adds a list of configurations to the 'config' object store.
   */
  static addConfig = (configList: Config[]): Promise<void> => {
    console.debug('addConfig IndexedDB');
    return this.batchInsert('config', configList);
  };

  /**
   * Retrieves a single data entry from a specified object store using a key.
   */
  static getData = <T extends TableNames>(
    storeName: T,
    keyPath: string
  ): Promise<StoreData[T] | undefined> => {
    console.debug('getData IndexedDB - ', storeName, keyPath);
    return this.executeStoreOperation(storeName, (store) => store.get(keyPath), 'readonly');
  };

  /**
   * Retrieves all data from a specified object store.
   */
  static getAllData = <T extends TableNames>(storeName: T): Promise<StoreData[T][]> => {
    console.debug('getAllData IndexedDB - ', storeName);
    return this.executeStoreOperation(storeName, (store) => store.getAll(), 'readonly');
  };

  /**
   * Clears all IndexedDB data by deleting the entire database
   */
  static clearIndexedDBData = (): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      try {
        const deleteRequest = indexedDB.deleteDatabase(dbName);

        deleteRequest.onsuccess = () => {
          console.log('IndexedDB data cleared successfully');
          resolve();
        };

        deleteRequest.onerror = (event) => {
          console.error('Error clearing IndexedDB data:', event);
          reject(new Error('Failed to clear IndexedDB data'));
        };

        deleteRequest.onblocked = () => {
          console.warn('Clearing IndexedDB was blocked. Please close other tabs with this app.');
          resolve(); // Don't fail the process
        };
      } catch (error) {
        console.error('Exception when clearing IndexedDB:', error);
        resolve(); // Don't fail the process if clearing DB fails
      }
    });
  };

  /**
   * Deletes an expense from the 'expense' object store by its mailId.
   */
  static deleteExpense = async (mailId: string): Promise<void> => {
    console.debug('deleteExpense IndexedDB - mailId:', mailId);
    await this.executeStoreOperation('expense', (store) => store.delete(mailId));
    console.debug('Successfully deleted expense with mailId:', mailId);
  };

  /**
   * Adds a list of budgets to the 'budget' object store.
   */
  static addBudgetList = (budgetList: Budget[]): Promise<void> => {
    console.debug('addBudgetList IndexedDB');
    return this.batchInsert('budget', budgetList);
  };

  /**
   * Deletes a budget from the 'budget' object store by its id.
   */
  static deleteBudget = async (budgetId: string): Promise<void> => {
    console.debug('deleteBudget IndexedDB - budgetId:', budgetId);
    await this.executeStoreOperation('budget', (store) => store.delete(budgetId));
    console.debug('Successfully deleted budget with id:', budgetId);
  };
}
