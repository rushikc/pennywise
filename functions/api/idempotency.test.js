/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {describe, it} = require('node:test');
const assert = require('node:assert/strict');
const {createIdempotency} = require('./idempotency');

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
        async set(data) {
          docs.set(path, data);
        },
      };
    },
  };
}

describe('idempotency', () => {
  it('replays the stored response for the same body', async () => {
    const db = memoryDb();
    const idem = createIdempotency({db});
    const body = {description: 'hello'};
    const first = await idem.lookup({
      uid: 'uid-1', tokenLabel: 'current', requestId: 'req-0001', body,
    });
    assert.equal(first.replay, false);
    await idem.store(first.ref, {
      status: 200,
      body: {id: 'e1', description: 'hello'},
      bodyHash: first.bodyHash,
      nowMs: 10,
    });
    const replay = await idem.lookup({
      uid: 'uid-1', tokenLabel: 'current', requestId: 'req-0001', body,
    });
    assert.equal(replay.replay, true);
    assert.equal(replay.status, 200);
    assert.deepEqual(replay.body, {id: 'e1', description: 'hello'});
  });

  it('conflicts when the same requestId has a different body', async () => {
    const db = memoryDb();
    const idem = createIdempotency({db});
    const first = await idem.lookup({
      uid: 'uid-1', tokenLabel: 'current', requestId: 'req-0001', body: {description: 'a'},
    });
    await idem.store(first.ref, {
      status: 200, body: {}, bodyHash: first.bodyHash, nowMs: 10,
    });
    const conflict = await idem.lookup({
      uid: 'uid-1', tokenLabel: 'current', requestId: 'req-0001', body: {description: 'b'},
    });
    assert.equal(conflict.status, 409);
    assert.equal(conflict.code, 'idempotency_conflict');
  });
});
