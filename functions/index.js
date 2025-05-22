const {onRequest} = require("firebase-functions/v2/https");

const dayjs = require("dayjs");
const utc = require('dayjs/plugin/utc');
dayjs.extend(utc)

const { arrayUnion, collection, doc, getDoc, getDocs, getFirestore, query, setDoc, updateDoc, where } = require('firebase/firestore/lite');
const { initializeApp } = require('firebase/app');
const { getFirebaseConfig } = require('./secrets');


const firebaseConfig = getFirebaseConfig();

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


/**
* Retrieve or store a method in Firestore
*
* Responds to any HTTP request.
*
* GET = retrieve
* POST = store (no update)
*
* success: returns the document content in JSON format & status=200
*    else: returns an error:<string> & status=404
*
* @param {!express:Request} req HTTP request context.
* @param {!express:Response} res HTTP response context.
*/
exports.addExpenseData = onRequest((req, res) => {
  if (req.method === 'POST') {
    try {
      const expense = (req.body) || {};

      let key = dayjs(expense.date).utcOffset(330)
        .format('DD MMM YY, hh:mm A') + ' ' + expense.vendor.slice(0, 10);

      const docRef = doc(db, "expense", key);

      expense.date = new Date(expense.date);
      setDoc(docRef, expense).then(() => {
        console.log('Executed setDoc');
      });

    } catch (err) {
      res.send('Error - ' + err);
    }

    res.send('Executed setDoc');
  } else {
    res.send('Wrong method, use POST');
  }

});


exports.getOneDoc = onRequest((req, res) => {

  if (req.method === 'POST') {
    try {
      const data = (req.body) || {};

      const docRef = doc(db, data.collection, data.key);
      // const docRef = doc(db, "config", "gmailLastUpdate");
      getDoc(docRef).then((resp) => {
        console.log(resp.data());
        res.send(resp.data());
      });

    } catch (err) {
      res.send('Error - ' + err);
    }

  } else {
    res.send('Wrong method, use POST');
  }

});


exports.setOneDoc = onRequest((req, res) => {

  if (req.method === 'POST') {
    try {
      const data = (req.body) || {};

      const docRef = doc(db, data.collection, data.key);
      setDoc(docRef, data.json).then(() => {
        console.log('Executed setDoc');
      });

    } catch (err) {
      res.send('Errorred - ' + err);
    }
    res.send('Executed');
  } else {
    res.send('Wrong method, use POST');
  }

});


exports.getAllDoc = onRequest((req, res) => {

  if (req.method === 'POST') {
    try {
      const data = (req.body) || {};

      getDocs(collection(db, data.collection)).then((querySnapshot) => {
        let docList = [];
        querySnapshot.forEach((doc) => {
          // doc.data() is never undefined for query doc snapshots
          // console.log(doc.id, " => ", doc.data());
          let document = doc.data();
          document.id = doc.id;
          docList.push(document)
        });
        // console.log('Firebase query for - ', docList);
        res.send(docList);
      });

    } catch (err) {
      res.send('Error - ' + err);
    }

  } else {
    res.send('Wrong method, use POST');
  }

});