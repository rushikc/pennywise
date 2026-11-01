/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {describe, it} = require('node:test');
const assert = require('node:assert/strict');
const {decodePushMessage, handleGmailPush} = require('./push');
const {runHourlySweep} = require('./sweep');

describe('decodePushMessage', () => {
  it('decodes base64 Gmail push payloads', () => {
    const payload = Buffer.from(JSON.stringify({emailAddress: 'a@b.com', historyId: 9})).toString('base64');
    const decoded = decodePushMessage({data: payload});
    assert.equal(decoded.emailAddress, 'a@b.com');
    assert.equal(decoded.historyId, '9');
  });

  it('returns null for invalid JSON without throwing', () => {
    const decoded = decodePushMessage({data: Buffer.from('{not-json').toString('base64')});
    assert.equal(decoded, null);
  });

  it('returns null when the json getter throws', () => {
    const message = {
      get json() {
        throw new Error('bad json');
      },
      data: Buffer.from(JSON.stringify({emailAddress: 'a@b.com'})).toString('base64'),
    };
    assert.equal(decodePushMessage(message), null);
  });
});

function collectionStore() {
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
      const query = (predicate) => ({
        where(field, _op, value) {
          return query((data) => predicate(data) && data[field] === value);
        },
        async get() {
          const prefix = `${path}/`;
          const hits = [];
          docs.forEach((value, key) => {
            if (!key.startsWith(prefix) || !predicate(value)) {
              return;
            }
            const id = key.slice(prefix.length);
            if (id.includes('/')) {
              return;
            }
            hits.push({id, data: () => value});
          });
          return {forEach(fn) { hits.forEach(fn); }};
        },
      });
      return query(() => true);
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
          return db.doc(ref.path).get();
        },
        set(ref, data, options) {
          return db.doc(ref.path).set(data, options);
        },
      };
      return fn(transaction);
    },
  };
  return db;
}

function pushData(body) {
  return {data: Buffer.from(JSON.stringify(body)).toString('base64')};
}

function hdfcMessage() {
  return {
    id: 'msg-1',
    snippet: 'HDFC Bank debit',
    payload: {
      headers: [{name: 'Subject', value: 'HDFC Bank alert'}],
      body: {
        data: Buffer.from(
          'Rs.1,234.50 is debited from your HDFC Bank Credit Card ending XX1234 towards AMAZON on 01-01-26',
        ).toString('base64url'),
      },
    },
  };
}

function connectedDb() {
  const db = collectionStore();
  db.docs.set('gmailConnections/owner@example.com', {uid: 'u1', status: 'connected'});
  db.docs.set('users/u1/private/gmail', {status: 'connected', historyId: '5', watchExpiration: 9_000_000_000_000});
  db.docs.set('users/u1/config/emailParseBanks', {
    banks: [{displayName: 'HDFC', matchStrings: ['HDFC Bank']}],
  });
  return db;
}

function gmailFetch(history) {
  return async (url) => {
    const href = String(url);
    if (href.includes('/token')) {
      return {ok: true, status: 200, json: async () => ({access_token: 'at'})};
    }
    if (href.includes('/history')) {
      return history;
    }
    if (href.includes('/messages/')) {
      return {ok: true, status: 200, json: async () => hdfcMessage()};
    }
    return {ok: true, status: 200, json: async () => ({})};
  };
}

describe('handleGmailPush', () => {
  const tokenStore = {readRefreshToken: async () => 'rt'};
  const base = {projectId: 'p', clientId: 'id', clientSecret: 'secret', geminiKey: '', tokenStore, nowMs: 50};

  it('ignores missing and malformed Pub/Sub data', async () => {
    const db = {doc() { throw new Error('should not read'); }};
    assert.deepEqual(await handleGmailPush({...base, db, message: null}), {ignored: true});
    assert.deepEqual(await handleGmailPush({...base, db, message: {}}), {ignored: true});
    assert.deepEqual(
      await handleGmailPush({...base, db, message: {data: Buffer.from('{not-json').toString('base64')}}),
      {ignored: true},
    );
  });

  it('ignores an email with no connected mailbox', async () => {
    const db = collectionStore();
    const result = await handleGmailPush({
      ...base,
      db,
      tokenStore: {readRefreshToken: async () => { throw new Error('token'); }},
      message: pushData({emailAddress: 'missing@example.com', historyId: '9'}),
    });
    assert.deepEqual(result, {ignored: true});
  });

  it('does not move the cursor when history is not newer', async () => {
    const db = connectedDb();
    const result = await handleGmailPush({
      ...base,
      db,
      fetchImpl: gmailFetch({ok: true, status: 200, json: async () => ({historyId: '5', history: []})}),
      message: pushData({emailAddress: 'owner@example.com', historyId: '5'}),
    });
    assert.equal(result.noop, true);
    assert.equal(db.docs.get('users/u1/private/gmail').historyId, '5');
  });

  it('leaves the cursor in place when processing fails', async () => {
    const db = connectedDb();
    await assert.rejects(() => handleGmailPush({
      ...base,
      db,
      fetchImpl: gmailFetch({ok: false, status: 500, json: async () => ({error: 'boom'})}),
      message: pushData({emailAddress: 'owner@example.com', historyId: '9'}),
    }));
    assert.equal(db.docs.get('users/u1/private/gmail').historyId, '5');
    assert.equal(db.docs.has('users/u1/private/gmail/processedIds/msg-1'), false);
  });

  it('shares processed ids with the hourly sweep', async () => {
    const db = connectedDb();
    const added = {ok: true, status: 200, json: async () => ({
      historyId: '6',
      history: [{messagesAdded: [{message: {id: 'msg-1'}}]}],
    })};
    const first = await handleGmailPush({
      ...base,
      db,
      fetchImpl: gmailFetch(added),
      message: pushData({emailAddress: 'owner@example.com', historyId: '6'}),
    });
    assert.equal(first.created, 1);
    assert.ok(db.docs.has('users/u1/private/gmail/processedIds/msg-1'));
    const summary = await runHourlySweep({
      ...base,
      db,
      fetchImpl: gmailFetch(added),
      nowMs: 60,
    });
    assert.equal(summary.ok, 1);
    const expenses = [...db.docs.keys()].filter((key) => key.startsWith('users/u1/expense/'));
    assert.deepEqual(expenses, ['users/u1/expense/msg-1']);
  });
});
