import {initializeApp} from 'firebase/app';
import {collection, doc, getDoc, getDocs, getFirestore, query, setDoc, where} from 'firebase/firestore/lite';
import {EXPENSE_LAST_UPDATE, TAG_LAST_UPDATE} from '../utility/constants';
import {getFirebaseConfig} from '../utility/firebase-public';
import {getDateJsIdFormat, getISODate} from "../utility/utility";
import {FinanceIndexDB} from './FinanceIndexDB';


const firebaseConfig = getFirebaseConfig();

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


export class ExpenseAPI {

    static addExpense = async (expense: any) => {

        try {

            let key = getDateJsIdFormat(expense.date) + ' ' + expense.vendor.slice(0, 10);
            // console.log("Document written with key: ", key);
            // console.log("Document written with expense: ", JSONCopy(expense));

            // const expenseNew = JSONCopy(expense);
            expense.date = new Date(expense.date); // date to epoch

            const docRef = doc(db, "expense", key);
            const {id, ...expenseWithoutId} = expense;
            await setDoc(docRef, expenseWithoutId);

            await FinanceIndexDB.addExpenseList([expense]);

        } catch (e) {
            console.error("Error adding document: ", e);
        }
    }


    static setOneDoc = async (key: string, val: any, collectionName: string = 'config') => {
        try {
            const docRef = doc(db, collectionName, key);
            await setDoc(docRef, val);
            console.log("Document written with key: ", key);
            console.log("Document written with val: ", val);
        } catch (e) {
            console.error("Error adding document: ", e);
        }
    }

    static getOneDoc = async (key: string, collectionName: string = 'config') => {
        try {
            const docRef = doc(db, collectionName, key);
            const docSnap = await getDoc(docRef);
            // @ts-ignore
            return docSnap.data().value;

        } catch (e) {
            console.error("Error adding document: ", e);
        }
    }

    static processData = async () => {

        // const q = query(collection(db, 'tagMap'));
        // const querySnapshot = await getDocs(q);

        // const queryResultLen = querySnapshot.docs.length;

        // if (queryResultLen) {

        //     querySnapshot.forEach((doc) => {
        //         // doc.data() is never undefined for query doc snapshots
        //         console.log(doc.id, " => ", doc.data());
        //         let document = doc.data();
        //         document.date = new Date();
        //         document.vendor = document.vendor.toUpperCase();

        //         this.setOneDoc(document.vendor, document, 'tagMap');
        //         // document.id = doc.id;
        //         // document.date = String(document.date);

        //     });

        // }


    }


    static getExpenseList = async () => {

        let table = 'expense';


        let indexDocList: any[] = [];
        let fireDocList: any[] = [];

        let lastUpdatedDate: Date = new Date("2020-01-01"); // to fetch all expenses
        let isLastUpdateAvailable = false;


        await FinanceIndexDB.getData("config", EXPENSE_LAST_UPDATE).then(data => {
            // console.log("index db config ", data);
            if (data) {
                lastUpdatedDate = new Date(data.value);
                isLastUpdateAvailable = true;
            }
        });

        if (isLastUpdateAvailable) {
            await FinanceIndexDB.getAllData("expense").then(data => indexDocList = data);
        }

        // console.log(" lastUpdatedDate ", lastUpdatedDate);

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


        // FinanceIndexDB.addConfig([{ key: EXPENSE_LAST_UPDATE, value: new Date() }]);
        await FinanceIndexDB.addConfig([{key: EXPENSE_LAST_UPDATE, value: new Date()}]);

        console.log('IndexDB query for expenses - ', table, indexDocList);
        console.log('Firebase query for expenses - ', table, fireDocList);

        const finalList = fireDocList.concat(indexDocList);

        finalList.forEach(val => val.date = String(val.date));

        console.log('FinalList query for expenses - ', table, finalList);
        return finalList;


    }

    static getTagList = async () => {

        let table = 'tagMap';


        let indexDocList: any[] = [];
        let fireDocList: any[] = [];

        let lastUpdatedDate: Date = new Date("2020-01-01"); // to fetch all expenses
        let isLastUpdateAvailable = false;


        await FinanceIndexDB.getData("config", TAG_LAST_UPDATE).then(data => {
            // console.log("index db config ", data);
            if (data) {
                lastUpdatedDate = new Date(data.value);
                isLastUpdateAvailable = true;
            }
        });

        if (isLastUpdateAvailable) {
            await FinanceIndexDB.getAllData("tagMap").then(data => indexDocList = data);
        }

        // console.log(" lastUpdatedDate ", lastUpdatedDate);

        const q = query(collection(db, table), where("date", ">", lastUpdatedDate));
        const querySnapshot = await getDocs(q);

        const queryResultLen = querySnapshot.docs.length;

        if (queryResultLen) {

            querySnapshot.forEach((doc) => {
                // doc.data() is never undefined for query doc snapshots
                // console.log(doc.id, " => ", doc.data());
                let document = doc.data();
                document.id = doc.id;
                document.date = String(document.date);
                fireDocList.push(document)
            });

            fireDocList.forEach(val => FinanceIndexDB.addTagMap(val));
        }


        await FinanceIndexDB.addConfig([{key: TAG_LAST_UPDATE, value: new Date()}]);

        console.log('IndexDB  query for tagMap - ', table, indexDocList);
        console.log('Firebase query for tagMap - ', table, fireDocList);

        const finalList = fireDocList.concat(indexDocList);

        finalList.forEach(val => val.date = String(val.date));

        console.log('FinalList query for tagMap- ', table, finalList);
        return finalList;

    }


}