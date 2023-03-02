const functions = require('firebase-functions');
const { DateTime } = require("luxon");
const { arrayUnion, collection, doc, getDoc, getDocs, getFirestore, query, setDoc, updateDoc, where } = require('firebase/firestore/lite');
const { initializeApp } = require('firebase/app');
const { getFirabseConfig } = require('./secrets');


const firebaseConfig = getFirabseConfig();;

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);



// const docRef = doc(db, "config", "gmailLastUpdated");
// getDoc(docRef).then((resp) => {
//   console.log(resp.data().value);
// });


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
exports.addGmailData = functions.https.onRequest((req, res) => {
  if (req.method === 'POST') {
    try{
      const expense = (req.body) || {};

      let key = DateTime.fromISO(new Date(expense.date).toISOString()).toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS).replaceAll('/', '-').replace(',', '') + ' ' +  expense.vendor.slice(0,10);
      const docRef = doc(db, "expense", key);

      setDoc(docRef, expense).then(() => {
        console.log('Executed setDoc');
      });

    }catch(err){
      res.send('Errorred - ' + err);
    }
    
    res.send('Executed setDoc');
  }else{
    res.send('Wrong method, use POST');
  }

});


exports.getOneDoc = functions.https.onRequest((req, res) => {

  if (req.method === 'POST') {
    try{
      const data = (req.body) || {};

      const docRef = doc(db, data.collection, data.key);
      // const docRef = doc(db, "config", "gmailLastUpdatd");
      getDoc(docRef).then((resp) => {
        console.log(resp.data());
        res.send(resp.data());
      });

    }catch(err){
      res.send('Errorred - ' + err);
    }

  }else{
    res.send('Wrong method, use POST');
  }

});


exports.setOneDoc = functions.https.onRequest((req, res) => {

  if (req.method === 'POST') {
    try{
      const data = (req.body) || {};

      const docRef = doc(db, data.collection, data.key);
      setDoc(docRef, data.json).then(() => {
        console.log('Executed setDoc');
      });

    }catch(err){
      res.send('Errorred - ' + err);
    }
    res.send('Executed');
  }else{
    res.send('Wrong method, use POST');
  }

});


exports.getAllDoc = functions.https.onRequest((req, res) => {
  
  if (req.method === 'POST') {
    try{
      const data = (req.body) || {};

      getDocs(collection(db, data.collection)).then((querySnapshot) => {
        let docList= [];
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

    }catch(err){
      res.send('Errorred - ' + err);
    }
    
  }else{
    res.send('Wrong method, use POST');
  }

});