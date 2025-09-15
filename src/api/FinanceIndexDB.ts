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


import {Config, Expense, VendorTag} from '../Types';


const dbName = 'Finance';
const dbVersion = 4;

type TableNames = 'expense' | 'vendorTag' | 'config';

export class FinanceIndexDB {


  /**
   * Initializes the IndexedDB database.
   * Creates object stores and indexes if they don't exist.
   */
  static initDB = () => {

    if (!indexedDB) {
      alert('IndexedDB is not available on this browser, this might increase firebase billing');
      console.debug('IndexedDB could not be found in this browser.');
    } else {

      console.debug('Initiating IndexedDB');

      const financeDB = indexedDB.open(dbName, dbVersion);

      financeDB.onupgradeneeded = function () {

        const db = financeDB.result;

        const expenseStore = db.createObjectStore('expense', {keyPath: 'mailId'});
        expenseStore.createIndex('vendor_index', ['vendor'], {unique: false});
        expenseStore.createIndex('date_index', ['date'], {unique: false,});

        db.createObjectStore('vendorTag', {keyPath: 'vendor'});
        db.createObjectStore('config', {keyPath: 'key'});

        console.debug('Created finance IndexedDB');

      };
    }
  };


  /**
   * Gets an instance of a specific object store from the IndexedDB.
   * Returns a promise that resolves with the object store instance.
   */
  static getStoreInstance = async (storeName: TableNames, mode: IDBTransactionMode = 'readwrite'): Promise<IDBObjectStore> => {

    return new Promise((resolve) => {
      const financeDB = indexedDB.open(dbName, dbVersion);
      financeDB.onsuccess = () => {
        const db = financeDB.result;
        const transaction = db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        resolve(store);
      };
    });


  };


  /**
   * Adds a list of expenses to the 'expense' object store.
   */
  static addExpenseList = async (expenseList: Expense[]) => {

    console.debug('addExpense IndexedDB');
    const store = await this.getStoreInstance('expense');
    expenseList.forEach(expense => store.put(expense));

  };

  /**
   * Adds a vendor tag to the 'vendorTag' object store.
   */
  static addVendorTag = async (vendorTag: VendorTag) => {
    console.debug('addVendorTag IndexedDB');
    const store = await this.getStoreInstance('vendorTag');
    store.put(vendorTag);
  };


  /**
   * Adds a list of configurations to the 'config' object store.
   */
  static addConfig = async (configList: Config[]) => {

    // console.debug("addExpense IndexedDB");
    const store = await this.getStoreInstance('config');
    configList.forEach(config => store.put(config));

  };


  /**
   * Retrieves a single data entry from a specified object store using a key.
   */
  // eslint-disable-next-line
  static getData = async (storeName: TableNames, keyPath: string): Promise<any> => {

    console.debug('getData IndexedDB - ', storeName, keyPath);

    return new Promise((resolve) => {
      const storePromise = this.getStoreInstance(storeName);
      storePromise.then(store => {
        const storeVal = store.get(keyPath);
        storeVal.onsuccess = () => resolve(storeVal.result);
      });

    });

  };

  /**
   * Retrieves all data from a specified object store.
   */
  // eslint-disable-next-line
  static getAllData = async (storeName: TableNames): Promise<any[]> => {

    console.debug('getAllData IndexedDB - ', storeName);

    return new Promise((resolve) => {
      const storePromise = this.getStoreInstance(storeName);
      storePromise.then(store => {
        const storeVal = store.getAll();
        storeVal.onsuccess = () => resolve(storeVal.result);
      });

    });

  };

  /**
   * Clears all IndexedDB data by deleting the entire database
   * @returns Promise that resolves when the database is deleted or rejects on error
   */
  static clearIndexedDBData = async (): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      try {
        // Request to delete the entire database
        const deleteRequest = indexedDB.deleteDatabase(dbName);

        deleteRequest.onsuccess = () => {
          console.log('IndexedDB data cleared successfully');
          resolve();
        };

        deleteRequest.onerror = (event) => {
          console.error('Error clearing IndexedDB data:', event);
          reject(new Error('Failed to clear IndexedDB data'));
        };

        // Handle if the database is being blocked (e.g., by other connections)
        deleteRequest.onblocked = () => {
          console.warn('Clearing IndexedDB was blocked. Please close other tabs with this app.');
          // Try to continue anyway
          resolve();
        };
      } catch (error) {
        console.error('Exception when clearing IndexedDB:', error);
        // Don't fail the process if clearing DB fails
        resolve();
      }
    });
  };

  /**
   * Deletes an expense from the 'expense' object store by its mailId.
   */
  static deleteExpense = async (mailId: string): Promise<void> => {
    console.debug('deleteExpense IndexedDB - mailId:', mailId);

    return new Promise<void>((resolve, reject) => {
      this.getStoreInstance('expense').then(store => {
        const deleteRequest = store.delete(mailId);

        deleteRequest.onsuccess = () => {
          console.debug('Successfully deleted expense with mailId:', mailId);
          resolve();
        };

        deleteRequest.onerror = (event) => {
          console.error('Error deleting expense:', event);
          reject(new Error('Failed to delete expense'));
        };
      }).catch(error => {
        console.error('Error accessing expense store:', error);
        reject(error);
      });
    });
  };

}
