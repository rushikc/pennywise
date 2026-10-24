/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

/* eslint-disable */
// noinspection JSUnusedGlobalSymbols
// noinspection JSUnresolvedReference

const {setGlobalOptions} = require('firebase-functions/v2');
const {onCall, onRequest} = require('firebase-functions/v2/https');
const {onMessagePublished} = require('firebase-functions/v2/pubsub');
const {defineSecret, defineString} = require('firebase-functions/params');
const {functionsServiceAccountEmail, loadGcpNames} = require('./gcpNames');

const gcpNames = loadGcpNames();
const firebaseConfig = process.env.FIREBASE_CONFIG
  ? JSON.parse(process.env.FIREBASE_CONFIG)
  : {};
const projectId = process.env.GCLOUD_PROJECT
  || process.env.GCP_PROJECT
  || firebaseConfig.projectId;
if (projectId) {
  setGlobalOptions({
    region: gcpNames.functionsRegion,
    serviceAccount: functionsServiceAccountEmail(projectId),
  });
}

const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
dayjs.extend(utc);
require('dotenv').config();

// Add these imports for Firebase Admin SDK

const admin = require('firebase-admin'); // Import the admin SDK
const {getFirestore} = require('firebase-admin/firestore'); // Import Firestore from admin SDK

const {detect, mergedTag, defaultRules} = require('./dedupe/rules');
const {shouldScanExpense, shouldWriteKeepTag, pickReviewSurvivor, mergeRuleset} =
  require('./dedupe/apply');

// Initialize the Admin SDK
// When deployed to Cloud Functions, it automatically picks up credentials
// from the service account associated with the function.
admin.initializeApp();

// Get the Firestore instance from the Admin SDK
const db = getFirestore(); // No need to pass 'app' here

const oauthClientSecret = defineSecret('pennywise-oauth-client-secret');
const geminiApiKey = defineSecret('pennywise-gemini-api-key');
const oauthClientId = defineString('GOOGLE_OAUTH_CLIENT_ID');
const {createTokenStore} = require('./gmail/tokenStore');
const {createGmailCallables} = require('./gmail/callables');
const gmailTokenStore = createTokenStore();

function gmailCallables() {
  return createGmailCallables({
    db,
    tokenStore: gmailTokenStore,
    projectId: process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT,
    clientId: oauthClientId.value(),
    clientSecret: oauthClientSecret.value(),
    fetchImpl: fetch,
    now: () => Date.now(),
  });
}

exports.connectGmail = onCall({secrets: [oauthClientSecret]}, (request) =>
  gmailCallables().connectGmail(request));

exports.disconnectGmail = onCall({secrets: [oauthClientSecret]}, (request) =>
  gmailCallables().disconnectGmail(request));

const {handleGmailPush} = require('./gmail/push');

exports.onGmailPush = onMessagePublished({
  topic: gcpNames.pubsubTopic,
  secrets: [oauthClientSecret, geminiApiKey],
}, (event) => handleGmailPush({
  db,
  tokenStore: gmailTokenStore,
  projectId: process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT,
  clientId: oauthClientId.value(),
  clientSecret: oauthClientSecret.value(),
  geminiKey: geminiApiKey.value(),
  message: event.data && event.data.message,
  fetchImpl: fetch,
}));


// --- Keep your existing onRequest functions ---
// For the 'onRequest' functions, the core logic of interacting with 'db'
// will now use the Admin SDK's capabilities.

const invalidResponse = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  500: 'Internal Server Error'
};

