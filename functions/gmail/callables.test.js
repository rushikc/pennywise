/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {describe, it} = require('node:test');
const assert = require('node:assert/strict');
const {createGmailCallables} = require('./callables');

function memoryDb() {
  const docs = new Map();
  return {
    docs,
    doc(path) {
      return {path};
    },
    batch() {
      const ops = [];
      return {
        set(ref, data) {
          ops.push({path: ref.path, data});
        },
        async commit() {
          ops.forEach((op) => docs.set(op.path, op.data));
        },
      };
    },
  };
}

function allowlistedDb() {
  const db = memoryDb();
  db.doc = (path) => ({
    path,
    async get() {
      return {exists: path === 'allowedUsers/ada@example.com' || db.docs.has(path), data: () => db.docs.get(path)};
    },
    async set(data, options) {
      const current = db.docs.get(path) || {};
      db.docs.set(path, options && options.merge ? {...current, ...data} : data);
    },
  });
  return db;
}

function authedRequest(code) {
  return {
    auth: {
      uid: 'uid-1',
      token: {email: 'ada@example.com', email_verified: true},
    },
    data: {code},
  };
}

describe('gmail callables', () => {
  it('stores connection state without logging the code', async () => {
    const db = allowlistedDb();
    const saved = [];
    const tokenStore = {
      saveRefreshToken: async (_p, uid, token) => {
        saved.push({uid, token});
      },
    };
    const fetchImpl = async (url) => {
      if (String(url).includes('userinfo')) {
        return {ok: true, json: async () => ({email: 'ada@example.com'})};
      }
      if (String(url).includes('/watch')) {
        return {ok: true, json: async () => ({historyId: '42', expiration: '99'})};
      }
      return {
        ok: true,
        json: async () => ({
          refresh_token: 'rt-keep',
          access_token: 'at',
          scope: 'https://www.googleapis.com/auth/gmail.readonly',
        }),
      };
    };
    const {connectGmail} = createGmailCallables({
      db,
      tokenStore,
      projectId: 'proj',
      clientId: 'id',
      clientSecret: 'secret',
      fetchImpl,
      now: () => 1000,
    });
    const result = await connectGmail(authedRequest('one-time-code'));
    assert.equal(result.status, 'connected');
    assert.equal(saved[0].token, 'rt-keep');
    assert.equal(db.docs.get('users/uid-1/meta/gmailStatus').status, 'connected');
    assert.equal(db.docs.get('gmailConnections/ada@example.com').uid, 'uid-1');
    assert.equal(db.docs.get('users/uid-1/private/gmail').status, 'connected');
  });

  it('rejects callers who are not allowlisted', async () => {
    const db = {
      doc() {
        return {async get() {
          return {exists: false};
        }};
      },
    };
    const {connectGmail} = createGmailCallables({
      db,
      tokenStore: {},
      projectId: 'proj',
      clientId: 'id',
      clientSecret: 'secret',
      fetchImpl: fetch,
      now: () => 1,
    });
    await assert.rejects(
      () => connectGmail(authedRequest('code')),
      (err) => err.code === 'permission-denied',
    );
  });

  it('disconnects by deleting the stored token', async () => {
    const db = allowlistedDb();
    const deleted = [];
    const tokenStore = {
      readRefreshToken: async () => 'rt-old',
      deleteRefreshToken: async (_p, uid) => {
        deleted.push(uid);
      },
    };
    const {disconnectGmail} = createGmailCallables({
      db,
      tokenStore,
      projectId: 'proj',
      clientId: 'id',
      clientSecret: 'secret',
      fetchImpl: async () => ({ok: true, json: async () => ({access_token: 'at'})}),
      now: () => 2000,
    });
    const result = await disconnectGmail(authedRequest());
    assert.equal(result.status, 'disconnected');
    assert.deepEqual(deleted, ['uid-1']);
    assert.equal(db.docs.get('users/uid-1/meta/gmailStatus').status, 'disconnected');
  });
});
