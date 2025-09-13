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

import {initializeApp} from 'firebase/app';
import {collection, deleteDoc, doc, getDoc, getDocs, getFirestore, query, setDoc, where} from 'firebase/firestore/lite';
import {EXPENSE_LAST_UPDATE, TAG_LAST_UPDATE} from '../utility/constants';
import {firebaseConfig} from '../firebase/firebase-public';
import {getDateJsIdFormat, getUnixTimestamp} from "../utility/utility";
import {FinanceIndexDB} from './FinanceIndexDB';
import {ErrorHandlers} from '../components/ErrorHandlers';
import {BankConfig, Expense, VendorTag} from "../Types";


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


export class ExpenseAPI {

    /**
     * Adds a new expense to Firestore and IndexedDB.
     * It generates a unique key for the expense based on its date and vendor,
     * updates the modified date, and then saves the expense.
     * Returns the expense object with the generated ID.
     */
    static addExpense = async (expense: Expense): Promise<Expense> => {

        try {

            // console.log('Creating expense...', expense);

            let key = getDateJsIdFormat(new Date(expense.date)) + ' ' + expense.vendor.slice(0, 10);
            // console.debug("Document written with expense: ", JSONCopy(expense));

            expense.modifiedDate = Date.now(); // date to epoch
            expense.cost = Number(expense.cost.toFixed(2));

            const docRef = doc(db, "expense", key);
            const {id, ...expenseWithoutId} = expense;
            await setDoc(docRef, expenseWithoutId);

            await FinanceIndexDB.addExpenseList([expense]);

            // Return a new object with the updated ID instead of modifying the original
            return {
                ...expense,
                id: key
            };

        } catch (e) {
            ErrorHandlers.handleApiError(e);
            console.error("Error adding document: ", e);
            return expense;
        }
    }


    /**
     * Sets a single document in a specified Firestore collection.
     * If no collection is specified, it defaults to the 'config' collection.
     */
    static setOneDoc = async (key: string, val: any, collectionName: string = 'config') => {
        try {
            const docRef = doc(db, collectionName, key);
            await setDoc(docRef, val);
            console.debug("Document written with key: ", key);
            console.debug("Document written with val: ", val);
        } catch (e) {
            ErrorHandlers.handleApiError(e);
            console.error("Error adding document: ", e);
        }
    }

    /**
     * Retrieves a single document from a specified Firestore collection.
     * If no collection is specified, it defaults to the 'config' collection.
     */
    static getOneDoc = async (key: string, collectionName: string = 'config') => {
        try {
            const docRef = doc(db, collectionName, key);
            const docSnap = await getDoc(docRef);
            // @ts-ignore
            return docSnap.data();
        } catch (e) {
            ErrorHandlers.handleApiError(e);
            console.error("Error getting document: ", e);
            return null;
        }
    }

    /**
     * Deletes a single document from a specified Firestore collection.
     * If no collection is specified, it defaults to the 'config' collection.
     * Returns true on successful deletion, false otherwise.
     */
    static deleteOneDoc = async (key: string, collectionName: string = 'config') => {
        try {
            const docRef = doc(db, collectionName, key);
            await deleteDoc(docRef);
            console.debug("Document deleted with key: ", key);
            return true;
        } catch (e) {
            ErrorHandlers.handleApiError(e);
            console.error("Error deleting document: ", e);
            return false;
        }
    }

    /**
     * A utility function for processing and migrating data in Firestore.
     * This function is typically used for one-off data manipulation tasks.
     */
    static processData = async () => {
        try {
            console.debug("Process Data Init");


            // const q = query(collection(db, "expense"), where("date", ">", new Date("2020-01-01")));
            // const q = query(collection(db, "expense"));
            // const querySnapshot = await getDocs(q);
            //
            // const queryResultLen = querySnapshot.docs.length;
            // console.debug("Query Result Length: ", queryResultLen);
            // let count = 0;
            // if (queryResultLen) {
            //
            //
            //     querySnapshot.forEach((doc) => {
            //         // doc.data() is never undefined for query doc snapshots
            //         let document = doc.data();
            //         if(document.modifiedDate === undefined) {
            //         //     document.date = document.date.seconds * 1000;
            //             // const date = new Date(doc.id.substring(0,19));
            //
            //             console.debug(doc.id, " => ", JSONCopy(document));
            //             document['modifiedDate'] = document.date;
            //
            //             console.debug("modified => ", JSONCopy(document));
            //
            //
            //             if(count < 700) {
            //                 ExpenseAPI.setOneDoc(doc.id, document, 'expense');
            //                 count++;
            //             }
            //         }
            //
            //     });
            //     console.debug("Total Documents Processed: ", count);
            // }

            // console.debug("expense list ", tags);
        } catch (e) {
            ErrorHandlers.handleApiError(e);
            console.error("Error processing data: ", e);
        }
    }


