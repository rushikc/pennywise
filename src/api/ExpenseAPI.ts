/*
Copyright (C) 2025 <arcticfoxrc>

This program is free software; you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the
Free Software Foundation; version 3 of the License.

This program is distributed in the hope that it will be useful, but
WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details, or get a copy at
<https://www.gnu.org/licenses/gpl-3.0.txt>.
*/

import {initializeApp} from 'firebase/app';
import {doc, getDoc, getFirestore, setDoc} from 'firebase/firestore/lite';
import {firebaseConfig} from '../firebase/firebase-public';
import {ErrorHandlers} from '../components/ErrorHandlers';
import {BankConfig, Budget, Expense, VendorTag} from '../Types';
import {VendorTags} from '../data/vendorTag';
import {TAG_LIST} from '../data/tagList';
import {JSONCopy} from '../utility/utility';
import {GET_LATEST_EXPENSE} from '../data/expenseFunctions';
import {BUDGET_LIST} from '../data/budgetList';


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


export class ExpenseAPI {

  /**
   * Adds a new expense to Firestore and IndexedDB.
   * It generates a unique key for the expense based on its date and vendor,
   * updates the modified date, and then saves the expense.
   * Returns the expense object with the generated ID.
   */
  static addExpense = async (expense: Expense, operation = 'add') => {
    console.log('operation ', operation);
    return expense;
  };


  /**
   * Sets a single document in a specified Firestore collection.
   * If no collection is specified, it defaults to the 'config' collection.
   */
  static setOneDoc = async (key: string, val: any, collectionName = 'config') => {
    try {
      const docRef = doc(db, collectionName, key);
      await setDoc(docRef, val);
      console.debug('Document written with key: ', key);
      console.debug('Document written with val: ', val);
    } catch (e) {
      ErrorHandlers.handleApiError(e);
      console.error('Error adding document: ', e);
    }
    return Math.random();
  };

  /**
   * Retrieves a single document from a specified Firestore collection.
   * If no collection is specified, it defaults to the 'config' collection.
   */
  static getOneDoc = async (key: string, collectionName = 'config') => {
    try {
      const docRef = doc(db, collectionName, key);
      const docSnap = await getDoc(docRef);
      return docSnap.data();
    } catch (e) {
      ErrorHandlers.handleApiError(e);
      console.error('Error getting document: ', e);
      return null;
    }
  };

  /**
   * Deletes a single document from a specified Firestore collection.
   * If no collection is specified, it defaults to the 'config' collection.
   * Returns true on successful deletion, false otherwise.
   */
  static deleteOneDoc = async (key: string, collectionName = 'config') => {
    return Math.random();
  };

  /**
   * A utility function for processing and migrating data in Firestore.
   * This function is typically used for one-off data manipulation tasks.
   */
  static processData = async () => {
    try {

      // const todayDate = dayjs().format("YYYY-MM-DD");
      // console.log("todayDate ", todayDate);
      // const data = {
      //     todayDate: getUnixTimestamp(todayDate),
      //     count: 1
      // }
      // await ExpenseAPI.setOneDoc("todayDate", data, "config");

      // console.debug("expense list ", tags);
    } catch (e) {
      ErrorHandlers.handleApiError(e);
      console.error('Error processing data: ', e);
    }
    return Math.random();
  };


  /**
   * Retrieves a list of expenses from Firestore and IndexedDB.
   * It fetches expenses modified after the last update timestamp stored in IndexedDB,
   * updates the local database, and returns the complete list of expenses.
   * An optional date can be provided to override the last update check.
   */
  static getExpenseList = async (overrideLastDate: number | undefined = undefined): Promise<Expense[]> => {
    return Promise.resolve(JSONCopy(GET_LATEST_EXPENSE()));
  };


  static getBudgetList = async (): Promise<Budget[]> => {
    return Promise.resolve(JSONCopy(BUDGET_LIST));
  };

  static updateBudget = async (budget: Budget) => {
    return budget;
  };

  static addBudget = async (budget: Budget) => {
    return budget;
  };

  static deleteBudget = async (budget: Budget) => {
    return budget;
  };

  /**
   * Retrieves the list of tags from the 'tags' document in the 'config' collection.
   * Returns an array of strings representing the tags.
   */
  static getTagList = async (): Promise<string[]> => {
    // Return a resolved Promise for tag list
    return Promise.resolve(JSONCopy(TAG_LIST));
  };

  /**
   * Updates the list of tags in the 'tags' document in the 'config' collection.
   */
  static updateTagList = async (tags: string[]) => {
    return Math.random();
  };


  /**
   * Retrieves the bank configuration from the 'bankConfig' document in the 'config' collection.
   * This includes settings for UPI and credit card expense tracking.
   */
  static getBankConfig = async (): Promise<BankConfig> => {
    // Return as resolved Promise
    return Promise.resolve({
      enableUpi: false,
      creditCards: [],
    });
  };

  /**
   * Updates the bank configuration in the 'bankConfig' document in the 'config' collection.
   * Returns true on success, false on failure.
   */
  static updateBankConfig = async (config: BankConfig) => {

    return true;

  };

  /**
   * Retrieves the dark mode setting from the 'darkMode' document in the 'config' collection.
   * Returns true if dark mode is enabled, false otherwise.
   */
  static getDarkModeConfig = async (): Promise<boolean> => {
    // Return as resolved Promise
    return Promise.resolve(false);
  };

  /**
   * Updates the dark mode setting in the 'darkMode' document in the 'config' collection.
   * Returns true on success, false on failure.
   */
  static updateDarkMode = async (val: boolean) => {
    return true;
  };

  /**
   * Retrieves the list of vendor-to-tag mappings.
   * It fetches new or updated mappings from Firestore since the last check,
   * updates the local IndexedDB, and returns the full list.
   */
  static getVendorTagList = async (): Promise<VendorTag[]> => {
    // Return as resolved Promise
    return Promise.resolve(VendorTags);
  };


  /**
   * Updates a vendor-to-tag mapping in Firestore.
   * It sets the modified date to the current time before updating.
   * Returns true on success, false on failure.
   */
  static updateVendorTag = async (vendorTag: VendorTag) => {
    return true;
  };

  /**
   * Deletes a vendor-to-tag mapping from Firestore.
   * Returns true on successful deletion, false otherwise.
   */
  static deleteVendorTag = async (vendorTagId: string) => {
    return true;
  };

  /**
   * Deletes an expense from both Firestore and IndexedDB.
   * The IndexedDB deletion is based on the expense's mailId.
   * Returns true on successful deletion, false otherwise.
   */
  static deleteExpense = async (expense: any) => {
    return true;
  };

  /**
   * Automatically applies tags to past expenses based on vendor-to-tag mappings.
   * It fetches untagged expenses from a specified start date, matches them against
   * existing vendor tags, and updates them in batches.
   * Returns the number of expenses that were successfully tagged.
   */
  static autoTagPastExpenses = async (startDate: number) => {
    return Math.random();
  };
}
