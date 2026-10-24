/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {describe, it} = require('node:test');
const assert = require('node:assert/strict');
const {advanceCursor} = require('./cursor');

function fakeDb(initial) {
  const docs = new Map([['users/u1/private/gmail', initial]]);
  return {
    docs,
    doc(path) {
      return {
        path,
        async get() {
          return {exists: docs.has(path), data: () => docs.get(path)};
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

describe('advanceCursor', () => {
  it('advances when the stored cursor still matches', async () => {
    const db = fakeDb({historyId: '10'});
    const result = await advanceCursor(db, 'u1', '10', '11', {lastProcessedAt: 1});
    assert.equal(result.advanced, true);
    assert.equal(db.docs.get('users/u1/private/gmail').historyId, '11');
  });

  it('does not overwrite a cursor that moved', async () => {
    const db = fakeDb({historyId: '12'});
    const result = await advanceCursor(db, 'u1', '10', '11');
    assert.equal(result.advanced, false);
    assert.equal(db.docs.get('users/u1/private/gmail').historyId, '12');
  });
});