    /**
     * Retrieves a list of expenses from Firestore and IndexedDB.
     * It fetches expenses modified after the last update timestamp stored in IndexedDB,
     * updates the local database, and returns the complete list of expenses.
     * An optional date can be provided to override the last update check.
     */
    static getExpenseList = async (overrideLastDate: number | undefined = undefined): Promise<Expense[]> => {
        try {
            let table = 'expense';

            let indexDocList: any[] = [];
            let fireDocList: any[] = [];

            let lastUpdatedDate = getUnixTimestamp("2020-01-01"); // to fetch all expenses


            await FinanceIndexDB.getData("config", EXPENSE_LAST_UPDATE).then(data => {
                // console.debug("index db config ", getDateFormat(data.value));
                if (data) {
                    lastUpdatedDate = data.value;
                    // lastUpdatedDate = new Date("2025-06-13"); // to fetch FROM CUSTOM DATE
                }
            });

            if (overrideLastDate) {
                lastUpdatedDate = overrideLastDate;
            }

            console.log("lastUpdatedDate ", lastUpdatedDate);

            // return null;

            const q = query(collection(db, table), where("modifiedDate", ">", lastUpdatedDate));
            const querySnapshot = await getDocs(q);

            const queryResultLen = querySnapshot.docs.length;

            console.debug("Expense Query Result Length: ", queryResultLen);

            if (queryResultLen) {

                querySnapshot.forEach((doc) => {
                    // doc.data() is never undefined for query doc snapshots
                    // console.debug(doc.id, " => ", doc.data());
                    let document = doc.data();
                    document.id = doc.id;
                    fireDocList.push(document)
                });

                await FinanceIndexDB.addExpenseList(fireDocList);
            }


            await FinanceIndexDB.addConfig([{key: EXPENSE_LAST_UPDATE, value: Date.now() - 3600000}]);

            await FinanceIndexDB.getAllData("expense").then(data => indexDocList = data);


            console.log('Firebase query for expenses - ', table, fireDocList);
            console.log('IndexDB query for expenses - ', table, indexDocList);


            console.debug('FinalList query for expenses - ', table, indexDocList);
            return indexDocList;
        } catch (e) {
            ErrorHandlers.handleApiError(e);
            console.error("Error fetching expense list: ", e);
            return [];
        }
    }

    /**
     * Retrieves the list of tags from the 'tags' document in the 'config' collection.
     * Returns an array of strings representing the tags.
     */
    static getTagList = async () => {
        try {
            let table = 'config';

            const tagObject: any = await ExpenseAPI.getOneDoc('tags', table);
            const tagList: string[] = tagObject?.tagList || [];

            return tagList;
        } catch (e) {
            ErrorHandlers.handleApiError(e);
            console.error("Error getting tag list: ", e);
            return [];
        }
    }

    /**
     * Updates the list of tags in the 'tags' document in the 'config' collection.
     */
    static updateTagList = async (tags: string[]) => {
        try {
            let table = 'config';
            await ExpenseAPI.setOneDoc('tags', {tagList: tags}, table);

        } catch (e) {
            ErrorHandlers.handleApiError(e);
            console.error("Error updating tag list: ", e);
        }
    }

    /**
     * Retrieves the bank configuration from the 'bankConfig' document in the 'config' collection.
     * This includes settings for UPI and credit card expense tracking.
     */
    static getBankConfig = async (): Promise<BankConfig> => {
        try {
            const bankConfig: any = await ExpenseAPI.getOneDoc('bankConfig', 'config');

            // Return default config if not found
            if (!bankConfig) {
                return {
                    enableUpi: false,
                    creditCards: []
                };
            }

            console.debug('Retrieved bank config:', bankConfig);
            return bankConfig;
        } catch (e) {
            ErrorHandlers.handleApiError(e);
            console.error("Error getting bank config:", e);
            return {
                enableUpi: false,
                creditCards: [],
            };
        }
    }

