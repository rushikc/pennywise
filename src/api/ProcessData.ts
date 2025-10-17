/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/


import {DocumentData, ExpenseAPI} from './ExpenseAPI';
import {collection, getDocs, getFirestore, query} from 'firebase/firestore/lite';
import {initializeApp} from 'firebase/app';
import {firebaseConfig} from '../firebase/firebase-public';
import {isEmpty, JSONCopy, sleep} from '../utility/utility';
import {ErrorHandlers} from '../components/ErrorHandlers';
import {Budget} from '../Types';


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);



export class ProcessData {

  static processVendorNames = async () => {
    try {
      console.log('Process Data Init');

      // const q = query(collection(db, "expense"), where("date", ">", new Date("2020-01-01")));
      const q = query(collection(db, 'expense'));
      const querySnapshot = await getDocs(q);

      const queryResultLen = querySnapshot.docs.length;
      console.log('Process Query Result Length: ', queryResultLen);
      let count = 0;

      const expenseList: DocumentData[] = [];

      if (queryResultLen) {

        querySnapshot.forEach((doc) => {
          // doc.data() is never undefined for query doc snapshots

          const document: DocumentData = doc.data();

          // Check if vendor exists and is a string
          if (!document.vendor || typeof document.vendor !== 'string') {
            expenseList.push(document);
            count++;
            return; // Skip processing this document
          }

          const vendor: string = document.vendor;
          const upiPattern = /^([^\s@]+@[^\s@]+)\s+(.+)$/;
          // const upiPattern = /^(.+)\s+([^\s@]+@[^\s@]+)$/;
          const match = vendor.match(upiPattern);

          if (match && !isEmpty(match[1]) && !isEmpty(match[2])) {
            // Name comes first, then UPI ID
            let name = match[2].trim();
            const upiId = match[1].trim();

            if (name.includes('manual entry')) {
              name = 'manual entry'; // to discard any UUID text before manual entry
            }

            console.log('Parsed ', `${name} ${upiId}`);
            document.vendor = `${name} ${upiId}`.toUpperCase();
            console.log('Updated ', document);
          }

          expenseList.push(document);


          count++;


          // document.date = document.date.seconds * 1000;
          // const date = new Date(doc.id.substring(0,19));

          // console.log(doc.id, ' => ', JSONCopy(document));
          // document['modifiedDate'] = document.date;

          // console.debug('modified => ', JSONCopy(document));

        });

      }

      count = 0;
      console.log('Total Documents To Be Processed: ', expenseList.length);

      for (const expense of expenseList) {

        if (count < 500) {
          await ExpenseAPI.addExpense(JSONCopy(expense));
          count++;
        }

        if (count > 495) {
          console.log('Sleeping for 3 sec to avoid firestore write limit');
          await sleep(3000);
          count = 0;
        }
      }

      // console.debug("expense list ", tags);
    } catch (e) {
      ErrorHandlers.handleApiError(e);
      console.error('Error processing data: ', e);
    }
  };

  static processBudget = async () => {
    try {

      const budgetList: Budget[] = [
        {
          'id': '1234567890abcdef',
          'name': 'Total',
          'amount': 50000,
          'tagList': ['All'],
          'modifiedDate': Date.now(),
        },
        {
          'id': '1234567890abcded',
          'name': 'Food',
          'amount': 30000,
          'tagList': ['food', 'groceries', 'snacks'],
          'modifiedDate': Date.now(),
        },
        {
          'id': '1234567890abcdej',
          'name': 'Travel',
          'amount': 10000,
          'tagList': ['transport'],
          'modifiedDate': Date.now(),
        }
      ];

      console.log('Process Data Init');
      budgetList.forEach(budget => {
        ExpenseAPI.setOneDoc(crypto.randomUUID(), budget, 'budget');
      });

    } catch (e) {
      ErrorHandlers.handleApiError(e);
      console.error('Error processing data: ', e);
    }
  };

}
