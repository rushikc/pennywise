/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {describe, it} = require('node:test');
const assert = require('node:assert/strict');
const {processConnectedUser, saveParsedExpense} = require('./ingest');

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
      };
    },
    collection(path) {
      return {
        where() {
          return this;
        },
        async get() {
          const prefix = `${path}/`;
          const hits = [];
          docs.forEach((value, key) => {
            if (key.startsWith(prefix)) {
              hits.push({id: key.slice(prefix.length), data: () => value});
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

describe('saveParsedExpense', () => {
  it('uses the Gmail message id as the expense document id', async () => {
    const db = collectionStore();
    const first = await saveParsedExpense(
      db,
      'u1',
      {id: 'msg-1', internalDate: '10'},
      {cost: 12, costType: 'debit', vendor: 'Shop', type: 'upi'},
      [],
      100,
    );
    const second = await saveParsedExpense(
      db,
      'u1',
      {id: 'msg-1', internalDate: '10'},
      {cost: 12, costType: 'debit', vendor: 'Shop', type: 'upi'},
      [],
      100,
    );
    assert.equal(first.created, true);
    assert.equal(second.created, false);
    assert.ok(db.docs.has('users/u1/expense/msg-1'));
  });
});

describe('processConnectedUser history 404', () => {
  it('falls back to messages.list and resets the cursor from profile', async () => {
    const db = collectionStore();
    db.docs.set('users/u1/private/gmail', {
      status: 'connected',
      historyId: 'old',
      lastProcessedAt: 1,
    });
    db.docs.set('users/u1/config/emailParseBanks', {
      banks: [{displayName: 'HDFC', matchStrings: ['HDFC Bank']}],
    });
    const fetchImpl = async (url) => {
      const href = String(url);
      if (href.includes('/history')) {
        return {ok: false, status: 404, json: async () => ({error: {code: 404}})};
      }
      if (href.includes('/messages?')) {
        return {ok: true, json: async () => ({messages: []})};
      }
      if (href.includes('/profile')) {
        return {ok: true, json: async () => ({historyId: '999'})};
      }
      return {ok: true, json: async () => ({})};
    };
    const result = await processConnectedUser({
      db,
      uid: 'u1',
      accessToken: 'at',
      geminiKey: '',
      fetchImpl,
      nowMs: 50,
    });
    assert.equal(result.created, 0);
    assert.equal(db.docs.get('users/u1/private/gmail').historyId, '999');
  });

  it('is a cheap no-op when history has no messageAdded entries', async () => {
    const db = collectionStore();
    db.docs.set('users/u1/private/gmail', {status: 'connected', historyId: '5'});
    const fetchImpl = async (url) => {
      if (String(url).includes('/history')) {
        return {ok: true, json: async () => ({historyId: '6', history: [{messages: [{id: 'read-only'}]}]})};
      }
      throw new Error(`unexpected ${url}`);
    };
    const result = await processConnectedUser({
      db,
      uid: 'u1',
      accessToken: 'at',
      geminiKey: 'should-not-be-used',
      fetchImpl,
      nowMs: 50,
    });
    assert.equal(result.noop, true);
    assert.equal(result.processed, 0);
  });
});
