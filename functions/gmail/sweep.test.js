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
        async create(data) {
          if (docs.has(path)) {
            const err = new Error('already exists');
            err.code = 6;
            throw err;
          }
          docs.set(path, data);
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
        create(ref, data) {
          ops.push({type: 'create', path: ref.path, data});
        },
        set(ref, data, options) {
          ops.push({type: 'set', path: ref.path, data, options});
        },
        async commit() {
          for (const op of ops) {
            if (op.type === 'create' && docs.has(op.path)) {
              const err = new Error('already exists');
              err.code = 6;
              throw err;
            }
          }
          for (const op of ops) {
            if (op.type === 'create') {
              docs.set(op.path, op.data);
            } else {
              const current = docs.get(op.path) || {};
              docs.set(op.path, op.options && op.options.merge ? {...current, ...op.data} : op.data);
            }
          }
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

  it('processes a lost push after watch renewal without overwriting historyId', async () => {
    const nowMs = 1_700_000_000_000;
    const db = sweepDb([{
      uid: 'u-ok',
      email: 'ok@example.com',
      gmail: {status: 'connected', historyId: '5', watchExpiration: nowMs + 60_000},
    }]);
    db.docs.set('users/u-ok/config/emailParseBanks', {
      banks: [{displayName: 'HDFC', matchStrings: ['HDFC Bank']}],
    });
    const tokenStore = {
      readRefreshToken: async () => 'rt-u-ok',
    };
    const fetchImpl = async (url) => {
      const href = String(url);
      if (href.includes('/token')) {
        return {ok: true, json: async () => ({access_token: 'at'})};
      }
      if (href.includes('/history')) {
        return {
          ok: true,
          json: async () => ({
            historyId: '8',
            history: [{messagesAdded: [{message: {id: 'msg-lost'}}]}],
          }),
        };
      }
      if (href.includes('/messages/msg-lost')) {
        return {
          ok: true,
          json: async () => ({
            id: 'msg-lost',
            snippet: 'HDFC Bank debit',
            payload: {
              headers: [{name: 'Subject', value: 'HDFC Bank alert'}],
              body: {
                data: Buffer.from(
                  'Rs.1,234.50 is debited from your HDFC Bank Credit Card ending 1234 towards AMAZON on 01-01-26',
                ).toString('base64url'),
              },
            },
          }),
        };
      }
      if (href.includes('/watch')) {
        return {ok: true, json: async () => ({historyId: '99', expiration: String(nowMs + 8 * 24 * 3600 * 1000)})};
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
      nowMs,
    });
    assert.equal(summary.ok, 1);
    assert.ok(db.docs.has('users/u-ok/expense/msg-lost'));
    assert.equal(db.docs.get('users/u-ok/private/gmail').historyId, '8');
    assert.notEqual(db.docs.get('users/u-ok/private/gmail').historyId, '99');
  });

  it('renews the watch even when ingest throws', async () => {
    const nowMs = 1_700_000_000_000;
    const db = sweepDb([{
      uid: 'u-ok',
      email: 'ok@example.com',
      gmail: {status: 'connected', historyId: '5'},
    }]);
    const watches = [];
    const tokenStore = {
      readRefreshToken: async () => 'rt-u-ok',
    };
    const fetchImpl = async (url) => {
      const href = String(url);
      if (href.includes('/token')) {
        return {ok: true, json: async () => ({access_token: 'at'})};
      }
      if (href.includes('/history')) {
        return {ok: false, status: 500, json: async () => ({error: 'boom'})};
      }
      if (href.includes('/watch')) {
        watches.push(href);
        return {ok: true, json: async () => ({historyId: '99', expiration: String(nowMs + 8 * 24 * 3600 * 1000)})};
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
      nowMs,
    });
    assert.equal(summary.failed, 1);
    assert.equal(watches.length, 1);
    assert.ok(db.docs.get('users/u-ok/private/gmail').watchExpiration);
  });
});
