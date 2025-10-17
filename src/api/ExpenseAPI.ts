/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {initializeApp} from 'firebase/app';
import {collection, deleteDoc, doc, getDoc, getDocs, getFirestore, query, setDoc, where} from 'firebase/firestore/lite';
import {BUDGET_LAST_UPDATE, EXPENSE_LAST_UPDATE, TAG_LAST_UPDATE} from '../utility/constants';
import {firebaseConfig} from '../firebase/firebase-public';
import {getDateJsIdFormat, getUnixTimestamp, JSONCopy, sleep} from '../utility/utility';
import {FinanceIndexDB} from './FinanceIndexDB';
import {ErrorHandlers} from '../components/ErrorHandlers';
import {BankConfig, Budget, Expense, VendorTag} from '../Types';

// DocumentDB from Firebase document types
// eslint-disable-next-line
export type DocumentData = { [field: string]: unknown };


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Utility for CRUD operations on single docs
const fireStoreDoc = {
  // eslint-disable-next-line
  set: async (collectionName: string, key: string, val: unknown) => {
    try {
      await setDoc(doc(db, collectionName, key), val);
      // console.debug('Document written:', collectionName, key, val);
    } catch (e) {
      ErrorHandlers.handleApiError(e);
      console.error('Error adding document:', e);
    }
  },
  get: async (collectionName: string, key: string) => {
    try {
      const snap = await getDoc(doc(db, collectionName, key));
      return snap.exists() ? snap.data() : null;
    } catch (e) {
      ErrorHandlers.handleApiError(e);
      console.error('Error getting document:', e);
      return null;
    }
  },
  delete: async (collectionName: string, key: string) => {
    try {
      await deleteDoc(doc(db, collectionName, key));
      // console.debug('Document deleted:', collectionName, key);
      return true;
    } catch (e) {
      ErrorHandlers.handleApiError(e);
      console.error('Error deleting document:', e);
      return false;
    }
  }
};

export class ExpenseAPI {

  /**
   * Sets a single document in a specified Firestore collection.
   * If no collection is specified, it defaults to the 'config' collection.
   */
  static setOneDoc = async (
    key: string,
    // eslint-disable-next-line
    val: unknown,
    collectionName = 'config') =>
    fireStoreDoc.set(collectionName, key, val);

  /**
   * Retrieves a single document from a specified Firestore collection.
   * If no collection is specified, it defaults to the 'config' collection.
   */
  static getOneDoc = async (key: string, collectionName = 'config') =>
    fireStoreDoc.get(collectionName, key);

  /**
   * Deletes a single document from a specified Firestore collection.
   * If no collection is specified, it defaults to the 'config' collection.
   * Returns true on successful deletion, false otherwise.
   */
  static deleteOneDoc = async (key: string, collectionName = 'config') =>
    fireStoreDoc.delete(collectionName, key);

  /**
   * A utility function for processing and migrating data in Firestore.
   * This function is typically used for one-off data manipulation tasks.
   */
  static processData = async () => {
    // console.log('ExpenseAPI processData');
    // ProcessData.processBudget();
  };


  /**
   * Adds a new expense to Firestore and IndexedDB.
   * It generates a unique key for the expense based on its date and vendor,
   * updates the modified date, and then saves the expense.
   * Returns the expense object with the generated ID.
   */
  static addExpense = async (_expense: Expense, operation = 'update'): Promise<Expense> => {

    try {

      const expense = JSONCopy(_expense);
      const key = getDateJsIdFormat(new Date(expense.date)) + ' ' + expense.vendor.slice(0, 10);

      expense.modifiedDate = Date.now(); // date to epoch
      expense.cost = Number(expense.cost.toFixed(2));
      expense.operation = operation;

      const docRef = doc(db, 'expense', key);

      // eslint-disable-next-line
      const {id, ...expenseWithoutId} = expense;
      await setDoc(docRef, expenseWithoutId);

      expense.id = key;
      await FinanceIndexDB.addExpenseList([expense]);

      // Return a new object with the updated ID instead of modifying the original
      return expense;

    } catch (e) {
      ErrorHandlers.handleApiError(e);
      // console.error('Error adding document: ', e, _expense);
      return _expense;
    }
  };


