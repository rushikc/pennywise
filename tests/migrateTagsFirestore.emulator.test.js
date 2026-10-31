/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {describe, it, before, after} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const admin = require('firebase-admin');
const {applyUpdates, rollbackFromFile, planExpenseDocs} = require('../scripts/migrate/migrateTagsFirestore');

const PROJECT_ID = 'demo-pennywise';
const UID = 'uid-migrate';

describe('migrateTagsFirestore emulator rollback', () => {
  let db;

  before(() => {
    if (!admin.apps.length) {
      admin.initializeApp({projectId: PROJECT_ID});
    }
    db = admin.firestore();
  });

  after(async () => {
    await admin.app().delete().catch(() => undefined);
  });

  it('migrates then rolls back previous fields, skips an edited doc, and round-trips JSON', async () => {
    const expA = db.doc(`users/${UID}/expense/a`);
    const expB = db.doc(`users/${UID}/expense/b`);
    await expA.set({tag: 'food', cost: 1, vendor: 'A'});
    await expB.set({tag: 'rent', cost: 2, vendor: 'B'});

    const expenses = [];
    const snap = await db.collection(`users/${UID}/expense`).get();
    snap.forEach((doc) => {
      expenses.push({id: doc.id, ...doc.data(), _updateTime: doc.updateTime});
    });
    const plan = planExpenseDocs(expenses, ['food', 'rent']);
    const applyResult = await applyUpdates(db, UID, plan, null);
    assert.equal(applyResult.updated, 2);
    const rollbackRaw = fs.readFileSync(applyResult.rollbackPath, 'utf8');
    const parsed = JSON.parse(rollbackRaw);
    assert.equal(parsed.expenses.length, 2);
    assert.ok(parsed.expenses[0].writeTime.seconds);
    const roundTrip = path.join(os.tmpdir(), `pw-rollback-${Date.now()}.json`);
    fs.writeFileSync(roundTrip, JSON.stringify(parsed));

    await expB.update({cost: 99});

    const report = await rollbackFromFile(
      db,
      UID,
      roundTrip,
      true,
      admin.firestore.FieldValue.delete(),
      admin.firestore.Timestamp,
    );
    assert.equal(report.restored, 1);
    assert.equal(report.skippedChangedSince, 1);
    const restoredA = (await expA.get()).data();
    assert.equal(restoredA.tag, 'food');
    assert.equal(restoredA.tags, undefined);
    const editedB = (await expB.get()).data();
    assert.ok(Array.isArray(editedB.tags));
    assert.equal(editedB.cost, 99);
  });
});
