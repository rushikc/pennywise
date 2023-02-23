import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDoc, getDocs, addDoc, doc, query, where } from 'firebase/firestore/lite';
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
    const docRef = await addDoc(collection(db, "expense"), {
      tag: expense.tag,
      date: new Date(expense.e_date),
      vendor: expense.vendor,
      user: expense.user,
      cost: expense.cost,
    });
    console.log("Document written with ID: ", docRef.id);

  } catch (e) {
    console.error("Error adding document: ", e);
  }
}


export const getExpenseList  = async () => {
  const querySnapshot = await getDocs(collection(db, "expense"));
  // console.log("docs => ",querySnapshot);

  let docList: any[] = [];

  querySnapshot.forEach((doc) => {
    // doc.data() is never undefined for query doc snapshots
    // console.log(doc.id, " => ", doc.data());
    let document = doc.data();
    document.id = doc.id;
    docList.push(document)
  });

  console.log(docList);
  
}


export const getUnTaggedExpenseList  = async () => {
  const q = query(collection(db, "expense"), where("tag", "==", null));
  const querySnapshot = await getDocs(q);

  // console.log("docs => ",querySnapshot);

  let docList: any[] = [];

  querySnapshot.forEach((doc) => {
    // doc.data() is never undefined for query doc snapshots
    // console.log(doc.id, " => ", doc.data());
    let document = doc.data();
    document.id = doc.id;
    docList.push(document)
  });

  console.log(docList);
  return docList;
}

























