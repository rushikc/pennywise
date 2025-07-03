// noinspection JSUnresolvedReference

const {onRequest} = require("firebase-functions/v2/https");
const dayjs = require("dayjs");
const utc = require('dayjs/plugin/utc');
dayjs.extend(utc)

// Add these imports for Firebase Admin SDK

const admin = require('firebase-admin'); // Import the admin SDK
const { getFirestore } = require('firebase-admin/firestore'); // Import Firestore from admin SDK

// Initialize the Admin SDK
// When deployed to Cloud Functions, it automatically picks up credentials
// from the service account associated with the function.
admin.initializeApp();

// Get the Firestore instance from the Admin SDK
const db = getFirestore(); // No need to pass 'app' here

// --- Keep your existing onRequest functions ---
// For the 'onRequest' functions, the core logic of interacting with 'db'
// will now use the Admin SDK's capabilities.

exports.addExpenseData = onRequest((req, res) => {
    if (req.method === 'POST') {
        try {
            const expense = (req.body) || {};

            let key = dayjs(expense.date).utcOffset(330)
                .format('DD MMM YY, hh:mm A') + ' ' + expense.vendor.slice(0, 10);

            const docRef = db.collection("expense").doc(key);

            expense.date = new Date(expense.date);
            // setDoc is now using the admin SDK's db instance
            docRef.set(expense).then(() => {
                console.log('Executed setDoc');
                res.send('Executed setDoc'); // Make sure to send response after async operation
            }).catch(err => {
                console.error('Error in addExpenseData setDoc:', err);
                res.status(500).send('Error - ' + err.message);
            });

        } catch (err) {
            console.error('Error in addExpenseData:', err);
            res.status(500).send('Error - ' + err.message);
        }

    } else {
        res.status(405).send('Wrong method, use POST'); // Use appropriate status code
    }

});


exports.getOneDoc = onRequest((req, res) => {

    if (req.method === 'POST') {
        try {
            const data = (req.body) || {};

            const docRef = db.collection(data.collection).doc(data.key);
            docRef.get().then((resp) => {
                console.log(resp.data());
                res.send(resp.data());
            }).catch(err => {
                console.error('Error in getOneDoc getDoc:', err);
                res.status(500).send('Error - ' + err.message);
            });

        } catch (err) {
            console.error('Error in getOneDoc:', err);
            res.status(500).send('Error - ' + err.message);
        }

    } else {
        res.status(405).send('Wrong method, use POST');
    }

});


exports.setOneDoc = onRequest((req, res) => {

    if (req.method === 'POST') {
        try {
            const data = (req.body) || {};

            const docRef = db.collection(data.collection).doc(data.key);
            docRef.set(data.json).then(() => {
                console.log('Executed setDoc');
                res.send('Executed'); // Make sure to send response after async operation
            }).catch(err => {
                console.error('Error in setOneDoc setDoc:', err);
                res.status(500).send('Error - ' + err.message);
            });

        } catch (err) {
            console.error('Error in setOneDoc:', err);
            res.status(500).send('Error - ' + err.message);
        }
    } else {
        res.status(405).send('Wrong method, use POST');
    }

});


exports.getAllDoc = onRequest((req, res) => {

    if (req.method === 'POST') {
        try {
            const data = (req.body) || {};

            db.collection(data.collection).get().then((querySnapshot) => {
                let docList = [];
                querySnapshot.forEach((doc) => {
                    let document = doc.data();
                    document.id = doc.id;
                    docList.push(document)
                });
                res.send(docList);
            }).catch(err => {
                console.error('Error in getAllDoc getDocs:', err);
                res.status(500).send('Error - ' + err.message);
            });

        } catch (err) {
            console.error('Error in getAllDoc:', err);
            res.status(500).send('Error - ' + err.message);
        }

    } else {
        res.status(405).send('Wrong method, use POST');
    }

});

