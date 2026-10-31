/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {describe, it} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {
  extraTags,
  isUntagged,
  isValidPrimary,
  normalizeDescription,
  normalizeTags,
  primaryTag,
  readTags,
  sameTag,
  withTags,
} from './tags';

const cases = JSON.parse(
  readFileSync(path.join(__dirname, '../../../shared/tagCases.json'), 'utf8'),
) as {
  normalizeTags: Array<{
    name: string;
    primary: string | null;
    extras: string[];
    opts?: {tagList?: string[]; legacyTagList?: string[]};
    expected: {tags: string[]; dropped: string[]};
  }>;
  readTags: Array<{
    name: string;
    doc: {tags?: unknown; tag?: unknown};
    expected: string[];
  }>;
  description: Array<{
    name: string;
    input: string | null;
    expected?: string | null;
    repeat?: number;
    expectedLength?: number;
  }>;
  isValidPrimary: Array<{
    name: string;
    tag: string;
    tagList: string[];
    legacyTagList: string[];
    expected: boolean;
  }>;
  sameTag: Array<{
    name: string;
    left: string;
    right: string;
    expected: boolean;
  }>;
};

describe('tag helpers', () => {
  for (const item of cases.normalizeTags) {
    it(`normalizeTags: ${item.name}`, () => {
      assert.deepEqual(normalizeTags(item.primary, item.extras, item.opts), item.expected);
    });
  }

  for (const item of cases.readTags) {
    it(`readTags: ${item.name}`, () => {
      assert.deepEqual(readTags(item.doc), item.expected);
    });
  }

  for (const item of cases.description) {
    it(`description: ${item.name}`, () => {
      const input = item.repeat && item.input ? item.input.repeat(item.repeat) : item.input;
      const result = normalizeDescription(input);
      if (item.expectedLength != null) {
        assert.equal(result?.length, item.expectedLength);
        return;
      }
      assert.equal(result, item.expected ?? undefined);
    });
  }

  for (const item of cases.isValidPrimary) {
    it(`isValidPrimary: ${item.name}`, () => {
      assert.equal(isValidPrimary(item.tag, item.tagList, item.legacyTagList), item.expected);
    });
  }

  for (const item of cases.sameTag) {
    it(`sameTag: ${item.name}`, () => {
      assert.equal(sameTag(item.left, item.right), item.expected);
    });
  }

  it('derives primary, extras, untagged, and the tag mirror', () => {
    const expense = withTags({id: '1'}, ['food', 'zomato']);
    assert.deepEqual(expense.tags, ['food', 'zomato']);
    assert.equal(expense.tag, 'food');
    assert.equal(primaryTag(expense), 'food');
    assert.deepEqual(extraTags(expense), ['zomato']);
    assert.equal(isUntagged(expense), false);
    assert.equal(isUntagged(withTags({}, [])), true);
    assert.equal(withTags({}, []).tag, null);
  });
});
