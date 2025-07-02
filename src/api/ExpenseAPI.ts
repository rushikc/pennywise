import {initializeApp} from 'firebase/app';
import {collection, doc, getDoc, getDocs, getFirestore, query, setDoc, where} from 'firebase/firestore/lite';
import {EXPENSE_LAST_UPDATE, TAG_LAST_UPDATE} from '../utility/constants';
import {getFirebaseConfig} from '../utility/firebase-public';
import {getDateFormat, getDateJsIdFormat, getDayJs, getDayJsToDate, getISODate} from "../utility/utility";
import {FinanceIndexDB} from './FinanceIndexDB';
import {tab} from "@testing-library/user-event/dist/tab";


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
            console.error("Error adding document: ", e);
        }
    }

    static processData = async () => {
        console.debug("Process Data Init");
        // ExpenseAPI.updateTagList(['food', 'groceries', 'amenities', 'veg & fruits', 'snacks', 'drinks', 'sports',
        //     'travel', 'cab', 'shopping', 'gadgets' , 'petrol', 'transport', 'bike', 'parents',
        //     'skin & hair', 'medical', 'clothes', 'rent', 'fitness', 'invalid']);
    }


    static getExpenseList = async (overrideLastDate: string | undefined = undefined) => {

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
        lastDateJS.add( -1, 'days');
        const lastDate = lastDateJS.toDate();

        await FinanceIndexDB.addConfig([{key: EXPENSE_LAST_UPDATE, value: lastDate}]);

        await FinanceIndexDB.getAllData("expense").then(data => indexDocList = data);


        console.debug('Firebase query for expenses - ', table, fireDocList);
        console.debug('IndexDB query for expenses - ', table, indexDocList);


        indexDocList.forEach(val => val.date = String(val.date));

        console.debug('FinalList query for expenses - ', table, indexDocList);
        return indexDocList;


    }

    static getTagList = async () => {
        let table = 'config';

        const tagObject: any = await ExpenseAPI.getOneDoc('tags', table);
        const tagList: string[] = tagObject.tagList;

        console.log('tagList ', tagList);

        return tagList;
    }

    static updateTagList = async (tags: string[]) => {
        let table = 'config';

        await ExpenseAPI.setOneDoc('tags', {tagList: tags}, table);
        // const tagObject : any = await ExpenseAPI.getOneDoc('tags', table);
        // const tagList: string[] = tagObject.tagList;

        console.log('set tagList ', tags);

    }

    static getTagMapList = async () => {

        let table = 'tagMap';


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

        console.debug('IndexDB  query for tagMap - ', table, indexDocList);
        console.debug('Firebase query for tagMap - ', table, fireDocList);

        const finalList = fireDocList.concat(indexDocList);

        finalList.forEach(val => val.date = String(val.date));

        console.debug('FinalList query for tagMap- ', table, finalList);
        return finalList;

    }


}
