/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {Config, Expense, VendorTag, Budget} from '../Types';
import {getDataMode} from '../pages/login/dataMode';
import {IS_DEMO_BUILD} from '../utility/buildMode';
import {liveIndexedDbName} from './liveIndexedDbName';

const isLive = () => getDataMode() === 'live';

export const LEGACY_FINANCE_IDB_FLAG = 'pennywise-deleted-legacy-finance-idb';

export function deleteLegacyFinanceIdb(): void {
  if (typeof indexedDB === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }
  if (localStorage.getItem(LEGACY_FINANCE_IDB_FLAG) === '1') {
    return;
  }
  indexedDB.deleteDatabase('Finance');
  localStorage.setItem(LEGACY_FINANCE_IDB_FLAG, '1');
}

const dbVersion = 5;

const dbName = (): string => {
  if (__DEMO_BUILD__ || IS_DEMO_BUILD || !isLive()) {
    return 'Finance';
  }
  return liveIndexedDbName();
};

const storeNames: TableNames[] = ['expense', 'vendorTag', 'config', 'budget'];

const recreateStores = (db: IDBDatabase): void => {
  storeNames.forEach((name) => {
    if (db.objectStoreNames.contains(name)) {
      db.deleteObjectStore(name);
    }
  });

  const expenseStore = db.createObjectStore('expense', {keyPath: 'mailId'});
  expenseStore.createIndex('vendor_index', ['vendor'], {unique: false});
  expenseStore.createIndex('date_index', ['date'], {unique: false});

  db.createObjectStore('vendorTag', {keyPath: 'vendor'});
  db.createObjectStore('config', {keyPath: 'key'});
  db.createObjectStore('budget', {keyPath: 'id'});
};

const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName(), dbVersion);
    request.onupgradeneeded = () => {
      recreateStores(request.result);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error(`Failed to open IndexedDB: ${dbName()}`));
  });
};

const deleteDatabase = (name: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error(`Deleting IndexedDB ${name} was blocked`));
  });
};

/** A database left at the current version without a store cannot upgrade, so open a fresh one. */
const openDatabaseWithStore = async (storeName: TableNames, allowRecover = true): Promise<IDBDatabase> => {
  const db = await openDatabase();
  if (db.objectStoreNames.contains(storeName)) {
    return db;
  }
  db.close();
  if (!allowRecover) {
    throw new Error(`IndexedDB is missing the ${storeName} store`);
  }
  await deleteDatabase(dbName());
  return openDatabaseWithStore(storeName, false);
};

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
    if (!isLive()) {
      return;
    }
    if (!indexedDB) {
      alert('IndexedDB is not available on this browser, this might increase firebase billing');
      return;
    }

    void openDatabase().catch(() => undefined);
  };

  /**
   * Generic method to execute operations on IndexedDB stores
   */
  private static executeStoreOperation = async <T>(
    storeName: TableNames,
    operation: (store: IDBObjectStore) => IDBRequest<T>,
    mode: IDBTransactionMode = 'readwrite'
  ): Promise<T> => {
    const db = await openDatabaseWithStore(storeName);
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        const request = operation(store);

        request.onsuccess = () => {
          db.close();
          resolve(request.result);
        };
        request.onerror = () => {
          db.close();
          reject(new Error(`IndexedDB operation failed on ${storeName}`));
        };
      } catch (error) {
        reject(error);
      }
    });
  };

  /**
   * Batch insert operations for better performance
   */
  private static batchInsert = async <T extends TableNames>(
    storeName: T,
    items: StoreData[T][]
  ): Promise<void> => {
    const db = await openDatabaseWithStore(storeName);
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);

        items.forEach(item => store.put(item));

        transaction.oncomplete = () => {
          db.close();
          resolve();
        };
        transaction.onerror = () => {
          db.close();
          reject(new Error(`Batch insert failed on ${storeName}`));
        };
      } catch (error) {
        reject(error);
      }
    });
  };

  /**
   * Adds a list of expenses to the 'expense' object store.
   */
  static addExpenseList = (expenseList: Expense[]): Promise<void> => {
    if (!isLive()) {
      return Promise.resolve();
    }
    return this.batchInsert('expense', expenseList);
  };

  /**
   * Adds a vendor tag to the 'vendorTag' object store.
   */
  static addVendorTag = (vendorTag: VendorTag): Promise<void> => {
    if (!isLive()) {
      return Promise.resolve();
    }
    return this.executeStoreOperation('vendorTag', (store) => store.put(vendorTag))
      .then(() => undefined);
  };

  /**
   * Adds a list of configurations to the 'config' object store.
   */
  static addConfig = (configList: Config[]): Promise<void> => {
    if (!isLive()) {
      return Promise.resolve();
    }
    return this.batchInsert('config', configList);
  };

  /**
   * Retrieves a single data entry from a specified object store using a key.
   */
  static getData = <T extends TableNames>(
    storeName: T,
    keyPath: string
  ): Promise<StoreData[T] | undefined> => {
    if (!isLive()) {
      return Promise.resolve(undefined);
    }
    return this.executeStoreOperation(storeName, (store) => store.get(keyPath), 'readonly');
  };

  /**
   * Retrieves all data from a specified object store.
   */
  static getAllData = <T extends TableNames>(storeName: T): Promise<StoreData[T][]> => {
    if (!isLive()) {
      return Promise.resolve([]);
    }
    return this.executeStoreOperation(storeName, (store) => store.getAll(), 'readonly');
  };

  /**
   * Clears all IndexedDB data by deleting the entire database
   */
  static clearIndexedDBData = (): Promise<void> => {
    if (!isLive()) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve, reject) => {
      try {
        const deleteRequest = indexedDB.deleteDatabase(dbName());

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
    if (!isLive()) {
      return;
    }
    await this.executeStoreOperation('expense', (store) => store.delete(mailId));
    // console.debug('Successfully deleted expense with mailId:', mailId);
  };

  /**
   * Adds a list of budgets to the 'budget' object store.
   */
  static addBudgetList = (budgetList: Budget[]): Promise<void> => {
    if (!isLive()) {
      return Promise.resolve();
    }
    return this.batchInsert('budget', budgetList);
  };

  /**
   * Deletes a budget from the 'budget' object store by its id.
   */
  static deleteBudget = async (budgetId: string): Promise<void> => {
    if (!isLive()) {
      return;
    }
    await this.executeStoreOperation('budget', (store) => store.delete(budgetId));
    // console.debug('Successfully deleted budget with id:', budgetId);
  };
}
