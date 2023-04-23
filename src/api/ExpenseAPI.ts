import { initializeApp } from 'firebase/app';
import { arrayUnion, collection, doc, getDoc, getDocs , getFirestore, query, setDoc, updateDoc, where } from 'firebase/firestore/lite';
import { getFirabseConfig } from '../utility/secrets';
import { getDateMedJs, getDateTimeSecFromISO, getISODate, getStorage, setStorage } from "../utility/utility";

const firebaseConfig = getFirabseConfig();

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);



export class ExpenseAPI {

    static addExpense = async (expense: any) => {
        
        try { 
            let key = getDateMedJs(expense.date.seconds) + ' ' +  expense.vendor.slice(0, 10);

            ExpenseAPI.getExpenseList().then((docList: any[]) => {
                let doc = docList.filter((dc)=> docList === expense.id);
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


    static setOneDoc = async ( key: string, val: any, collectionName: string = 'config') => {
        try {
            const docRef = doc(db, collectionName, key);
            await setDoc(docRef,  val);    
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
            
            let storageVal = getStorage(key);
            if(storageVal){
                console.log('Storage - ', key, storageVal);
                return storageVal;
            }

            const querySnapshot = await getDocs(collection(db, collectionName));
            let docList: any[]= [];
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
        }
    }


    static getExpenseList  = async () => {

        let key = 'expense';

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


  


}