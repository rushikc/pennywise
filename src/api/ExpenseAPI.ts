import { initializeApp } from 'firebase/app';
import { arrayUnion, collection, doc, getDoc, getDocs, getFirestore, query, setDoc, updateDoc, where } from 'firebase/firestore/lite';
import { getFirabseConfig } from '../utility/secrets';
import { getDateTimeSecFromISO, getStorage, setStorage } from "../utility/utility";

const firebaseConfig = getFirabseConfig();

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);



export class ExpenseAPI {

    static addExpense = async (expense: any) => {
        try { 
            let key = getDateTimeSecFromISO(expense.date.toISOString()).replaceAll('/', '-').replace(',', '')
            + ' ' +  expense.vendor.slice(0, 10);
            const docRef = doc(db, "expense", key);
            await setDoc(docRef, expense);
        
            console.log("Document written with key: ", key);
        
          } catch (e) {
            console.error("Error adding document: ", e);
          }
    }

    
    static tagExpense = async (key: string, tag: string) => {
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

    static addConfig = async (key: string, val: string | number) => {
        try {
            const docRef = doc(db, "config", key);
            await setDoc(docRef,  {value: val});        
        } catch (e) {
            console.error("Error adding document: ", e);
        }
    }

    static getConfig = async (key: string) => {
        try {
            const docRef = doc(db, "config", key);
            const docSnap = await getDoc(docRef);
            // @ts-ignore
            return docSnap.data().value;
        
        } catch (e) {
            console.error("Error adding document: ", e);
        }
    }


    static getExpenseList  = async () => {

        let key = 'AllExpenseList';

        let storageVal = getStorage(key);
        if(storageVal){
            console.log('Storage - ', key, storageVal);
            return storageVal;
        }

        const querySnapshot = await getDocs(collection(db, "expense"));
      
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
        
    }


    static getUnTaggedExpenseList  = async () => {

        let key = 'unTaggedExpense';

        let storageVal = getStorage(key);
        if(storageVal){
            console.log('Storage - ', key, storageVal);
            return storageVal;
        }

        const q = query(collection(db, "expense"), where("tag", "==", null));
        const querySnapshot = await getDocs(q);
            
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
    }



}