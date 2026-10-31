/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import cases from '../../shared/tagCases.json';
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

describe('tag helpers', () => {
  describe('normalizeTags', () => {
    it.each(cases.normalizeTags)('$name', (item) => {
      expect(normalizeTags(item.primary, item.extras, item.opts)).toEqual(item.expected);
    });
  });

  describe('readTags', () => {
    it.each(cases.readTags)('$name', (item) => {
      expect(readTags(item.doc)).toEqual(item.expected);
    });
  });

  describe('description', () => {
    it.each(cases.description)('$name', (item) => {
      const input = item.repeat ? item.input?.repeat(item.repeat) : item.input;
      const result = normalizeDescription(input);
      if (item.expectedLength != null) {
        expect(result).toHaveLength(item.expectedLength);
        return;
      }
      expect(result).toBe(item.expected ?? undefined);
    });
  });

  describe('isValidPrimary', () => {
    it.each(cases.isValidPrimary)('$name', (item) => {
      expect(isValidPrimary(item.tag, item.tagList, item.legacyTagList)).toBe(item.expected);
    });
  });

  describe('sameTag', () => {
    it.each(cases.sameTag)('$name', (item) => {
      expect(sameTag(item.left, item.right)).toBe(item.expected);
    });
  });

  it('derives primary, extras, untagged, and the tag mirror', () => {
    const expense = withTags({id: '1', mailId: 'm'}, ['food', 'zomato']);
    expect(expense.tags).toEqual(['food', 'zomato']);
    expect(expense.tag).toBe('food');
    expect(primaryTag(expense)).toBe('food');
    expect(extraTags(expense)).toEqual(['zomato']);
    expect(isUntagged(expense)).toBe(false);
    expect(isUntagged(withTags({}, []))).toBe(true);
    expect(withTags({}, []).tag).toBeNull();
  });
});
