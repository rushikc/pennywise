import { initializeApp } from 'firebase/app';
import { arrayUnion, collection, doc, getDoc, getDocs, getFirestore, query, setDoc, updateDoc, where } from 'firebase/firestore/lite';
import { EXPENSE_LAST_UPDATE } from '../utility/constants';
import { getFirabseConfig } from '../utility/firebase-public';
import { getDateMedJs, getISODate, setStorage } from "../utility/utility";
import { FinanceIndexDB } from './FinanceIndexDB';

const firebaseConfig = getFirabseConfig();

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);



export class ExpenseAPI {

    static addExpense = async (expense: any) => {

        try {
            let key = getDateMedJs(expense.date.seconds) + ' ' + expense.vendor.slice(0, 10);

            ExpenseAPI.getExpenseList().then((docList: any[]) => {
                let doc = docList.filter((dc) => docList === expense.id);
                console.log('doc list ', docList);
                console.log('doc from storage ', doc);
                console.log('doc from docList ', docList);
                console.log('doc from expense.id ', expense.id);
            });

            const docRef = doc(db, "expense", key);
            expense.date = getISODate(expense.date.seconds);
            delete expense.id;
            await setDoc(docRef, expense);

            console.log("Document written with key: ", expense);

        } catch (e) {
            console.error("Error adding document: ", e);
        }
    }


    static tagExpense = async (key: string, tag: string, autoTag: boolean) => {
        try {

            const docRef = doc(db, "expense", key);
            await updateDoc(docRef, {
                tag: arrayUnion(tag)
            });

            console.log("Document written with key: ", key);

        } catch (e) {
            console.error("Error adding document: ", e);
        }
    }


    static setOneDoc = async (key: string, val: any, collectionName: string = 'config') => {
        try {
            const docRef = doc(db, collectionName, key);
            await setDoc(docRef, val);
            console.log("Document written with key: ", key);
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


    static getAllDoc = async (collectionName: string) => {
        try {

            let key = collectionName;

            const querySnapshot = await getDocs(collection(db, collectionName));

            let docList: any[] = [];
            querySnapshot.forEach((doc) => {
                // doc.data() is never undefined for query doc snapshots
                // console.log(doc.id, " => ", doc.data());
                let document = doc.data();
                document.id = doc.id;
                docList.push(document)
            });
            console.log('Firebase query for - ', key, docList);
            setStorage(key, docList);
            return docList;

        } catch (e) {
            console.error("Error getting document: ", e);
            return [];
        }
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

            await FinanceIndexDB.addExpense(fireDocList);
        }


        FinanceIndexDB.addConfig([{ key: EXPENSE_LAST_UPDATE, value: new Date() }]);

        console.log('IndexDB  query for indexDocList - ', table, indexDocList);
        console.log('Firebase query for fireDocList - ', table, fireDocList);

        const finalList = fireDocList.concat(indexDocList);

        finalList.forEach(val => val.date = String(val.date));

        console.log('FinalList query for - ', table, fireDocList);
        return finalList;


    }





}