    /**
     * Updates the bank configuration in the 'bankConfig' document in the 'config' collection.
     * Returns true on success, false on failure.
     */
    static updateBankConfig = async (config: BankConfig) => {
        try {
            await ExpenseAPI.setOneDoc('bankConfig', config, 'config');
            console.debug('Updated bank config:', config);
            return true;
        } catch (e) {
            ErrorHandlers.handleApiError(e);
            console.error("Error updating bank config:", e);
            return false;
        }
    }

    /**
     * Retrieves the dark mode setting from the 'darkMode' document in the 'config' collection.
     * Returns true if dark mode is enabled, false otherwise.
     */
    static getDarkModeConfig = async (): Promise<boolean> => {

        try {
            const darkModeConfig: any = await ExpenseAPI.getOneDoc('darkMode', 'config');
            // Return default config if not found
            if (!darkModeConfig) {
                return false; // Default to light mode
            }
            console.debug('Retrieved dark mode config:', darkModeConfig);
            return darkModeConfig.value;
        } catch (e) {
            ErrorHandlers.handleApiError(e);
            console.error("Error getting dark mode config:", e);
            return false; // Default to light mode on error
        }
    }

    /**
     * Updates the dark mode setting in the 'darkMode' document in the 'config' collection.
     * Returns true on success, false on failure.
     */
    static updateDarkMode = async (val: boolean) => {
        try {
            const config = {
                value: val,
            }
            await ExpenseAPI.setOneDoc('darkMode', config, 'config');
            console.debug('Updated darkMode config:', config);
            return true;
        } catch (e) {
            ErrorHandlers.handleApiError(e);
            console.error("Error updating bank config:", e);
            return false;
        }
    }

