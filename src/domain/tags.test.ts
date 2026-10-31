/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import cases from '../../shared/tagCases.json';
import {
  extraTags,
  displayTag,
  groupKey,
  isUntagged,
  normalizeDescription,
  normalizeTags,
  primaryTag,
  readTags,
  sameTag,
  tagListStatus,
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

  describe('tagListStatus', () => {
    it.each(cases.tagListStatus)('$name', (item) => {
      expect(tagListStatus(item.tag, item.tagList, item.legacyTagList)).toBe(item.expected);
    });
  });

  it('groupKey lowercases the normalised primary', () => {
    expect(groupKey(' Food ')).toBe('food');
    expect(groupKey('untagged')).toBeNull();
  });

  it('displayTag uses list spelling when listed and the stored value otherwise', () => {
    expect(displayTag('FOOD', ['food'], [])).toBe('food');
    expect(displayTag('Mystery Shop', ['food'], [])).toBe('Mystery Shop');
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
