/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {describe, it} = require('node:test');
const assert = require('node:assert/strict');
const {runHourlySweep, watchNeedsRenewal} = require('./sweep');

function sweepDb(users) {
  const docs = new Map();
  users.forEach((user) => {
    docs.set(`gmailConnections/${user.email}`, {uid: user.uid, status: 'connected'});
    docs.set(`users/${user.uid}/private/gmail`, user.gmail || {status: 'connected', historyId: '1'});
  });
  return {
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
    collection(path) {
      return {
        where(field, _op, value) {
          return {
            async get() {
              const hits = [];
              docs.forEach((data, key) => {
                if (key.startsWith(`${path}/`) && data[field] === value) {
                  hits.push({id: key.slice(path.length + 1), data: () => data});
                }
              });
              return {
                forEach(fn) {
                  hits.forEach(fn);
                },
              };
            },
          };
        },
        async get() {
          return {forEach() {}};
        },
      };
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
    async runTransaction(fn) {
      const transaction = {
        async get(ref) {
          return {exists: docs.has(ref.path), data: () => docs.get(ref.path)};
        },
        set(ref, data, options) {
          const current = docs.get(ref.path) || {};
          docs.set(ref.path, options && options.merge ? {...current, ...data} : data);
        },
      };
      return fn(transaction);
    },
  };
}

describe('watchNeedsRenewal', () => {
  it('renews when expiry is missing or under two days', () => {
    const now = 1_700_000_000_000;
    assert.equal(watchNeedsRenewal(null, now), true);
    assert.equal(watchNeedsRenewal(now + 60_000, now), true);
    assert.equal(watchNeedsRenewal(now + 3 * 24 * 60 * 60 * 1000, now), false);
  });
});

describe('runHourlySweep', () => {
  it('marks invalid_grant users disconnected and continues', async () => {
    const db = sweepDb([
      {uid: 'u-bad', email: 'bad@example.com'},
      {uid: 'u-ok', email: 'ok@example.com', gmail: {status: 'connected', historyId: '5'}},
    ]);
    const tokenStore = {
      readRefreshToken: async (_p, uid) => `rt-${uid}`,
    };
    const fetchImpl = async (url, options) => {
      const body = String(options && options.body || '');
      if (body.includes('rt-u-bad')) {
        return {ok: false, json: async () => ({error: 'invalid_grant'})};
      }
      if (String(url).includes('/token')) {
        return {ok: true, json: async () => ({access_token: 'at'})};
      }
      if (String(url).includes('/history')) {
        return {ok: true, json: async () => ({historyId: '6', history: []})};
      }
      if (String(url).includes('/watch')) {
        return {ok: true, json: async () => ({historyId: '6', expiration: String(Date.now() + 8 * 24 * 3600 * 1000)})};
      }
      return {ok: true, json: async () => ({})};
    };
    const summary = await runHourlySweep({
      db,
      tokenStore,
      projectId: 'p',
      clientId: 'id',
      clientSecret: 'secret',
      geminiKey: '',
      fetchImpl,
      nowMs: Date.now(),
    });
    assert.equal(summary.disconnected, 1);
    assert.equal(summary.ok, 1);
    assert.equal(db.docs.get('users/u-bad/meta/gmailStatus').status, 'disconnected');
    assert.equal(db.docs.get('users/u-bad/meta/gmailStatus').lastError, 'invalid_grant');
  });
});