  /**
   * Deletes an expense from both Firestore and IndexedDB.
   * The IndexedDB deletion is based on the expense's mailId.
   * Returns true on successful deletion, false otherwise.
   */
  static deleteExpense = async (expense: Expense): Promise<boolean> => {
    try {
      // First, delete from Firebase
      const docRef = doc(db, 'expense', expense.id);
      await deleteDoc(docRef);
      // console.debug('Expense deleted from Firebase with key: ', expense.id);

      // Then, delete from IndexedDB
      if (expense.mailId) {
        await FinanceIndexDB.deleteExpense(expense.mailId);
        // console.debug('Expense deleted from IndexedDB with mailId: ', expense.mailId);
      } else {
        // console.warn('No mailId found for expense, skipping IndexedDB deletion');
      }

      return true;
    } catch (e) {
      ErrorHandlers.handleApiError(e);
      // console.error('Error deleting expense:', e);
      return false;
    }
  };


  /**
   * Retrieves a list of expenses from Firestore and IndexedDB.
   * It fetches expenses modified after the last update timestamp stored in IndexedDB,
   * updates the local database, and returns the complete list of expenses.
   * An optional date can be provided to override the last update check.
   */
  static getExpenseList = async (overrideLastDate: number | undefined = undefined): Promise<Expense[]> => {
    try {
      const table = 'expense';
      let indexDocList: Expense[];
      const fireDocList: Expense[] = [];
      let lastUpdatedDate = getUnixTimestamp('2020-01-01');

      const configData = await FinanceIndexDB.getData('config', EXPENSE_LAST_UPDATE);
      if (configData) lastUpdatedDate = Number(configData.value);
      if (overrideLastDate) lastUpdatedDate = overrideLastDate;

      const q = query(collection(db, table), where('modifiedDate', '>=', lastUpdatedDate));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.docs.length) {
        fireDocList.push(...querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Expense)));
        await FinanceIndexDB.addExpenseList(fireDocList);
      }

      await FinanceIndexDB.addConfig([{key: EXPENSE_LAST_UPDATE, value: Date.now() - 3600000}]);
      indexDocList = await FinanceIndexDB.getAllData('expense');
      indexDocList = indexDocList.filter(item => item.operation !== 'delete');
      return indexDocList;
    } catch (e) {
      ErrorHandlers.handleApiError(e);
      // console.error('Error fetching expense list: ', e);
      return [];
    }
  };

  /**
   * Retrieves the list of tags from the 'tags' document in the 'config' collection.
   * Returns an array of strings representing the tags.
   */
  static getTagList = async () => {
    try {
      const table = 'config';

      const tagObject = await ExpenseAPI.getOneDoc('tags', table);
      const tagList: string[] = tagObject?.tagList || [];

      return tagList;
    } catch (e) {
      ErrorHandlers.handleApiError(e);
      // console.error('Error getting tag list: ', e);
      return [];
    }
  };

  /**
   * Updates the list of tags in the 'tags' document in the 'config' collection.
   */
  static updateTagList = async (tags: string[]) => {
    try {
      const table = 'config';
      await ExpenseAPI.setOneDoc('tags', {tagList: tags}, table);

    } catch (e) {
      ErrorHandlers.handleApiError(e);
      // console.error('Error updating tag list: ', e);
    }
  };

  /**
   * Retrieves the bank configuration from the 'bankConfig' document in the 'config' collection.
   * This includes settings for UPI and credit card expense tracking.
   */
  static getBankConfig = async (): Promise<BankConfig> => {
    try {
      const bankConfig = await ExpenseAPI.getOneDoc('bankConfig', 'config');

      // Return default config if not found
      if (!bankConfig) {
        return {
          enableUpi: false,
          creditCards: []
        };
      }

      return {
        enableUpi: bankConfig.enableUpi ?? false,
        creditCards: bankConfig.creditCards ?? []
      };

    } catch (e) {
      ErrorHandlers.handleApiError(e);
      // console.error('Error getting bank config:', e);
      return {
        enableUpi: false,
        creditCards: [],
      };
    }
  };

  /**
   * Updates the bank configuration in the 'bankConfig' document in the 'config' collection.
   * Returns true on success, false on failure.
   */
  static updateBankConfig = async (config: BankConfig) => {
    try {
      await ExpenseAPI.setOneDoc('bankConfig', config, 'config');
      // console.debug('Updated bank config:', config);
      return true;
    } catch (e) {
      ErrorHandlers.handleApiError(e);
      // console.error('Error updating bank config:', e);
      return false;
    }
  };

  /**
   * Retrieves the dark mode setting from the 'darkMode' document in the 'config' collection.
   * Returns true if dark mode is enabled, false otherwise.
   */
  static getDarkModeConfig = async (): Promise<boolean> => {

    try {
      const darkModeConfig = await ExpenseAPI.getOneDoc('darkMode', 'config');
      // Return default config if not found
      if (!darkModeConfig) {
        return false; // Default to light mode
      }
      // console.debug('Retrieved dark mode config:', darkModeConfig);
      return darkModeConfig.value;
    } catch (e) {
      ErrorHandlers.handleApiError(e);
      // console.error('Error getting dark mode config:', e);
      return false; // Default to light mode on error
    }
  };

  /**
   * Updates the dark mode setting in the 'darkMode' document in the 'config' collection.
   * Returns true on success, false on failure.
   */
  static updateDarkMode = async (val: boolean) => {
    try {
      const config = {
        value: val,
      };
      await ExpenseAPI.setOneDoc('darkMode', config, 'config');
      // console.debug('Updated darkMode config:', config);
      return true;
    } catch (e) {
      ErrorHandlers.handleApiError(e);
      // console.error('Error updating bank config:', e);
      return false;
    }
  };

  /**
   * Retrieves the list of vendor-to-tag mappings.
   * It fetches new or updated mappings from Firestore since the last check,
   * updates the local IndexedDB, and returns the full list.
   */
  static getVendorTagList = async (): Promise<VendorTag[]> => {
    try {
      const table = 'vendorTag';
      const fireDocList: VendorTag[] = [];
      let lastUpdatedDate = getUnixTimestamp('2020-01-01');

      const configData = await FinanceIndexDB.getData('config', TAG_LAST_UPDATE);
      if (configData) {
        lastUpdatedDate = Number(configData.value);
      }

      const q = query(collection(db, table), where('date', '>', lastUpdatedDate));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.docs.length) {
        fireDocList.push(...querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as VendorTag)));
        fireDocList.forEach(val => FinanceIndexDB.addVendorTag(val));
      }

      await FinanceIndexDB.addConfig([{key: TAG_LAST_UPDATE, value: Date.now() - 3600000}]);
      return await FinanceIndexDB.getAllData('vendorTag');
    } catch (e) {
      ErrorHandlers.handleApiError(e);
      // console.error('Error getting vendor tag list: ', e);
      return [];
    }
  };


  /**
   * Updates a vendor-to-tag mapping in Firestore.
   * It sets the modified date to the current time before updating.
   * Returns true on success, false on failure.
   */
  static updateVendorTag = async (vendorTag: VendorTag) => {
    try {
      // Extract ID for use as the document key
      const {id, ...vendorTagWithoutId} = vendorTag;
      vendorTagWithoutId.date = Date.now();

      // Update in Firestore
      const docRef = doc(db, 'vendorTag', id);
      await setDoc(docRef, vendorTagWithoutId);
      // console.debug('VendorTag updated in Firestore with ID:', id);
      return true;

    } catch (e) {
      ErrorHandlers.handleApiError(e);
      // console.error('Error updating vendorTag:', e);
      return false;
    }
  };

  /**
   * Deletes a vendor-to-tag mapping from Firestore.
   * Returns true on successful deletion, false otherwise.
   */
  static deleteVendorTag = async (vendorTagId: string): Promise<boolean> => {
    try {
      // Delete from Firestore
      const docRef = doc(db, 'vendorTag', vendorTagId);
      await deleteDoc(docRef);
      // console.debug('VendorTag deleted from Firestore with ID:', vendorTagId);

      return true;
    } catch (e) {
      ErrorHandlers.handleApiError(e);
      console.error('Error deleting vendorTag:', e);
      return false;
    }
  };


  /**
   * Automatically applies tags to past expenses based on vendor-to-tag mappings.
   * It fetches untagged expenses from a specified start date, matches them against
   * existing vendor tags, and updates them in batches.
   * Returns the number of expenses that were successfully tagged.
   */
  static autoTagPastExpenses = async (startDate: number): Promise<number> => {
    try {
      // console.log(`Auto-tagging expenses from ${new Date(startDate).toISOString()}`);

      // 1. Fetch all vendor tags from IndexDB
      const vendorTags: VendorTag[] = await FinanceIndexDB.getAllData('vendorTag');
      const vendorTagMap = new Map(vendorTags.map(vt => [vt.vendor.toLowerCase(), vt.tag]));

      if (vendorTagMap.size === 0) {
        // console.log('No vendor tags found. Aborting auto-tagging.');
        return 0;
      }

      // 2. Fetch expenses from Firestore starting from the given date
      const expenseQuery = query(collection(db, 'expense'),
        where('modifiedDate', '>=', startDate));
      const querySnapshot = await getDocs(expenseQuery);

      let processedCount = 0;
      const expensesToUpdate: Expense[] = [];

      querySnapshot.forEach((doc) => {
        const expense = {id: doc.id, ...doc.data()} as Expense;

        // Check if the expense already has a tag or is a payment
        if (expense.tag) {
          return;
        }

        const vendorLower = expense.vendor.toLowerCase();
        if (vendorTagMap.has(vendorLower)) {
          const newTag = vendorTagMap.get(vendorLower);
          if (newTag) {
            const updatedExpense: Expense = {
              ...expense,
              tag: newTag,
              modifiedDate: Date.now(),
            };
            expensesToUpdate.push(updatedExpense);
          }
        }
      });

      if (expensesToUpdate.length > 0) {
        processedCount = expensesToUpdate.length;
        // console.log('Auto tag past expenses for expense: ', expensesToUpdate);
        // console.log(`Found ${processedCount} expenses to auto-tag.`);

        const batchSize = 700;

        for (let i = 0; i < expensesToUpdate.length; i += batchSize) {
          const batch = expensesToUpdate.slice(i, i + batchSize);
          // console.log(`Processing batch ${i / batchSize + 1}...`);

          // Batch update expenses in Firestore
          const updatePromises = batch.map(async (expense) => {
            const {id, ...expenseWithoutId} = expense;
            if (id) {
              const docRef = doc(db, 'expense', id);
              await setDoc(docRef, expenseWithoutId);
            }
          });

          await Promise.all(updatePromises);

          // Update in IndexedDB
          await FinanceIndexDB.addExpenseList(batch);
          // console.log(`Batch ${i / batchSize + 1} processed.`);

          // Pause 1.5 sec between batches
          if (i + batchSize < expensesToUpdate.length) {
            await sleep(1500);
          }
        }

        // console.log('Successfully updated all expenses in Firestore and IndexedDB.');

      }

      return processedCount;

    } catch (e) {
      ErrorHandlers.handleApiError(e);
      console.error('Error during auto-tagging process: ', e);
      return 0;
    }
  };

  /**
   * Adds a new budget to Firestore and IndexedDB.
   * It generates a unique key for the budget based on its name,
   * updates the modified date, and then saves the budget.
   * Returns the budget object with the generated ID.
   */
  static addBudget = async (_budget: Budget, operation = 'update'): Promise<Budget> => {
    try {
      const budget = JSONCopy(_budget);
      const key = budget.name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();

      budget.modifiedDate = Date.now();
      budget.operation = operation;

      const docRef = doc(db, 'budget', key);

      // eslint-disable-next-line
      const {id, ...budgetWithoutId} = budget;
      await setDoc(docRef, budgetWithoutId);

      budget.id = key;
      await FinanceIndexDB.addBudgetList([budget]);

      return budget;

    } catch (e) {
      ErrorHandlers.handleApiError(e);
      console.error('Error adding budget: ', e, _budget);
      return _budget;
    }
  };

  /**
   * Updates an existing budget in Firestore and IndexedDB.
   * Returns the updated budget object.
   */
  static updateBudget = async (_budget: Budget): Promise<Budget> => {
    try {
      const budget = JSONCopy(_budget);
      budget.modifiedDate = Date.now();
      budget.operation = 'update';

      const docRef = doc(db, 'budget', budget.id);

      // eslint-disable-next-line
      const {id, ...budgetWithoutId} = budget;
      await setDoc(docRef, budgetWithoutId);

      await FinanceIndexDB.addBudgetList([budget]);

      return budget;

    } catch (e) {
      ErrorHandlers.handleApiError(e);
      console.error('Error updating budget: ', e, _budget);
      return _budget;
    }
  };

  /**
   * Deletes a budget from both Firestore and IndexedDB.
   * Returns true on successful deletion, false on failure.
   */
  static deleteBudget = async (budget: Budget): Promise<boolean> => {
    try {
      // First, delete from Firebase
      const docRef = doc(db, 'budget', budget.id);
      await deleteDoc(docRef);
      // console.debug('Budget deleted from Firebase with key: ', budget.id);

      // Then, delete from IndexedDB
      await FinanceIndexDB.deleteBudget(budget.id);
      // console.debug('Budget deleted from IndexedDB with id: ', budget.id);

      return true;
    } catch (e) {
      ErrorHandlers.handleApiError(e);
      console.error('Error deleting budget:', e);
      return false;
    }
  };

  /**
   * Retrieves a list of budgets from Firestore and IndexedDB.
   * It fetches budgets modified after the last update timestamp stored in IndexedDB,
   * updates the local database, and returns the complete list of budgets.
   * An optional date can be provided to override the last update check.
   */
  static getBudgetList = async (overrideLastDate: number | undefined = undefined): Promise<Budget[]> => {
    try {
      const table = 'budget';
      let indexDocList: Budget[];
      const fireDocList: Budget[] = [];
      let lastUpdatedDate = getUnixTimestamp('2020-01-01');

      const configData = await FinanceIndexDB.getData('config', BUDGET_LAST_UPDATE);
      if (configData) lastUpdatedDate = Number(configData.value);
      if (overrideLastDate) lastUpdatedDate = overrideLastDate;

      const q = query(collection(db, table), where('modifiedDate', '>=', lastUpdatedDate));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.docs.length) {
        fireDocList.push(...querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Budget)));
        await FinanceIndexDB.addBudgetList(fireDocList);
      }

      await FinanceIndexDB.addConfig([{key: BUDGET_LAST_UPDATE, value: Date.now() - 3600000}]);
      indexDocList = await FinanceIndexDB.getAllData('budget');
      indexDocList = indexDocList.filter(item => item.operation !== 'delete');
      return indexDocList;
    } catch (e) {
      ErrorHandlers.handleApiError(e);
      console.error('Error fetching budget list: ', e);
      return [];
    }
  };
}
