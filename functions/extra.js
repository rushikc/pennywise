const functions = require('firebase-functions');

// // Create and deploy your first functions
// // https://firebase.google.com/docs/functions/get-started
//
// exports.addGmailData = functions.https.onRequest((request, response) => {
//   functions.logger.info('Hello logs!', {structuredData: true});
//   response.send('Hello from Firebase!');


// });

//////////////////////////////////////////////

const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

exports.addGmailData = functions.https.onRequest((request, response) => {
  db.doc('expense2/cx3').set({'cv': 'cc'});
  response.send('written to Firebase!'+ JSON.stringify(request.body()));
});




//////////////////////////////////////////////

const Firestore = require('@google-cloud/firestore');

const COLLECTION_NAME = 'cloud-functions-firestore';

const firestore = new Firestore({
  apiKey: 'AIzaSyDN8VN5Yemmrip9McWMeLVkhp9m9DAItzA',
  authDomain: 'finance-app-361514.firebaseapp.com',
  databaseURL: 'https://finance-app-361514-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'finance-app-361514',
  storageBucket: 'finance-app-361514.appspot.com',
  messagingSenderId: '542311218762',
  appId: '1:542311218762:web:3cec6c2e14b86f61d6f0b3',
  measurementId: 'G-Z4DSGVKBCB'
});



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
    // store/insert a new document
    const data = (req.body) || {};
    const ttl = Number.parseInt(data.ttl);
    const ciphertext = (data.ciphertext || '')
      .replace(/[^a-zA-Z0-9\-_!.,; ']*/g, '')
      .trim();
    const created = new Date().getTime();

    // .add() will automatically assign an ID
    return firestore.collection(COLLECTION_NAME).add({
      created,
      ttl,
      ciphertext
    }).then(doc => {
      console.info('stored new doc id#', doc.id);
      return res.status(200).send(doc);
    }).catch(err => {
      console.error(err);
      return res.status(404).send({
        error: 'unable to store',
        err
      });
    });
  }

  if (req.method === 'GET') {
    // store/insert a new document
    const created = new Date().getTime();

    // .add() will automatically assign an ID
    return firestore.collection(COLLECTION_NAME).add({
      'cx': 'cv'
    }).then(doc => {
      console.info('stored new doc id#', doc.id);
      return res.status(200).send(doc);
    }).catch(err => {
      console.error(err);
      return res.status(404).send({
        error: 'unable to store',
        err
      });
    });
  }

  // everything below this requires an ID
  if (!(req.query && req.query.id)) {
    return res.status(404).send({
      error: 'No II'
    });
  }
  const id = req.query.id.replace(/[^a-zA-Z0-9]/g, '').trim();
  if (!(id && id.length)) {
    return res.status(404).send({
      error: 'Empty ID'
    });
  }

  if (req.method === 'DELETE') {
    // delete an existing document by ID
    return firestore.collection(COLLECTION_NAME)
      .doc(id)
      .delete()
      .then(() => {
        return res.status(200).send({ status: 'ok' });
      }).catch(err => {
        console.error(err);
        return res.status(404).send({
          error: 'unable to delete',
          err
        });
      });
  }

  // read/retrieve an existing document by ID
  return firestore.collection(COLLECTION_NAME)
    .doc(id)
    .get()
    .then(doc => {
      if (!(doc && doc.exists)) {
        return res.status(404).send({
          error: 'Unable to find the document'
        });
      }
      const data = doc.data();
      if (!data) {
        return res.status(404).send({
          error: 'Found document is empty'
        });
      }
      return res.status(200).send(data);
    }).catch(err => {
      console.error(err);
      return res.status(404).send({
        error: 'Unable to retrieve the document',
        err
      });
    });
});








//APP_Scripts

function myFunction(){
  let inbox = GmailApp.getInboxThreads(0, 10);
  res =  Gmail.Users.Messages.list('me');

  res1 =  Gmail.Users.Messages.get('me', res.messages[1].id)
  console.log(res1);
    
}


const getExpense = (date) => {
  return {
      cost: 0,
      vendor: null,
      tag: null,
      date: new Date(date),
      user: 'rushi',
  };
}



