import {initializeApp} from 'firebase/app';
import {collection, deleteDoc, doc, getDoc, getDocs, getFirestore, query, setDoc, where} from 'firebase/firestore/lite';
import {EXPENSE_LAST_UPDATE, TAG_LAST_UPDATE} from '../utility/constants';
import {getFirebaseConfig} from '../firebase/firebase-public';
import {getDateFormat, getDateJsIdFormat, getDayJs, getISODate} from "../utility/utility";
import {FinanceIndexDB} from './FinanceIndexDB';
import {ErrorHandlers} from '../components/ErrorHandlers';
import {VendorTag} from "../Types";


const firebaseConfig = getFirebaseConfig();

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


export class ExpenseAPI {

    static addExpense = async (expense: any) => {

        try {

            let key = getDateJsIdFormat(expense.date) + ' ' + expense.vendor.slice(0, 10);
            // console.log("Document written with expense: ", JSONCopy(expense));

            expense.date = new Date(expense.date); // date to epoch

            const docRef = doc(db, "expense", key);
            const {id, ...expenseWithoutId} = expense;
            await setDoc(docRef, expenseWithoutId);

            await FinanceIndexDB.addExpenseList([expense]);

        } catch (e) {
            ErrorHandlers.handleApiError(e);
            console.error("Error adding document: ", e);
        }
    }


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

    static processData = async () => {
        try {
            console.log("Process Data Init");

            // const tags =await ExpenseAPI.getVendorTagList();
            // const tga1 = tags[1];
            // console.log("Vendor Tag List: ", tags);

            // tags.forEach(tag => {
            //     tag.date = new Date(tag.date);
            //     ExpenseAPI.updateVendorTag(tag);
            // })
            // ExpenseAPI.updateTagMap(tga1);

            // console.log("expense list ", tags);
        } catch (e) {
            ErrorHandlers.handleApiError(e);
            console.error("Error processing data: ", e);
        }
    }


    static getExpenseList = async (overrideLastDate: string | undefined = undefined) => {
        try {
            let table = 'expense';

            let indexDocList: any[] = [];
            let fireDocList: any[] = [];

            let lastUpdatedDate: Date = new Date("2020-01-01"); // to fetch all expenses


            await FinanceIndexDB.getData("config", EXPENSE_LAST_UPDATE).then(data => {
                // console.log("index db config ", getDateFormat(data.value));
                if (data) {
                    lastUpdatedDate = new Date(getDateFormat(data.value));
                    // lastUpdatedDate = new Date("2025-06-13"); // to fetch FROM CUSTOM DATE
                }
            });

            if (overrideLastDate) {
                lastUpdatedDate = new Date(overrideLastDate);
            }

            console.log("lastUpdatedDate ", lastUpdatedDate);

            // return null;

            const q = query(collection(db, table), where("date", ">", lastUpdatedDate));
            const querySnapshot = await getDocs(q);

            const queryResultLen = querySnapshot.docs.length;

            if (queryResultLen) {

                querySnapshot.forEach((doc) => {
                    // doc.data() is never undefined for query doc snapshots
                    // console.log(doc.id, " => ", doc.data());
                    let document = doc.data();
                    document.id = doc.id;
                    document.date = getISODate(document.date.seconds);
                    fireDocList.push(document)
                });

                await FinanceIndexDB.addExpenseList(fireDocList);
            }


            const lastDateJS = getDayJs();
            const lastDate = lastDateJS.subtract(1, 'days').toDate();

            await FinanceIndexDB.addConfig([{key: EXPENSE_LAST_UPDATE, value: lastDate}]);

            await FinanceIndexDB.getAllData("expense").then(data => indexDocList = data);


            console.debug('Firebase query for expenses - ', table, fireDocList);
            console.debug('IndexDB query for expenses - ', table, indexDocList);


            indexDocList.forEach(val => val.date = String(val.date));

            console.debug('FinalList query for expenses - ', table, indexDocList);
            return indexDocList;
        } catch (e) {
            ErrorHandlers.handleApiError(e);
            console.error("Error fetching expense list: ", e);
            return [];
        }
    }

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

    static updateTagList = async (tags: string[]) => {
        try {
            let table = 'config';
            await ExpenseAPI.setOneDoc('tags', {tagList: tags}, table);

        } catch (e) {
            ErrorHandlers.handleApiError(e);
            console.error("Error updating tag list: ", e);
        }
    }

    static getBankConfig = async () => {
        try {
            const bankConfig: any = await ExpenseAPI.getOneDoc('bank', 'config');

            // Return default config if not found
            if (!bankConfig) {
                return {
                    enableUpi: false,
                    creditCards: []
                };
            }

            console.log('Retrieved bank config:', bankConfig);
            return bankConfig;
        } catch (e) {
            ErrorHandlers.handleApiError(e);
            console.error("Error getting bank config:", e);
            return {
                enableUpi: false,
                creditCards: []
            };
        }
    }

    static updateBankConfig = async (config: { enableUpi: boolean, creditCards: string[] }) => {
        try {
            await ExpenseAPI.setOneDoc('bank', config, 'config');
            console.log('Updated bank config:', config);
            return true;
        } catch (e) {
            ErrorHandlers.handleApiError(e);
            console.error("Error updating bank config:", e);
            return false;
        }
    }

    static getVendorTagList = async () => {
        try {
            let table = 'vendorTag';

            let indexDocList: any[] = [];
            let fireDocList: any[] = [];

            let lastUpdatedDate: Date = new Date("2020-01-01"); // to fetch all expenses
            let isLastUpdateAvailable = false;


            await FinanceIndexDB.getData("config", TAG_LAST_UPDATE).then(data => {
                // console.log("index db config ", data);
                if (data) {
                    lastUpdatedDate = new Date(data.value);
                    // lastUpdatedDate = new Date("2025-06-12"); // to fetch FROM CUSTOM DATE
                    isLastUpdateAvailable = true;
                }
            });

            if (isLastUpdateAvailable) {
                await FinanceIndexDB.getAllData("vendorTag").then(data => indexDocList = data);
            }

            // console.log(" lastUpdatedDate ", lastUpdatedDate);

            const q = query(collection(db, table), where("date", ">", lastUpdatedDate));
            // const q = query(collection(db, table));
            const querySnapshot = await getDocs(q);

            const queryResultLen = querySnapshot.docs.length;

            if (queryResultLen) {

                querySnapshot.forEach((doc) => {
                    // doc.data() is never undefined for query doc snapshots
                    // console.log(doc.id, " => ", doc.data());
                    let document = doc.data();
                    document.id = doc.id;
                    document.date = getISODate(document.date.seconds);
                    fireDocList.push(document)
                });

                fireDocList.forEach(val => FinanceIndexDB.addVendorTag(val));
            }

            const lastDateJS = getDayJs();
            const lastDate = lastDateJS.subtract(1, 'days').toDate();

            console.log("Last Date for vendorTag - ", lastDate);

            await FinanceIndexDB.addConfig([{key: TAG_LAST_UPDATE, value: lastDate}]);

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


    static updateVendorTag = async (vendorTag: VendorTag) => {
        try {
            // Extract ID for use as the document key
            const {id, ...vendorTagWithoutId} = vendorTag;
            vendorTagWithoutId.date = new Date();

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
}
