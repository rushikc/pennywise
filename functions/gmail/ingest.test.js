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
        async create(data) {
          if (docs.has(path)) {
            const err = new Error('already exists');
            err.code = 6;
            throw err;
          }
          docs.set(path, data);
        },
        async delete() {
          docs.delete(path);
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

function hdfcMessage(id) {
  return {
    id,
    snippet: 'HDFC Bank debit',
    payload: {
      headers: [{name: 'Subject', value: 'HDFC Bank alert'}],
      body: {
        data: Buffer.from(
          'Rs.1,234.50 is debited from your HDFC Bank Credit Card ending 1234 towards AMAZON on 01-01-26',
        ).toString('base64url'),
      },
    },
  };
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
    assert.ok(db.docs.has('users/u1/private/processedIds/msg-1'));
  });

  it('does not resurrect a deleted expense when the processed marker remains', async () => {
    const db = collectionStore();
    await saveParsedExpense(
      db,
      'u1',
      {id: 'msg-1', internalDate: '10'},
      {cost: 12, costType: 'debit', vendor: 'Shop', type: 'upi'},
      [],
      100,
    );
    await db.doc('users/u1/expense/msg-1').delete();
    const again = await saveParsedExpense(
      db,
      'u1',
      {id: 'msg-1', internalDate: '10'},
      {cost: 12, costType: 'debit', vendor: 'Shop', type: 'upi'},
      [],
      200,
    );
    assert.equal(again.created, false);
    assert.equal(db.docs.has('users/u1/expense/msg-1'), false);
    assert.ok(db.docs.has('users/u1/private/processedIds/msg-1'));
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

  it('does not advance the cursor when messages.list fails', async () => {
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
        return {ok: false, status: 500, json: async () => ({error: 'boom'})};
      }
      if (href.includes('/profile')) {
        return {ok: true, json: async () => ({historyId: '999'})};
      }
      return {ok: true, json: async () => ({})};
    };
    await assert.rejects(
      () => processConnectedUser({
        db,
        uid: 'u1',
        accessToken: 'at',
        geminiKey: '',
        fetchImpl,
        nowMs: 50,
      }),
      /gmail_list_failed/,
    );
    assert.equal(db.docs.get('users/u1/private/gmail').historyId, 'old');
  });

  it('pages through fallback list results and processes every id', async () => {
    const db = collectionStore();
    db.docs.set('users/u1/private/gmail', {
      status: 'connected',
      historyId: 'old',
      lastProcessedAt: 1,
    });
    db.docs.set('users/u1/config/emailParseBanks', {
      banks: [{displayName: 'HDFC', matchStrings: ['HDFC Bank']}],
    });
    const listed = [];
    const formats = [];
    const fetchImpl = async (url) => {
      const href = String(url);
      if (href.includes('/history')) {
        return {ok: false, status: 404, json: async () => ({error: {code: 404}})};
      }
      if (href.includes('/messages?')) {
        listed.push(href);
        if (!href.includes('pageToken=')) {
          return {ok: true, json: async () => ({messages: [{id: 'm1'}], nextPageToken: 'p2'})};
        }
        return {ok: true, json: async () => ({messages: [{id: 'm2'}]})};
      }
      if (href.includes('/messages/m')) {
        const format = href.includes('format=metadata') ? 'metadata' : 'full';
        formats.push(format);
        const id = href.includes('m1') ? 'm1' : 'm2';
        return {ok: true, json: async () => hdfcMessage(id)};
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
    assert.equal(listed.length, 2);
    assert.equal(result.created, 2);
    assert.ok(db.docs.has('users/u1/expense/m1'));
    assert.ok(db.docs.has('users/u1/expense/m2'));
    assert.equal(db.docs.get('users/u1/private/gmail').historyId, '999');
    assert.ok(formats.includes('metadata'));
    assert.ok(formats.includes('full'));
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

  it('skips full fetch when metadata does not match a bank', async () => {
    const db = collectionStore();
    db.docs.set('users/u1/private/gmail', {status: 'connected', historyId: '5'});
    db.docs.set('users/u1/config/emailParseBanks', {
      banks: [{displayName: 'HDFC', matchStrings: ['HDFC Bank']}],
    });
    const urls = [];
    const fetchImpl = async (url) => {
      const href = String(url);
      urls.push(href);
      if (href.includes('/history')) {
        return {
          ok: true,
          json: async () => ({
            historyId: '6',
            history: [{messagesAdded: [{message: {id: 'noise'}}]}],
          }),
        };
      }
      if (href.includes('format=metadata')) {
        return {
          ok: true,
          json: async () => ({
            id: 'noise',
            snippet: 'Your flight itinerary',
            payload: {headers: [{name: 'Subject', value: 'Boarding pass'}]},
          }),
        };
      }
      throw new Error(`unexpected full fetch ${url}`);
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
    assert.equal(urls.some((href) => href.includes('format=full')), false);
  });
});
