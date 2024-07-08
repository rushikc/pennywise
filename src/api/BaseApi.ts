import { initializeApp } from 'firebase/app';
import { addDoc, collection, doc, getFirestore, setDoc } from 'firebase/firestore/lite';
import { getFirabseConfig } from '../utility/firebase-public';
import { getDateMedJs } from '../utility/utility';


const firebaseConfig = getFirabseConfig();

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
    let key = getDateMedJs(expense.date.seconds)
      + ' ' + expense.vendor.slice(0, 10);
    const docRef = doc(db, "expense", key);
    await setDoc(docRef, {
      tag: expense.tag,
      date: new Date(expense.date.seconds * 1000),
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





export const setTagForExpense = async (tag: string) => {

  // Create an initial document to update.
  const frankDocRef = doc(db, "users", "frank no");
  await setDoc(frankDocRef, {
    name: "Frank",
    favorites: { food: "Pizza", color: "Blue", subject: "recess" },
    age: 12
  });

}

























