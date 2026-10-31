/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {describe, it, before, after} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} = require('@firebase/rules-unit-testing');

const PROJECT_ID = 'pennywise-rules-test';
const RULES_PATH = path.join(__dirname, '..', 'firestore.rules');

const owner = {
  uid: 'uid-owner',
  email: 'owner@example.com',
  email_verified: true,
};

const other = {
  uid: 'uid-other',
  email: 'other@example.com',
  email_verified: true,
};

const unsignedAllowlisted = {
  uid: 'uid-stranger',
  email: 'stranger@example.com',
  email_verified: true,
};

describe('firestore.rules', () => {
  let testEnv;

  before(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: fs.readFileSync(RULES_PATH, 'utf8'),
        host: '127.0.0.1',
        port: 8080,
      },
    });

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await db.doc('allowedUsers/owner@example.com').set({role: 'family'});
      await db.doc('allowedUsers/other@example.com').set({role: 'family'});
      await db.doc('users/uid-owner/expense/exp-1').set({cost: 10, vendor: 'A'});
      await db.doc('users/uid-owner/private/gmail').set({status: 'connected'});
      await db.doc('users/uid-owner/meta/gmailStatus').set({status: 'connected', email: 'owner@example.com'});
      await db.doc('gmailConnections/owner@example.com').set({uid: 'uid-owner'});
    });
  });

  after(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  function authed(auth) {
    return testEnv.authenticatedContext(auth.uid, {
      email: auth.email,
      email_verified: auth.email_verified,
    }).firestore();
  }

  it('allows an allowlisted owner to read and write their expense', async () => {
    const db = authed(owner);
    await assertSucceeds(db.doc('users/uid-owner/expense/exp-1').get());
    await assertSucceeds(db.doc('users/uid-owner/expense/exp-2').set({cost: 20, vendor: 'B'}));
    await assertSucceeds(db.doc('users/uid-owner/meta/profile').set({createdAt: 1}));
  });

  it('denies another uid even when that user is allowlisted', async () => {
    const db = authed(other);
    await assertFails(db.doc('users/uid-owner/expense/exp-1').get());
    await assertFails(db.doc('users/uid-owner/expense/exp-2').set({cost: 1}));
  });

  it('denies a signed-in user who is not on the allowlist', async () => {
    const db = authed(unsignedAllowlisted);
    await assertFails(db.doc('users/uid-stranger/expense/x').get());
    await assertFails(db.doc('users/uid-stranger/meta/profile').get());
  });

  it('denies client access to private, allowedUsers, and gmailConnections', async () => {
    const db = authed(owner);
    await assertFails(db.doc('users/uid-owner/private/gmail').get());
    await assertFails(db.doc('users/uid-owner/private/gmail').set({status: 'hack'}));
    await assertFails(db.doc('users/uid-owner/private/gmail/processedIds/msg-1').get());
    await assertFails(db.doc('users/uid-owner/private/gmail/processedIds/msg-1').set({mailId: 'msg-1'}));
    await assertFails(db.doc('allowedUsers/owner@example.com').get());
    await assertFails(db.doc('gmailConnections/owner@example.com').get());
  });

  it('allows the owner to read gmailStatus and denies writes', async () => {
    const db = authed(owner);
    await assertSucceeds(db.doc('users/uid-owner/meta/gmailStatus').get());
    await assertFails(db.doc('users/uid-owner/meta/gmailStatus').set({status: 'hack'}));
    const otherDb = authed(other);
    await assertFails(otherDb.doc('users/uid-owner/meta/gmailStatus').get());
  });

  it('allows the owner to delete an expense and denies another user', async () => {
    const db = authed(owner);
    await assertSucceeds(db.doc('users/uid-owner/expense/exp-1').delete());
    const otherDb = authed(other);
    await assertFails(otherDb.doc('users/uid-owner/expense/exp-2').delete());
  });

  it('allows expense tags lists of at most 8 and descriptions of at most 280', async () => {
    const db = authed(owner);
    await assertSucceeds(db.doc('users/uid-owner/expense/exp-tags').set({
      cost: 1,
      vendor: 'A',
      tags: ['food', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
      description: 'ok',
    }));
    await assertFails(db.doc('users/uid-owner/expense/exp-tags-too-many').set({
      cost: 1,
      vendor: 'A',
      tags: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
    }));
    await assertFails(db.doc('users/uid-owner/expense/exp-tags-invalid').set({
      cost: 1,
      vendor: 'A',
      tags: [1, null],
    }));
    await assertFails(db.doc('users/uid-owner/expense/exp-desc-too-long').set({
      cost: 1,
      vendor: 'A',
      description: 'x'.repeat(281),
    }));
    await assertSucceeds(db.doc('users/uid-owner/expense/exp-tags').update({
      tags: ['food'],
      description: 'updated',
    }));
    await assertSucceeds(db.doc('users/uid-owner/expense/exp-mystery').set({
      cost: 1,
      vendor: 'A',
      tags: ['mystery'],
    }));
    await assertFails(db.doc('users/uid-owner/expense/exp-tag-too-long').set({
      cost: 1,
      vendor: 'A',
      tags: ['x'.repeat(41)],
    }));
  });

  it('matches allowlist ids in lowercase', async () => {
    const mixed = testEnv.authenticatedContext('uid-mixed', {
      email: 'Owner@Example.com',
      email_verified: true,
    }).firestore();
    await assertSucceeds(mixed.doc('users/uid-mixed/meta/profile').set({ok: true}));
  });
});