    /**
     * Retrieves the list of vendor-to-tag mappings.
     * It fetches new or updated mappings from Firestore since the last check,
     * updates the local IndexedDB, and returns the full list.
     */
    static getVendorTagList = async (): Promise<VendorTag[]> => {
        try {
            let table = 'vendorTag';

            let indexDocList: any[] = [];
            let fireDocList: any[] = [];

            let lastUpdatedDate = getUnixTimestamp("2020-01-01"); // to fetch all expenses
            let isLastUpdateAvailable = false;

            await FinanceIndexDB.getData("config", TAG_LAST_UPDATE).then(data => {
                // console.debug("index db config ", data);
                if (data) {
                    lastUpdatedDate = data.value;
                    // lastUpdatedDate = new Date("2025-06-12"); // to fetch FROM CUSTOM DATE
                    isLastUpdateAvailable = true;
                }
            });

            if (isLastUpdateAvailable) {
                await FinanceIndexDB.getAllData("vendorTag").then(data => indexDocList = data);
            }

            // console.debug(" lastUpdatedDate ", lastUpdatedDate);

            const q = query(collection(db, table), where("date", ">", lastUpdatedDate));
            // const q = query(collection(db, table));
            const querySnapshot = await getDocs(q);

            const queryResultLen = querySnapshot.docs.length;

            if (queryResultLen) {

                querySnapshot.forEach((doc) => {
                    // doc.data() is never undefined for query doc snapshots
                    // console.debug(doc.id, " => ", doc.data());
                    let document = doc.data();
                    document.id = doc.id;
                    fireDocList.push(document)
                });

                fireDocList.forEach(val => FinanceIndexDB.addVendorTag(val));
            }


            await FinanceIndexDB.addConfig([{key: TAG_LAST_UPDATE, value: Date.now() - 3600000}]);

            console.log('IndexDB  query for vendorTag - ', table, indexDocList);
            console.log('Firebase query for vendorTag - ', table, fireDocList);

            await FinanceIndexDB.getAllData("vendorTag").then(data => indexDocList = data);

            console.debug('FinalList query for vendorTag- ', table, indexDocList);
            return indexDocList;
        } catch (e) {
            ErrorHandlers.handleApiError(e);
            console.error("Error getting vendor tag list: ", e);
            return [];
        }
    }


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
            const docRef = doc(db, "vendorTag", id);
            await setDoc(docRef, vendorTagWithoutId);
            console.debug("VendorTag updated in Firestore with ID:", id);
            return true;

        } catch (e) {
            ErrorHandlers.handleApiError(e);
            console.error("Error updating vendorTag:", e);
            return false;
        }
    }

    /**
     * Deletes a vendor-to-tag mapping from Firestore.
     * Returns true on successful deletion, false otherwise.
     */
    static deleteVendorTag = async (vendorTagId: string): Promise<boolean> => {
        try {
            // Delete from Firestore
            const docRef = doc(db, "vendorTag", vendorTagId);
            await deleteDoc(docRef);
            console.debug("VendorTag deleted from Firestore with ID:", vendorTagId);

            return true;
        } catch (e) {
            ErrorHandlers.handleApiError(e);
            console.error("Error deleting vendorTag:", e);
            return false;
        }
    }

    /**
     * Deletes an expense from both Firestore and IndexedDB.
     * The IndexedDB deletion is based on the expense's mailId.
     * Returns true on successful deletion, false otherwise.
     */
    static deleteExpense = async (expense: any): Promise<boolean> => {
        try {
            // First, delete from Firebase
            const docRef = doc(db, "expense", expense.id);
            await deleteDoc(docRef);
            console.debug("Expense deleted from Firebase with key: ", expense.id);

            // Then, delete from IndexedDB
            if (expense.mailId) {
                await FinanceIndexDB.deleteExpense(expense.mailId);
                console.debug("Expense deleted from IndexedDB with mailId: ", expense.mailId);
            } else {
                console.warn("No mailId found for expense, skipping IndexedDB deletion");
            }

            return true;
        } catch (e) {
            ErrorHandlers.handleApiError(e);
            console.error("Error deleting expense: ", e);
            return false;
        }
    }

    /**
     * Automatically applies tags to past expenses based on vendor-to-tag mappings.
     * It fetches untagged expenses from a specified start date, matches them against
     * existing vendor tags, and updates them in batches.
     * Returns the number of expenses that were successfully tagged.
     */
    static autoTagPastExpenses = async (startDate: number): Promise<number> => {
        try {
            console.log(`Auto-tagging expenses from ${new Date(startDate).toISOString()}`);

            // 1. Fetch all vendor tags from IndexDB
            const vendorTags: VendorTag[] = await FinanceIndexDB.getAllData('vendorTag');
            const vendorTagMap = new Map(vendorTags.map(vt => [vt.vendor.toLowerCase(), vt.tag]));

            if (vendorTagMap.size === 0) {
                console.log("No vendor tags found. Aborting auto-tagging.");
                return 0;
            }

            // 2. Fetch expenses from Firestore starting from the given date
            const expenseQuery = query(collection(db, "expense"),
                where("modifiedDate", ">=", startDate));
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
                console.log("Auto tag past expenses for expense: ", expensesToUpdate);
                console.log(`Found ${processedCount} expenses to auto-tag.`);

                const batchSize = 700;

                for (let i = 0; i < expensesToUpdate.length; i += batchSize) {
                    const batch = expensesToUpdate.slice(i, i + batchSize);
                    console.log(`Processing batch ${i / batchSize + 1}...`);

                    // Batch update expenses in Firestore
                    const updatePromises = batch.map(async (expense) => {
                        const {id, ...expenseWithoutId} = expense;
                        if (id) {
                            const docRef = doc(db, "expense", id);
                            await setDoc(docRef, expenseWithoutId);
                        }
                    });

                    await Promise.all(updatePromises);

                    // Update in IndexedDB
                    await FinanceIndexDB.addExpenseList(batch);
                    // console.log(`Batch ${i / batchSize + 1} processed.`);

                    // Pause 1.5 sec between batches
                    if (i + batchSize < expensesToUpdate.length) {
                        await new Promise(resolve => setTimeout(resolve, 1500));
                    }
                }

                console.log("Successfully updated all expenses in Firestore and IndexedDB.");

            } else {
                console.log("No expenses needed auto-tagging.");
            }

            return processedCount;

        } catch (e) {
            ErrorHandlers.handleApiError(e);
            console.error("Error during auto-tagging process: ", e);
            return 0;
        }
    }
}
