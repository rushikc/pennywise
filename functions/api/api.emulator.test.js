/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {describe, it, before} = require('node:test');
const assert = require('node:assert/strict');
const {createHash} = require('node:crypto');
const {FieldPath, FieldValue} = require('firebase-admin/firestore');
const {createApiHandler} = require('./router');

const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
const describeEmulator = emulatorHost ? describe : describe.skip;

const TOKEN = 'emu-api-token-0123456789abcdef01234567';
const DIGEST = createHash('sha256').update(TOKEN).digest('hex');
const NOW = 1_700_000_000_000;

function mockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: undefined,
    set(name, value) {
      res.headers[name.toLowerCase()] = String(value);
      return res;
    },
    status(code) {
      res.statusCode = code;
      return res;
    },
    json(body) {
      res.body = body;
      return res;
    },
  };
  return res;
}

function mockReq({method, path, headers, query, rawBody}) {
  const headerMap = {};
  for (const [key, value] of Object.entries(headers || {})) {
    headerMap[key.toLowerCase()] = value;
  }
  return {method, path, url: path, headers: headerMap, query: query || {}, rawBody};
}

function authHeaders(extra) {
  return {
    authorization: `Bearer ${TOKEN}`,
    'content-type': 'application/json',
    ...extra,
  };
}

describeEmulator('pennywiseApi firestore emulator', () => {
  let db;
  let auth;
  let handler;
  let uid;
  const email = 'api-owner@example.com';

  before(async () => {
    const admin = require('firebase-admin');
    const app = admin.apps.find((item) => item && item.name === 'api-emulator') ||
      admin.initializeApp({projectId: process.env.GCLOUD_PROJECT || 'demo-pennywise'}, 'api-emulator');
    db = admin.firestore(app);
    auth = admin.auth(app);
    uid = `api-emu-${Date.now()}`;
    try {
      await auth.createUser({uid, email, emailVerified: true, disabled: false});
    } catch (error) {
      if (error.code !== 'auth/uid-already-exists' && error.code !== 'auth/email-already-exists') {
        throw error;
      }
      const existing = await auth.getUserByEmail(email);
      uid = existing.uid;
    }
    await db.doc(`allowedUsers/${email}`).set({addedAt: NOW});
    await db.doc(`users/${uid}/config/tags`).set({tagList: ['food'], legacyTagList: []});
    await db.doc(`users/${uid}/vendorTag/cafe`).set({vendor: 'CAFE', tag: 'food'});
    await db.doc(`users/${uid}/expense/untagged-1`).set({
      tags: [], tag: null, vendor: 'SHOP', cost: 10, costType: 'debit', date: NOW,
      modifiedDate: 10, operation: 'add',
    });
    await db.doc(`users/${uid}/expense/tagged-1`).set({
      tags: ['food', 'office'], tag: 'food', vendor: 'CAFE', cost: 20, costType: 'debit', date: NOW,
      modifiedDate: 20, operation: 'add',
    });
    await db.doc(`users/${uid}/expense/deleted-1`).set({
      tags: [], tag: null, vendor: 'GONE', modifiedDate: 30, operation: 'delete',
    });
    await db.doc(`users/${uid}/expense/page-a`).set({
      tags: [], tag: null, vendor: 'A', modifiedDate: 40, operation: 'add',
    });
    await db.doc(`users/${uid}/expense/page-b`).set({
      tags: [], tag: null, vendor: 'B', modifiedDate: 50, operation: 'add',
    });
    handler = createApiHandler({
      db,
      auth,
      getTokenDigests: () => ({current: DIGEST, next: 'disabled'}),
      ownerEmail: email,
      now: () => NOW,
      logger: {info() {}, warn() {}},
      fieldDelete: () => FieldValue.delete(),
      documentIdField: FieldPath.documentId(),
      rateLimit: 40,
    });
  });

  async function call(req) {
    const res = mockRes();
    await handler(req, res);
    return res;
  }

  it('lists untagged expenses and omits deleted docs', async () => {
    const res = await call(mockReq({
      method: 'GET',
      path: '/expenses',
      headers: authHeaders(),
      query: {untagged: 'true', limit: '20'},
    }));
    assert.equal(res.statusCode, 200);
    const ids = res.body.items.map((item) => item.id);
    assert.equal(ids.includes('untagged-1'), true);
    assert.equal(ids.includes('deleted-1'), false);
    assert.equal(ids.includes('tagged-1'), false);
    assert.equal(res.body.items[0].mailId, undefined);
  });

  it('paginates with a cursor', async () => {
    const first = await call(mockReq({
      method: 'GET',
      path: '/expenses',
      headers: authHeaders(),
      query: {limit: '2'},
    }));
    assert.equal(first.body.items.length, 2);
    assert.equal(typeof first.body.nextCursor, 'string');
    const second = await call(mockReq({
      method: 'GET',
      path: '/expenses',
      headers: authHeaders(),
      query: {limit: '10', cursor: first.body.nextCursor},
    }));
    const firstIds = new Set(first.body.items.map((item) => item.id));
    for (const item of second.body.items) {
      assert.equal(firstIds.has(item.id), false);
    }
  });

  it('keeps both extras from concurrent patches', async () => {
    const [alpha, beta] = await Promise.all([
      call(mockReq({
        method: 'PATCH',
        path: '/expense/tagged-1',
        headers: authHeaders(),
        rawBody: JSON.stringify({tags: ['food', 'alpha']}),
      })),
      call(mockReq({
        method: 'PATCH',
        path: '/expense/tagged-1',
        headers: authHeaders(),
        rawBody: JSON.stringify({tags: ['food', 'beta']}),
      })),
    ]);
    assert.equal(alpha.statusCode, 200);
    assert.equal(beta.statusCode, 200);
    const snap = await db.doc(`users/${uid}/expense/tagged-1`).get();
    const tags = snap.data().tags;
    assert.equal(tags.includes('food'), true);
    assert.equal(tags.includes('alpha'), true);
    assert.equal(tags.includes('beta'), true);
  });

  it('stores idempotency docs under private/api', async () => {
    const body = JSON.stringify({description: 'emu note', requestId: 'req-emu-01'});
    const first = await call(mockReq({
      method: 'PATCH',
      path: '/expense/untagged-1',
      headers: authHeaders(),
      rawBody: body,
    }));
    assert.equal(first.statusCode, 200);
    const replay = await call(mockReq({
      method: 'PATCH',
      path: '/expense/untagged-1',
      headers: authHeaders(),
      rawBody: body,
    }));
    assert.equal(replay.statusCode, 200);
    assert.equal(replay.headers['idempotent-replay'], 'true');
    const stored = await db.doc(`users/${uid}/private/api/requests/current_req-emu-01`).get();
    assert.equal(stored.exists, true);
  });

  it('writes rate-limit docs under private/api', async () => {
    const bucket = Math.floor(NOW / 60000);
    const snap = await db.doc(`users/${uid}/private/api/rateLimits/current_${bucket}`).get();
    assert.equal(snap.exists, true);
    assert.equal(snap.data().count >= 1, true);
  });
});
