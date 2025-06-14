import { Config, Expense, TagMap } from "./Types";



const dbName = "Finance";
const dbVersion = 4;

type TableNames = "expense" | "tagMap" | "config";

export class FinanceIndexDB {


    static initDB = () => {

        if (!indexedDB) {
            alert("IndexedDB is not available on this browser, this might increase firebase billing")
            console.debug("IndexedDB could not be found in this browser.");
        } else {

            console.debug("Initiating IndexedDB");

            const financeDB = indexedDB.open(dbName, dbVersion);

            financeDB.onupgradeneeded = function () {

                const db = financeDB.result;

                const expenseStore = db.createObjectStore("expense", { keyPath: "mailId" });
                expenseStore.createIndex("vendor_index", ["vendor"], { unique: false });
                expenseStore.createIndex("date_index", ["date"], { unique: false, });

                db.createObjectStore("tagMap", { keyPath: "vendor" });
                db.createObjectStore("config", { keyPath: "key" });

                console.debug("Created finance IndexedDB");

            };
        }
    }



    static getStoreInstance = async (storeName: TableNames, mode: IDBTransactionMode = "readwrite"): Promise<IDBObjectStore> => {

        return new Promise((resolve) => {
            const financeDB = indexedDB.open(dbName, dbVersion);
            financeDB.onsuccess = () => {
                const db = financeDB.result;
                const transaction = db.transaction(storeName, mode);
                const store = transaction.objectStore(storeName);
                resolve(store);
            }
        })


    }


    static addExpenseList = async (expenseList: Expense[]) => {

        console.debug("addExpense IndexedDB");
        const store = await this.getStoreInstance("expense");
        expenseList.forEach(expense => store.put(expense));

    }

    static addTagMap = async (tagMap: TagMap) => {
        console.debug("addTagMap IndexedDB");
        const store = await this.getStoreInstance("tagMap");
        store.put(tagMap);
    }


    static addConfig = async (configList: Config[]) => {

        // console.debug("addExpense IndexedDB");
        const store = await this.getStoreInstance("config");
        configList.forEach(config => store.put(config));

    }


    static getData = async (storeName: TableNames, keyPath: string): Promise<any> => {

        console.debug("getData IndexedDB - ", storeName, keyPath);

        return new Promise((resolve) => {
            const storePromise = this.getStoreInstance(storeName);
            storePromise.then(store => {
                const storeVal = store.get(keyPath);
                storeVal.onsuccess = () => resolve(storeVal.result);
            })

        })

    }

    static getAllData = async (storeName: TableNames): Promise<any[]> => {

        console.debug("getAllData IndexedDB - ", storeName);

        return new Promise((resolve) => {
            const storePromise = this.getStoreInstance(storeName);
            storePromise.then(store => {
                const storeVal = store.getAll();
                storeVal.onsuccess = () => resolve(storeVal.result);
            })

        })

    }





}
