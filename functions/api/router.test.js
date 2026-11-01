/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {describe, it} = require('node:test');
const assert = require('node:assert/strict');
const {createHash} = require('node:crypto');
const {createApiHandler} = require('./router');

const TOKEN = 'router-api-token-0123456789abcdef0123';
const DIGEST = createHash('sha256').update(TOKEN).digest('hex');
const DELETE = {delete: true};

function memoryDb() {
  const docs = new Map();
  function doc(docPath) {
    return {
      path: docPath,
      id: docPath.split('/').pop(),
      async get() {
        return {id: docPath.split('/').pop(), exists: docs.has(docPath), data: () => docs.get(docPath)};
      },
      async update(data) {
        const current = docs.get(docPath);
        const next = {...current};
        for (const [key, value] of Object.entries(data)) {
          if (value === DELETE) {
            delete next[key];
          } else {
            next[key] = value;
          }
        }
        docs.set(docPath, next);
      },
      async set(data, options) {
        const current = docs.get(docPath) || {};
        docs.set(docPath, options && options.merge ? {...current, ...data} : data);
      },
    };
  }
  function collection(colPath) {
    const prefix = `${colPath}/`;
    const state = {filters: [], orders: [], start: null, lim: null};
    const query = {
      where(field, op, value) {
        state.filters.push({field, op, value});
        return query;
      },
      orderBy(field) {
        state.orders.push(field);
        return query;
      },
      startAfter(...values) {
        state.start = values;
        return query;
      },
      limit(count) {
        state.lim = count;
        return query;
      },
      async get() {
        const rows = [];
        docs.forEach((value, key) => {
          if (key.startsWith(prefix) && !key.slice(prefix.length).includes('/')) {
            rows.push({id: key.slice(prefix.length), value, data: () => value});
          }
        });
        return {docs: rows, empty: !rows.length, forEach(fn) {
          rows.forEach(fn);
        }};
      },
    };
    return query;
  }
  return {
    docs,
    doc,
    collection,
    async runTransaction(fn) {
      const transaction = {
        async get(ref) {
          return ref.get();
        },
        update(ref, data) {
          return ref.update(data);
        },
        set(ref, data, options) {
          return ref.set(data, options);
        },
      };
      return fn(transaction);
    },
  };
}

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

function createHandler(overrides = {}) {
  const {db: overrideDb, ...rest} = overrides;
  const db = overrideDb || memoryDb();
  db.docs.set('allowedUsers/owner@example.com', {});
  db.docs.set('users/uid-1/expense/anchor-books', {
    tags: [], tag: null, vendor: 'BOOK NOOK', operation: 'add', modifiedDate: 1,
  });
  db.docs.set('users/uid-1/config/tags', {tagList: ['food'], legacyTagList: []});
  const logs = [];
  const handler = createApiHandler({
    db,
    auth: {
      async getUserByEmail() {
        return {uid: 'uid-1', emailVerified: true, disabled: false};
      },
    },
    getTokenDigests: () => ({current: DIGEST, next: 'disabled'}),
    ownerEmail: 'owner@example.com',
    now: () => 1_700_000_000_000,
    logger: {
      info: (entry) => logs.push(entry),
      warn: (entry) => logs.push(entry),
    },
    fieldDelete: () => DELETE,
    documentIdField: '__name__',
    rateLimit: 60,
    ...rest,
  });
  return {handler, db, logs};
}

