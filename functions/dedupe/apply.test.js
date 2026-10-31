/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
 */

const {describe, it} = require('node:test');
const assert = require('node:assert/strict');
const {
  shouldScanExpense,
  shouldWriteKeepTag,
  shouldWriteKeepTags,
  pickReviewSurvivor,
  mergeRuleset,
} = require('./apply');
const {pickSurvivor, defaultRules} = require('./rules');

describe('shouldScanExpense', () => {
  it('includes a normal expense', () => {
    assert.equal(shouldScanExpense({vendor: 'X', cost: 1}), true);
  });

  it('skips deleted expenses', () => {
    assert.equal(shouldScanExpense({operation: 'delete'}), false);
  });

  it('skips expenses already marked duplicateOf', () => {
    assert.equal(shouldScanExpense({duplicateOf: 'keep-id'}), false);
  });

  it('skips expenses with existing dupeStatus', () => {
    assert.equal(shouldScanExpense({dupeStatus: 'pending'}), false);
    assert.equal(shouldScanExpense({dupeStatus: 'auto'}), false);
  });

  it('skips null data', () => {
    assert.equal(shouldScanExpense(null), false);
  });
});

describe('shouldWriteKeepTag', () => {
  it('writes when keep has no tag and inherited tag exists', () => {
    assert.equal(shouldWriteKeepTag({id: 'k'}, 'food'), true);
  });

  it('does not write when inherited tag is missing', () => {
    assert.equal(shouldWriteKeepTag({id: 'k'}, undefined), false);
  });
});

describe('shouldWriteKeepTags', () => {
  it('writes when merged tags differ from keep', () => {
    assert.equal(shouldWriteKeepTags({id: 'k', tag: 'travel'}, {tags: ['food']}), true);
  });

  it('does not write when tags already match', () => {
    assert.equal(shouldWriteKeepTags({id: 'k', tags: ['food', 'zomato']}, {tags: ['food', 'zomato']}), false);
  });

  it('writes when a description is added', () => {
    assert.equal(shouldWriteKeepTags(
      {id: 'k', tags: ['food']},
      {tags: ['food'], description: 'rare'},
    ), true);
  });
});

describe('pickReviewSurvivor vs pickSurvivor', () => {
  it('keeps the earlier date', () => {
    const a = {id: 'later', date: 20};
    const b = {id: 'earlier', date: 10};
    assert.equal(pickReviewSurvivor(a, b).keep.id, 'earlier');
  });

  it('on equal date keeps the first argument, unlike pickSurvivor', () => {
    const a = {id: 'z', date: 10};
    const b = {id: 'a', date: 10};
    assert.equal(pickReviewSurvivor(a, b).keep.id, 'z');
    assert.equal(pickSurvivor(a, b).keep.id, 'a');
  });
});

describe('mergeRuleset', () => {
  it('returns defaults when override is missing', () => {
    assert.equal(mergeRuleset(defaultRules), defaultRules);
  });

  it('overlays override fields on defaults', () => {
    const merged = mergeRuleset(defaultRules, {neverMerge: {sameVendorSameType: false}});
    assert.equal(merged.neverMerge.sameVendorSameType, false);
    assert.ok(merged.aliasGroups.length > 0);
  });
});
