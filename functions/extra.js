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
  // console.log(res.messages.length);

  return;
  // Inbox Threads
  for (i=0; i < inbox.length; i++){ 
    let threadMessages = inbox[i].getMessages();
    // Thread Messages
    for (j=0; j < threadMessages.length; j++){
      let message = threadMessages[j].getBody();
      let subject = threadMessages[j].getSubject();
      let subject1 = threadMessages[j].getDate();

      var options = {
        'method' : 'post',
        'contentType': 'application/json',
        'payload' : JSON.stringify({"message": message, "subject": subject})
      };

    // console.log(threadMessages[j].getPlainBody());
    console.log(threadMessages[j].getDate());
    let date = threadMessages[j].getDate();


    let sn  = threadMessages[j].getPlainBody();
    snList = sn.split('\n');

    // console.log(snList);
    snArr = [];
    for(const s of snList){

      if(s.trim().includes('Warm Regards')){
        break;
      }

      if(s.trim().includes('visit HDFC Bank')){
        break;
      }

      if(snArr.length > 0 && s.trim() !== ''){
        snArr.push(s.trim());
      }

      if(s.includes('Dear')){
        snArr.push(s.trim());
      }

    }
  
    // console.log(snArr.join(" "));

    let snippet = snArr.join(" ");

    // let CREDIT_CARD_MSG = 'Dear Card Member, Thank you for using your HDFC Bank Credit Card ending 8566 for Rs 275.10 at ZOMATO on 23-02-2023 20:20:54. After the above transaction, the available balance on your card is Rs 39043.33 and the total outstanding is Rs 120956.67.'

    let CREDIT_CARD_MSG = 'Dear Card Member, Thank you for using your HDFC Bank Credit Card ending 8566 for Rs XX1 at XX2 on 23-02-2023 20:20:54. After the above transaction, the available balance on your card is Rs 39043.33 and the total outstanding is Rs 120956.67.';

      // let UPI_MSG = 'Dear Customer, Rs.325.00 has been debited from account **1811 to VPA paytmqr2810050501011mbudpzwmcfg@paytm on 28-02-23. Your UPI transaction reference number is 305922722804. Please call on 18002586161 to report if this transaction was not authorized by you.'

    let UPI_MSG = 'Dear Customer, XX1 has been debited from account **1811 to VPA XX2 on 28-02-23. Your UPI transaction reference number is 305922722804. Please call on 18002586161 to report if this transaction was not authorized by you.';
    
    let expense;
  
    if(snippet.includes('E-mandate')){
      console.log('-> E-mandate mail');
    }
    
    else if(snippet.includes('Thank you for using your HDFC Bank Credit Card ending 8566')){
  
      let CREDIT_CARD_MSG_SPLIT = CREDIT_CARD_MSG.split(' ');
      let SNIPPET_SPLIT = snippet.split(' ');
  
      let rsIndex = CREDIT_CARD_MSG_SPLIT.indexOf('XX1');
      let vendorIndex = CREDIT_CARD_MSG_SPLIT.indexOf('XX2');
  
      expense = getExpense(date);
  
      expense.cost = Number(SNIPPET_SPLIT[rsIndex])
      expense.vendor = SNIPPET_SPLIT[vendorIndex]

      // expenseList.push(expense);

      console.log('-> Credit card: ', expense.cost);
      console.log('-> Credit card: ', expense);

    }
  
    else if(snippet.includes('Your UPI transaction')){
      
      let UPI_MSG_SPLIT = UPI_MSG.split(' ');
      let SNIPPET_SPLIT = snippet.split(' ');
  
      let rsIndex = UPI_MSG_SPLIT.indexOf('XX1');
      let vendorIndex = UPI_MSG_SPLIT.indexOf('XX2');
  
  
      expense = getExpense(date);
  
      expense.cost = Number(SNIPPET_SPLIT[rsIndex].replace('Rs.', ''))
      expense.vendor = SNIPPET_SPLIT[vendorIndex]

      // expenseList.push(expense);

      console.log('-> UPI trans: ', expense.cost);
      console.log('-> UPI trans: ', expense);
    }
    }
  }
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



