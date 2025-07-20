/*
Copyright (C) 2025 Rushikesh <rushikc.dev@gmail.com>

This program is free software; you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the
Free Software Foundation; version 3 of the License.

This program is distributed in the hope that it will be useful, but
WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details, or get a copy at
<https://www.gnu.org/licenses/gpl-3.0.txt>.
*/

import { initializeApp } from 'firebase/app';
import { addDoc, collection, doc, getFirestore, setDoc } from 'firebase/firestore/lite';
import { getFirebaseConfig } from '../../src/firebase/firebase-public';
import { getDateMedJs } from '../../src/utility/utility';


const firebaseConfig = getFirebaseConfig();

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


export const addExpenseAPI = async (expense: any) => {
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

























