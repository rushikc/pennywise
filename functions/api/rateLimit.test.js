/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {describe, it} = require('node:test');
const assert = require('node:assert/strict');
const {createRateLimiter} = require('./rateLimit');

function memoryDb() {
  const docs = new Map();
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
    async runTransaction(fn) {
      const transaction = {
        async get(ref) {
          return ref.get();
        },
        set(ref, data, options) {
          return ref.set(data, options);
        },
      };
      return fn(transaction);
    },
  };
}

describe('createRateLimiter', () => {
  it('allows up to the limit then returns 429 with Retry-After', async () => {
    const db = memoryDb();
    const limiter = createRateLimiter({db, limit: 60});
    const nowMs = 1_700_000_000_000;
    for (let i = 0; i < 60; i += 1) {
      const result = await limiter.consume({uid: 'uid-1', tokenLabel: 'current', nowMs});
      assert.equal(result.ok, true);
    }
    const blocked = await limiter.consume({uid: 'uid-1', tokenLabel: 'current', nowMs});
    assert.equal(blocked.status, 429);
    assert.equal(blocked.code, 'rate_limited');
    assert.equal(typeof blocked.retryAfter, 'number');
    assert.equal(blocked.retryAfter > 0, true);
  });

  it('resets on the next minute bucket', async () => {
    const db = memoryDb();
    const limiter = createRateLimiter({db, limit: 1});
    const nowMs = 1_700_000_000_000;
    assert.equal((await limiter.consume({uid: 'uid-1', tokenLabel: 'current', nowMs})).ok, true);
    assert.equal((await limiter.consume({uid: 'uid-1', tokenLabel: 'current', nowMs})).status, 429);
    const nextMinute = nowMs + 60_000;
    assert.equal((await limiter.consume({uid: 'uid-1', tokenLabel: 'current', nowMs: nextMinute})).ok, true);
  });
});