exports.addExpenseData = onRequest(async (req, res) => {

  const userEmail = process.env.USER_EMAIL;
  const validationStatus = await isValidRequest(req, userEmail);
  if (validationStatus !== 200) {
    res.status(validationStatus).send(invalidResponse[validationStatus]);
    return;
  }

  try {
    const expense = req.body;

    let key = dayjs(expense.date).utc().utcOffset(330)
      .format('DD MMM YY, hh:mm A') + ' ' + expense.vendor.slice(0, 10);

    const docRef = db.collection('expense').doc(key);

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

});


exports.getOneDoc = onRequest(async (req, res) => {

  const userEmail = process.env.USER_EMAIL;
  const validationStatus = await isValidRequest(req, userEmail);
  if (validationStatus !== 200) {
    res.status(validationStatus).send(invalidResponse[validationStatus]);
    return;
  }

  try {
    const data = req.body;

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

});


exports.setOneDoc = onRequest(async (req, res) => {

  const userEmail = process.env.USER_EMAIL;
  const validationStatus = await isValidRequest(req, userEmail);
  if (validationStatus !== 200) {
    res.status(validationStatus).send(invalidResponse[validationStatus]);
    return;
  }

  try {
    const data = req.body;

    const docRef = db.collection(data.collection).doc(data.key);
    docRef.set(data.json).then(() => {
      console.log('Executed setDoc');
      res.send('Executed setOneDoc'); // Make sure to send response after async operation
    }).catch(err => {
      console.error('Error in setOneDoc setDoc:', err);
      res.status(500).send('Error - ' + err.message);
    });

  } catch (err) {
    console.error('Error in setOneDoc:', err);
    res.status(500).send('Error - ' + err.message);
  }
});


exports.getAllDoc = onRequest(async (req, res) => {

  const userEmail = process.env.USER_EMAIL;
  const validationStatus = await isValidRequest(req, userEmail);
  if (validationStatus !== 200) {
    res.status(validationStatus).send(invalidResponse[validationStatus]);
    return;
  }

  try {
    const data = req.body;

    db.collection(data.collection).get().then((querySnapshot) => {
      let docList = [];
      querySnapshot.forEach((doc) => {
        let document = doc.data();
        document.id = doc.id;
        docList.push(document);
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

});


exports.dedupeExpenses = onRequest(async (req, res) => {
  const userEmail = process.env.USER_EMAIL;
  const validationStatus = await isValidRequest(req, userEmail);
  if (validationStatus !== 200) {
    res.status(validationStatus).send(invalidResponse[validationStatus]);
    return;
  }

  try {
    const days = typeof req.body.days === 'number' ? req.body.days : 7;
    const dryRun = req.body.dryRun !== false;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    let ruleset = defaultRules;
    try {
      const rulesDoc = await db.collection('config').doc('dedupeRules').get();
      if (rulesDoc.exists && rulesDoc.data()) {
        ruleset = mergeRuleset(defaultRules, rulesDoc.data());
      }
    } catch (rulesErr) {
      console.warn('dedupeExpenses: using default rules', rulesErr.message);
    }

    const snapshot = await db.collection('expense')
        .where('date', '>=', cutoff)
        .get();

    const expenses = [];
    snapshot.forEach((doc) => {
      const data = doc.data() || {};
      if (!shouldScanExpense(data)) {
        return;
      }
      expenses.push({id: doc.id, ...data});
    });

    const {pairs, needsReview} = detect(expenses, ruleset);

    const report = {
      dryRun,
      days,
      scanned: expenses.length,
      pairCount: pairs.length,
      reviewCount: needsReview.length,
      inflationRemoved: pairs.reduce((sum, p) => sum + Number(p.drop.cost || 0), 0),
      pairs: pairs.map((p) => ({
        rule: p.rule,
        confidence: p.confidence,
        deltaMinutes: p.deltaMinutes,
        keep: {id: p.keep.id, vendor: p.keep.vendor, cost: p.keep.cost, date: p.keep.date},
        drop: {id: p.drop.id, vendor: p.drop.vendor, cost: p.drop.cost, date: p.drop.date},
      })),
      needsReview: needsReview.map((r) => ({
        reason: r.reason,
        deltaMinutes: r.deltaMinutes,
        a: {id: r.a.id, vendor: r.a.vendor, cost: r.a.cost},
        b: {id: r.b.id, vendor: r.b.vendor, cost: r.b.cost},
      })),
    };

    if (dryRun) {
      res.send(report);
      return;
    }

    const now = Date.now();
    const writes = [];

    for (const pair of pairs) {
      const inheritedTag = mergedTag(pair.keep, pair.drop);
      if (shouldWriteKeepTag(pair.keep, inheritedTag)) {
        writes.push({
          ref: db.collection('expense').doc(pair.keep.id),
          data: {tag: inheritedTag, modifiedDate: now},
        });
      }
      writes.push({
        ref: db.collection('expense').doc(pair.drop.id),
        data: {
          duplicateOf: pair.keep.id,
          dupeStatus: 'auto',
          dupeRule: pair.rule,
          modifiedDate: now,
        },
      });
    }

    for (const review of needsReview) {
      const {keep, drop} = pickReviewSurvivor(review.a, review.b);
      writes.push({
        ref: db.collection('expense').doc(drop.id),
        data: {
          dupeCandidateOf: keep.id,
          dupeStatus: 'pending',
          dupeRule: `review:${review.reason}`,
          modifiedDate: now,
        },
      });
    }

    let applied = 0;
    const batchSize = 450;
    for (let i = 0; i < writes.length; i += batchSize) {
      const batch = db.batch();
      const chunk = writes.slice(i, i + batchSize);
      chunk.forEach((w) => {
        batch.set(w.ref, w.data, {merge: true});
      });
      await batch.commit();
      applied += chunk.length;
    }

    const summary = {
      ...report,
      appliedWrites: applied,
      ranAt: now,
    };

    await db.collection('config').doc('dedupeLastRun').set(summary, {merge: true});
    res.send(summary);
  } catch (err) {
    console.error('Error in dedupeExpenses:', err);
    res.status(500).send('Error - ' + err.message);
  }
});


const isValidRequest = async (req, userEmail) => {

  if (req.method !== 'POST') {
    return 403;
  }

  if (!req.body || Object.keys(req.body).length === 0) {
    return 400;
  }

  if (!req.headers || !req.headers.authorization) {
    console.warn('No authorization header provided.');
    return 401;
  }

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {

    const token = req.headers.authorization.split('Bearer ')[1];

    try {
      // Verify the token against Google's token info endpoint
      const tokenInfoResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${token}`);
      const tokenInfo = await tokenInfoResponse.json();

      console.log('token info', tokenInfo);

      if (tokenInfo.email_verified && tokenInfo.email === userEmail) {
        // console.log(`Service account ${userEmail} authenticated via OAuth2 access token.`);
        return 200;
      } else {
        console.warn(`OAuth2 token provided but email ${tokenInfo.email} is not matching account user email or not verified.`);
        return 401;
      }
    } catch (oauthError) {
      console.error('OAuth2 token verification failed:', oauthError.message);
      return 500;
    }
  }
};
