/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {describe, it} = require('node:test');
const assert = require('node:assert/strict');
const {processConnectedUser, saveParsedExpense, ingestDocPaths, processedIdPath} = require('./ingest');

function assertEvenDocPath(path) {
  const parts = String(path).split('/').filter(Boolean);
  if (parts.length % 2 !== 0) {
    throw new Error(
      `Value for argument "documentPath" must point to a document, but was "${path}". ` +
      'Your path does not contain an even number of components.',
    );
  }
}

function collectionStore(options = {}) {
  const docs = new Map();
  const failCreates = new Set(options.failCreates || []);
  const db = {
    docs,
    doc(path) {
      assertEvenDocPath(path);
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
          if (failCreates.has(path)) {
            const err = new Error('write failed');
            err.code = 13;
            throw err;
          }
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
            if (op.type === 'create' && failCreates.has(op.path)) {
              const err = new Error('write failed');
              err.code = 13;
              throw err;
            }
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

function connectedDb(extra = {}) {
  const db = collectionStore();
  db.docs.set('users/u1/private/gmail', {
    status: 'connected',
    historyId: extra.historyId || '5',
    lastProcessedAt: extra.lastProcessedAt,
    ...extra.gmail,
  });
  db.docs.set('users/u1/config/emailParseBanks', {
    banks: [{displayName: 'HDFC', matchStrings: ['HDFC Bank']}],
  });
  return db;
}

describe('ingest document paths', () => {
  it('uses an even number of segments for every ingest doc path', () => {
    for (const path of ingestDocPaths('u1', 'msg-1')) {
      const segments = path.split('/').filter(Boolean);
      assert.equal(segments.length % 2, 0, path);
    }
    assert.equal(processedIdPath('u1', 'msg-1'), 'users/u1/private/gmail/processedIds/msg-1');
  });

  it('throws on odd-segment doc paths like the Firestore client', () => {
    const db = collectionStore();
    assert.throws(
      () => db.doc('users/u1/private/processedIds/msg-1'),
      /even number of components/,
    );
  });
});

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
    assert.ok(db.docs.has('users/u1/private/gmail/processedIds/msg-1'));
    assert.deepEqual(db.docs.get('users/u1/expense/msg-1').tags, []);
    assert.equal(db.docs.get('users/u1/expense/msg-1').tag, null);
  });

  it('writes tags array and the tag mirror from a vendor map', async () => {
    const db = collectionStore();
    db.docs.set('users/u1/config/tags', {tagList: ['food'], legacyTagList: []});
    const created = await saveParsedExpense(
      db,
      'u1',
      {id: 'msg-2', internalDate: '10'},
      {cost: 12, costType: 'debit', vendor: 'Shop', type: 'upi'},
      [{vendor: 'SHOP', tag: 'food'}],
      100,
    );
    assert.equal(created.created, true);
    assert.deepEqual(created.expense.tags, ['food']);
    assert.equal(created.expense.tag, 'food');
  });

  it('canonicalises a vendor tag against tagList', async () => {
    const db = collectionStore();
    db.docs.set('users/u1/config/tags', {tagList: ['food'], legacyTagList: []});
    const created = await saveParsedExpense(
      db,
      'u1',
      {id: 'msg-food-space', internalDate: '10'},
      {cost: 12, costType: 'debit', vendor: 'Shop', type: 'upi'},
      [{vendor: 'SHOP', tag: ' Food '}],
      100,
    );
    assert.deepEqual(created.expense.tags, ['food']);
    assert.equal(created.expense.tag, 'food');
  });

  it('drops an unknown vendor tag', async () => {
    const db = collectionStore();
    db.docs.set('users/u1/config/tags', {tagList: ['food'], legacyTagList: []});
    const created = await saveParsedExpense(
      db,
      'u1',
      {id: 'msg-unknown-tag', internalDate: '10'},
      {cost: 12, costType: 'debit', vendor: 'Shop', type: 'upi'},
      [{vendor: 'SHOP', tag: 'mystery'}],
      100,
    );
    assert.deepEqual(created.expense.tags, []);
    assert.equal(created.expense.tag, null);
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
    assert.ok(db.docs.has('users/u1/private/gmail/processedIds/msg-1'));
  });

  it('leaves no marker when the expense create fails', async () => {
    const db = collectionStore({failCreates: ['users/u1/expense/msg-1']});
    await assert.rejects(
      () => saveParsedExpense(
        db,
        'u1',
        {id: 'msg-1', internalDate: '10'},
        {cost: 12, costType: 'debit', vendor: 'Shop', type: 'upi'},
        [],
        100,
      ),
    );
    assert.equal(db.docs.has('users/u1/expense/msg-1'), false);
    assert.equal(db.docs.has('users/u1/private/gmail/processedIds/msg-1'), false);
  });
});

