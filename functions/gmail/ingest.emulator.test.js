/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {describe, it, before} = require('node:test');
const assert = require('node:assert/strict');

const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
const describeEmulator = emulatorHost ? describe : describe.skip;

describeEmulator('saveParsedExpense firestore emulator', () => {
  let db;

  before(() => {
    const admin = require('firebase-admin');
    const app = admin.apps.find((item) => item && item.name === 'ingest-emulator') ||
      admin.initializeApp({projectId: process.env.GCLOUD_PROJECT || 'demo-pennywise'}, 'ingest-emulator');
    db = admin.firestore(app);
  });

  it('accepts the even-segment processed marker path', async () => {
    const {saveParsedExpense} = require('./ingest');
    const uid = `emu-${Date.now()}`;
    const result = await saveParsedExpense(
      db,
      uid,
      {id: 'msg-1', internalDate: '10'},
      {cost: 12, costType: 'debit', vendor: 'Shop', type: 'upi'},
      [],
      100,
    );
    assert.equal(result.created, true);
    const marker = await db.doc(`users/${uid}/private/gmail/processedIds/msg-1`).get();
    const expense = await db.doc(`users/${uid}/expense/msg-1`).get();
    assert.equal(marker.exists, true);
    assert.equal(expense.exists, true);
  });
});
