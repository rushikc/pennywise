import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDoc, getDocs, addDoc, doc, query, where, setDoc } from 'firebase/firestore/lite';
import { getDate, getDateFromISO, getDateTimeSecFromISO, getTimeFromISO, getTimeSecFromISO } from '../utility/utility';
import { Expense } from './Types';


const firebaseConfig = {
    apiKey: "AIzaSyDN8VN5Yemmrip9McWMeLVkhp9m9DAItzA",
    authDomain: "finance-app-361514.firebaseapp.com",
    databaseURL: "https://finance-app-361514-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "finance-app-361514",
    storageBucket: "finance-app-361514.appspot.com",
    messagingSenderId: "542311218762",
    appId: "1:542311218762:web:3cec6c2e14b86f61d6f0b3",
    measurementId: "G-Z4DSGVKBCB"
  };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


export const addUser = async () => {
  try {
    const docRef = await addDoc(collection(db, "users"), {
      first: "Ada",
      last: "Lovelace",
      born: 1815
    });
    console.log("Document written with ID: ", docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
}


export const addExpense = async (expense: any) => {
  try { 
    let key = getDateTimeSecFromISO(expense.e_date).replaceAll('/', '-').replace(',', '')
    + ' ' +  expense.vendor.slice(0, 10);
    const docRef = doc(db, "expense", key);
    await setDoc(docRef,  {
      tag: expense.tag,
      date: new Date(expense.e_date),
      vendor: expense.vendor,
      user: expense.user,
      cost: expense.cost,
    });

    // console.log("expense : ", expense);
    // console.log("key : ", key);
    console.log("Document written with key: ", key);

  } catch (e) {
    console.error("Error adding document: ", e);
  }
}





export const setTagForExpense  = async (tag: string) => {

    // Create an initial document to update.
  const frankDocRef = doc(db, "users", "frank no");
  await setDoc(frankDocRef, {
    name: "Frank",
    favorites: { food: "Pizza", color: "Blue", subject: "recess" },
    age: 12
  });

}

