describe('processConnectedUser history 404', () => {
  it('falls back to messages.list and resets the cursor from profile', async () => {
    const db = connectedDb({historyId: 'old', lastProcessedAt: 1});
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

  it('bounds fallback search to 30 days when lastProcessedAt is null', async () => {
    const nowMs = Date.UTC(2026, 9, 25);
    const db = connectedDb({historyId: 'old', lastProcessedAt: null});
    const listed = [];
    const fetchImpl = async (url) => {
      const href = String(url);
      if (href.includes('/history')) {
        return {ok: false, status: 404, json: async () => ({error: {code: 404}})};
      }
      if (href.includes('/messages?')) {
        listed.push(href);
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
      nowMs,
    });
    assert.match(listed[0], /after%3A2026%2F09%2F25/);
    assert.match(result.fallbackQuery, /after:2026\/09\/25/);
  });

  it('does not advance the cursor when messages.list fails', async () => {
    const db = connectedDb({historyId: 'old', lastProcessedAt: 1});
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
    const db = connectedDb({historyId: 'old', lastProcessedAt: 1});
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
    const db = connectedDb();
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

describe('processConnectedUser fetch errors', () => {
  it('throws on metadata 429 and does not advance the cursor', async () => {
    const db = connectedDb({historyId: '5'});
    const fetchImpl = async (url) => {
      const href = String(url);
      if (href.includes('/history')) {
        return {
          ok: true,
          json: async () => ({
            historyId: '6',
            history: [{messagesAdded: [{message: {id: 'm1'}}]}],
          }),
        };
      }
      if (href.includes('format=metadata')) {
        return {ok: false, status: 429, json: async () => ({error: 'rate'})};
      }
      throw new Error(`unexpected ${url}`);
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
      /gmail_fetch_failed/,
    );
    assert.equal(db.docs.get('users/u1/private/gmail').historyId, '5');
  });

  it('runs applyDedupe after a 429 if an earlier message was saved', async () => {
    const db = connectedDb({historyId: '5'});
    db.docs.set('users/u1/expense/existing', {
      cost: 199,
      vendor: 'NETFLIX',
      type: 'upi',
      date: 50,
      operation: 'add',
    });
    const netflixMessage = {
      ...hdfcMessage('m1'),
      payload: {
        headers: [{name: 'Subject', value: 'HDFC Bank alert'}],
        body: {
          data: Buffer.from(
            'Rs.199.00 is debited from your HDFC Bank Credit Card ending 1234 towards NETFLIX on 01-01-26',
          ).toString('base64url'),
        },
      },
    };
    const fetchImpl = async (url) => {
      const href = String(url);
      if (href.includes('/history')) {
        return {
          ok: true,
          json: async () => ({
            historyId: '6',
            history: [
              {messagesAdded: [{message: {id: 'm1'}}]},
              {messagesAdded: [{message: {id: 'm2'}}]},
            ],
          }),
        };
      }
      if (href.includes('/messages/m1')) {
        return {ok: true, json: async () => netflixMessage};
      }
      if (href.includes('/messages/m2') && href.includes('format=metadata')) {
        return {ok: false, status: 429, json: async () => ({error: 'rate'})};
      }
      throw new Error(`unexpected ${url}`);
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
      /gmail_fetch_failed/,
    );
    assert.ok(db.docs.has('users/u1/expense/m1'));
    assert.equal(db.docs.get('users/u1/private/gmail').historyId, '5');
    const marked = db.docs.get('users/u1/expense/m1').duplicateOf === 'existing' ||
      db.docs.get('users/u1/expense/existing').duplicateOf === 'm1';
    assert.equal(marked, true);
  });

  it('throws on full-message 500 and does not advance the cursor', async () => {
    const db = connectedDb({historyId: '5'});
    const fetchImpl = async (url) => {
      const href = String(url);
      if (href.includes('/history')) {
        return {
          ok: true,
          json: async () => ({
            historyId: '6',
            history: [{messagesAdded: [{message: {id: 'm1'}}]}],
          }),
        };
      }
      if (href.includes('format=metadata')) {
        return {ok: true, json: async () => hdfcMessage('m1')};
      }
      if (href.includes('format=full')) {
        return {ok: false, status: 500, json: async () => ({error: 'boom'})};
      }
      throw new Error(`unexpected ${url}`);
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
      /gmail_fetch_failed/,
    );
    assert.equal(db.docs.get('users/u1/private/gmail').historyId, '5');
  });

  it('skips a 404 message and still advances the cursor', async () => {
    const db = connectedDb({historyId: '5'});
    const fetchImpl = async (url) => {
      const href = String(url);
      if (href.includes('/history')) {
        return {
          ok: true,
          json: async () => ({
            historyId: '6',
            history: [{messagesAdded: [{message: {id: 'gone'}}]}],
          }),
        };
      }
      if (href.includes('format=metadata')) {
        return {ok: false, status: 404, json: async () => ({error: {code: 404}})};
      }
      throw new Error(`unexpected ${url}`);
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
    assert.equal(db.docs.get('users/u1/private/gmail').historyId, '6');
  });

  it('skips full fetch and Gemini when a processed marker already exists', async () => {
    const db = connectedDb({historyId: '5'});
    db.docs.set('users/u1/private/gmail/processedIds/done', {mailId: 'done', at: 1});
    const urls = [];
    const fetchImpl = async (url) => {
      const href = String(url);
      urls.push(href);
      if (href.includes('/history')) {
        return {
          ok: true,
          json: async () => ({
            historyId: '6',
            history: [{messagesAdded: [{message: {id: 'done'}}]}],
          }),
        };
      }
      throw new Error(`unexpected fetch ${url}`);
    };
    const result = await processConnectedUser({
      db,
      uid: 'u1',
      accessToken: 'at',
      geminiKey: 'should-not-be-used',
      fetchImpl,
      nowMs: 50,
    });
    assert.equal(result.created, 0);
    assert.equal(urls.some((href) => href.includes('format=full')), false);
    assert.equal(urls.some((href) => href.includes('format=metadata')), false);
    assert.equal(db.docs.get('users/u1/private/gmail').historyId, '6');
  });
});