describe('createApiHandler', () => {
  it('returns only {ok:true} for GET /health without auth', async () => {
    const {handler} = createHandler();
    const res = mockRes();
    await handler(mockReq({method: 'GET', path: '/health'}), res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {ok: true});
    assert.equal(res.headers['cache-control'], 'no-store');
  });

  it('rejects browser Origin headers', async () => {
    const {handler} = createHandler();
    const res = mockRes();
    await handler(mockReq({method: 'GET', path: '/health', headers: {origin: 'https://evil.example'}}), res);
    assert.equal(res.statusCode, 403);
    assert.equal(res.body.error.code, 'browser_origin_not_allowed');
  });

  it('rejects http forwarded proto', async () => {
    const {handler} = createHandler();
    const res = mockRes();
    await handler(mockReq({
      method: 'GET', path: '/health', headers: {'x-forwarded-proto': 'http'},
    }), res);
    assert.equal(res.statusCode, 403);
    assert.equal(res.body.error.code, 'https_required');
  });

  it('returns 401 without a token and 404 for unknown routes', async () => {
    const {handler} = createHandler();
    const missing = mockRes();
    await handler(mockReq({method: 'GET', path: '/expenses'}), missing);
    assert.equal(missing.statusCode, 401);
    assert.equal(missing.body.error.code, 'missing_token');
    assert.equal(missing.headers['www-authenticate'], 'Bearer');

    const unknown = mockRes();
    await handler(mockReq({
      method: 'GET', path: '/nope', headers: {authorization: `Bearer ${TOKEN}`},
    }), unknown);
    assert.equal(unknown.statusCode, 404);
  });

  it('returns 405 with Allow for the wrong method', async () => {
    const {handler} = createHandler();
    const res = mockRes();
    await handler(mockReq({method: 'POST', path: '/health'}), res);
    assert.equal(res.statusCode, 405);
    assert.equal(res.body.error.code, 'method_not_allowed');
    assert.equal(res.headers.allow, 'GET');
  });

  it('rejects the wrong content-type and oversized bodies', async () => {
    const {handler} = createHandler();
    const type = mockRes();
    await handler(mockReq({
      method: 'PATCH',
      path: '/expense/anchor-books',
      headers: {authorization: `Bearer ${TOKEN}`, 'content-type': 'text/plain'},
      rawBody: '{"description":"x"}',
    }), type);
    assert.equal(type.statusCode, 415);

    const big = mockRes();
    await handler(mockReq({
      method: 'PATCH',
      path: '/expense/anchor-books',
      headers: {
        authorization: `Bearer ${TOKEN}`,
        'content-type': 'application/json',
        'content-length': String(20 * 1024),
      },
      rawBody: '{}',
    }), big);
    assert.equal(big.statusCode, 413);
  });

  it('rejects a bad expense id', async () => {
    const {handler} = createHandler();
    const res = mockRes();
    await handler(mockReq({
      method: 'PATCH',
      path: '/expense/not.valid',
      headers: {authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json'},
      rawBody: '{"description":"x"}',
    }), res);
    assert.equal(res.statusCode, 422);
    assert.equal(res.body.error.code, 'invalid_id');
  });

  it('returns 400 for invalid JSON', async () => {
    const {handler} = createHandler();
    const res = mockRes();
    await handler(mockReq({
      method: 'PATCH',
      path: '/expense/anchor-books',
      headers: {authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json'},
      rawBody: '{',
    }), res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error.code, 'invalid_json');
  });

  it('rejects a batch of more than 100 patches', async () => {
    const {handler} = createHandler();
    const res = mockRes();
    const patches = Array.from({length: 101}, (_, index) => ({id: `id-${index}`, description: 'x'}));
    await handler(mockReq({
      method: 'POST',
      path: '/expenses:batchUpdate',
      headers: {authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json'},
      rawBody: JSON.stringify({patches}),
    }), res);
    assert.equal(res.statusCode, 422);
    assert.equal(res.body.error.code, 'invalid_batch');
  });

  it('returns 401 for a wrong token with the same challenge header', async () => {
    const {handler} = createHandler();
    const missing = mockRes();
    await handler(mockReq({method: 'GET', path: '/expenses'}), missing);
    const wrong = mockRes();
    await handler(mockReq({
      method: 'GET',
      path: '/expenses',
      headers: {authorization: 'Bearer wrong-token-0123456789abcdef0123'},
    }), wrong);
    assert.equal(missing.statusCode, 401);
    assert.equal(wrong.statusCode, 401);
    assert.equal(missing.headers['www-authenticate'], 'Bearer');
    assert.equal(wrong.headers['www-authenticate'], missing.headers['www-authenticate']);
    assert.equal(wrong.body.error.code, 'invalid_token');
  });

  it('accepts the next token digest', async () => {
    const nextToken = 'router-next-token-0123456789abcdef0123';
    const nextDigest = createHash('sha256').update(nextToken).digest('hex');
    const {handler} = createHandler({
      getTokenDigests: () => ({current: DIGEST, next: nextDigest}),
    });
    const res = mockRes();
    await handler(mockReq({
      method: 'GET',
      path: '/expenses',
      headers: {authorization: `Bearer ${nextToken}`},
    }), res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.items.length, 1);
  });

  it('returns 429 with Retry-After', async () => {
    const {handler} = createHandler({rateLimit: 1});
    const headers = {authorization: `Bearer ${TOKEN}`};
    const first = mockRes();
    await handler(mockReq({method: 'GET', path: '/expenses', headers}), first);
    assert.equal(first.statusCode, 200);
    const second = mockRes();
    await handler(mockReq({method: 'GET', path: '/expenses', headers}), second);
    assert.equal(second.statusCode, 429);
    assert.equal(second.body.error.code, 'rate_limited');
    assert.match(second.headers['retry-after'], /^[1-9]\d*$/);
  });

  it('sets Idempotent-Replay when a batch request is repeated', async () => {
    const {handler} = createHandler();
    const rawBody = JSON.stringify({
      requestId: 'request-1',
      patches: [{id: 'anchor-books', description: 'note'}],
    });
    const headers = {authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json'};
    const first = mockRes();
    await handler(mockReq({method: 'POST', path: '/expenses:batchUpdate', headers, rawBody}), first);
    assert.equal(first.statusCode, 200);
    assert.equal(first.headers['idempotent-replay'], undefined);
    const replay = mockRes();
    await handler(mockReq({method: 'POST', path: '/expenses:batchUpdate', headers, rawBody}), replay);
    assert.equal(replay.statusCode, 200);
    assert.equal(replay.headers['idempotent-replay'], 'true');
  });
});
