/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {describe, it} = require('node:test');
const assert = require('node:assert/strict');
const {migrateExpenseDoc, computeLegacyTags, countMailIdCollisions} = require('./tagsModel');

describe('migrateExpenseDoc', () => {
  it('wraps a string tag into tags and is then idempotent', () => {
    const first = migrateExpenseDoc({id: '1', tag: 'food', cost: 10});
    assert.equal(first.changed, true);
    assert.deepEqual(first.next.tags, ['food']);
    assert.equal(first.next.tag, 'food');
    assert.equal(first.next.cost, 10);
    const second = migrateExpenseDoc(first.next);
    assert.equal(second.changed, false);
  });

  it('turns a null tag into an empty tags array', () => {
    const result = migrateExpenseDoc({id: '2', tag: null});
    assert.equal(result.changed, true);
    assert.deepEqual(result.next.tags, []);
    assert.equal(result.next.tag, null);
  });
});

describe('computeLegacyTags', () => {
  it('finds primaries used anywhere but missing from tagList', () => {
    const legacy = computeLegacyTags(
      [{tag: 'alcohol'}, {tags: ['tech']}, {tag: 'food'}],
      [{tag: 'food'}],
      [{tagList: ['All', 'rent']}],
      ['food', 'rent'],
    );
    assert.deepEqual(legacy, ['alcohol', 'tech']);
  });
});

describe('countMailIdCollisions', () => {
  it('counts docs that share a mailId with another doc', () => {
    assert.equal(countMailIdCollisions([
      {id: 'a', mailId: 'm1'},
      {id: 'b', mailId: 'm1'},
      {id: 'c', mailId: 'm2'},
    ]), 2);
  });
});
