/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {setGlobalOptions} = require('firebase-functions/v2');
const {onCall} = require('firebase-functions/v2/https');
const {onMessagePublished} = require('firebase-functions/v2/pubsub');
const {onSchedule} = require('firebase-functions/v2/scheduler');
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

require('dotenv').config();

const admin = require('firebase-admin');
const {getFirestore} = require('firebase-admin/firestore');

admin.initializeApp();
const db = getFirestore();

const oauthClientSecret = defineSecret('pennywise-oauth-client-secret');
const geminiApiKey = defineSecret('pennywise-gemini-api-key');
const oauthClientId = defineString('GOOGLE_OAUTH_CLIENT_ID');
const {createTokenStore} = require('./gmail/tokenStore');
const {createGmailCallables} = require('./gmail/callables');
const {handleGmailPush} = require('./gmail/push');
const {runHourlySweep} = require('./gmail/sweep');
const gmailTokenStore = createTokenStore();

function runtimeProjectId() {
  return process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || projectId;
}

function gmailCallables() {
  return createGmailCallables({
    db,
    tokenStore: gmailTokenStore,
    projectId: runtimeProjectId(),
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

exports.onGmailPush = onMessagePublished({
  topic: gcpNames.pubsubTopic,
  secrets: [oauthClientSecret, geminiApiKey],
}, (event) => handleGmailPush({
  db,
  tokenStore: gmailTokenStore,
  projectId: runtimeProjectId(),
  clientId: oauthClientId.value(),
  clientSecret: oauthClientSecret.value(),
  geminiKey: geminiApiKey.value(),
  message: event.data && event.data.message,
  fetchImpl: fetch,
}));

exports.hourlyGmailSweep = onSchedule({
  schedule: 'every 1 hours',
  secrets: [oauthClientSecret, geminiApiKey],
  timeZone: 'Asia/Kolkata',
}, () => runHourlySweep({
  db,
  tokenStore: gmailTokenStore,
  projectId: runtimeProjectId(),
  clientId: oauthClientId.value(),
  clientSecret: oauthClientSecret.value(),
  geminiKey: geminiApiKey.value(),
  fetchImpl: fetch,
}));
