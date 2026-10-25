/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {describe, it} = require('node:test');
const assert = require('node:assert/strict');
const {createGmailCallables} = require('./callables');

function memoryDb() {
  const docs = new Map();
  const db = {
    docs,
    doc(path) {
      return {
        path,
        async get() {
          return {exists: docs.has(path), data: () => docs.get(path)};
        },
        async set(data, options) {
          const current = docs.get(path) || {};
          docs.set(path, options && options.merge ? {...current, ...data} : data);
        },
      };
    },
    batch() {
      const ops = [];
      return {
        set(ref, data, options) {
          ops.push({path: ref.path, data, options});
        },
        async commit() {
          ops.forEach((op) => {
            const current = docs.get(op.path) || {};
            docs.set(op.path, op.options && op.options.merge ? {...current, ...op.data} : op.data);
          });
        },
      };
    },
    async runTransaction(fn) {
      const transaction = {
        async get(ref) {
          return db.doc(ref.path).get();
        },
        set(ref, data, options) {
          const current = docs.get(ref.path) || {};
          docs.set(ref.path, options && options.merge ? {...current, ...data} : data);
        },
      };
      return fn(transaction);
    },
  };
  return db;
}

function allowlistedDb() {
  const db = memoryDb();
  const innerDoc = db.doc.bind(db);
  db.doc = (path) => {
    const ref = innerDoc(path);
    const origGet = ref.get.bind(ref);
    ref.get = async () => {
      if (path === 'allowedUsers/ada@example.com') {
        return {exists: true, data: () => ({})};
      }
      return origGet();
    };
    return ref;
  };
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

function oauthFetch(profileEmail) {
  return async (url) => {
    if (String(url).includes('/profile')) {
      return {ok: true, json: async () => ({emailAddress: profileEmail})};
    }
    if (String(url).includes('/watch') || String(url).includes('/stop')) {
      return {ok: true, json: async () => ({historyId: '42', expiration: '99'})};
    }
    if (String(url).includes('revoke')) {
      return {ok: true, json: async () => ({})};
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
    const {connectGmail} = createGmailCallables({
      db,
      tokenStore,
      projectId: 'proj',
      clientId: 'id',
      clientSecret: 'secret',
      fetchImpl: oauthFetch('ada@example.com'),
      now: () => 1000,
    });
    const result = await connectGmail(authedRequest('one-time-code'));
    assert.equal(result.status, 'connected');
    assert.equal(saved[0].token, 'rt-keep');
    assert.equal(db.docs.get('users/uid-1/meta/gmailStatus').status, 'connected');
    assert.equal(db.docs.get('gmailConnections/ada@example.com').uid, 'uid-1');
    assert.equal(db.docs.get('users/uid-1/private/gmail').status, 'connected');
  });

  it('rejects connecting a Gmail account already used by another uid', async () => {
    const db = allowlistedDb();
    db.docs.set('gmailConnections/ada@example.com', {uid: 'uid-other', status: 'connected'});
    const tokens = {'uid-1': 'rt-existing'};
    const saved = [];
    const revoked = [];
    const fetchImpl = async (url) => {
      if (String(url).includes('revoke')) {
        revoked.push(String(url));
      }
      return oauthFetch('ada@example.com')(url);
    };
    const {connectGmail} = createGmailCallables({
      db,
      tokenStore: {
        saveRefreshToken: async (_p, uid, token) => {
          saved.push({uid, token});
          tokens[uid] = token;
        },
      },
      projectId: 'proj',
      clientId: 'id',
      clientSecret: 'secret',
      fetchImpl,
      now: () => 1000,
    });
    await assert.rejects(
      () => connectGmail(authedRequest('one-time-code')),
      (err) => err.code === 'already-exists',
    );
    assert.deepEqual(saved, []);
    assert.equal(tokens['uid-1'], 'rt-existing');
    assert.equal(revoked.some((url) => url.includes('revoke')), true);
  });

  it('disconnects Firestore state when saving the refresh token fails', async () => {
    const db = allowlistedDb();
    const {connectGmail} = createGmailCallables({
      db,
      tokenStore: {
        saveRefreshToken: async () => {
          throw new Error('secret_write_failed');
        },
      },
      projectId: 'proj',
      clientId: 'id',
      clientSecret: 'secret',
      fetchImpl: oauthFetch('ada@example.com'),
      now: () => 1000,
    });
    await assert.rejects(
      () => connectGmail(authedRequest('one-time-code')),
      /secret_write_failed/,
    );
    assert.equal(db.docs.get('users/uid-1/meta/gmailStatus').status, 'disconnected');
    assert.equal(db.docs.get('users/uid-1/meta/gmailStatus').lastError, 'token_save_failed');
    assert.equal(db.docs.get('gmailConnections/ada@example.com').status, 'disconnected');
  });

  it('marks the previous Gmail index disconnected when reconnecting a different address', async () => {
    const db = allowlistedDb();
    db.docs.set('users/uid-1/private/gmail', {
      email: 'old@gmail.com',
      status: 'connected',
    });
    db.docs.set('gmailConnections/old@gmail.com', {uid: 'uid-1', status: 'connected'});
    const {connectGmail} = createGmailCallables({
      db,
      tokenStore: {saveRefreshToken: async () => {}},
      projectId: 'proj',
      clientId: 'id',
      clientSecret: 'secret',
      fetchImpl: oauthFetch('inbox@gmail.com'),
      now: () => 1000,
    });
    const result = await connectGmail(authedRequest('one-time-code'));
    assert.equal(result.email, 'inbox@gmail.com');
    assert.equal(db.docs.get('gmailConnections/inbox@gmail.com').status, 'connected');
    assert.equal(db.docs.get('gmailConnections/old@gmail.com').status, 'disconnected');
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
      fetchImpl: oauthFetch('ada@example.com'),
      now: () => 2000,
    });
    const result = await disconnectGmail(authedRequest());
    assert.equal(result.status, 'disconnected');
    assert.deepEqual(deleted, ['uid-1']);
    assert.equal(db.docs.get('users/uid-1/meta/gmailStatus').status, 'disconnected');
  });

  it('clears the connected Gmail address even when it differs from the sign-in email', async () => {
    const db = allowlistedDb();
    db.docs.set('users/uid-1/private/gmail', {
      email: 'inbox@gmail.com',
      status: 'connected',
    });
    db.docs.set('gmailConnections/inbox@gmail.com', {uid: 'uid-1', status: 'connected'});
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
      fetchImpl: oauthFetch('inbox@gmail.com'),
      now: () => 2000,
    });
    await disconnectGmail(authedRequest());
    assert.equal(db.docs.get('gmailConnections/inbox@gmail.com').status, 'disconnected');
    assert.equal(db.docs.has('gmailConnections/ada@example.com'), false);
    assert.deepEqual(deleted, ['uid-1']);
  });
});
