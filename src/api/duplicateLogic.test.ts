/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {applyDuplicateResolution, isHiddenDuplicate} from './duplicateLogic';
import {makeExpense} from '../testUtils';

describe('isHiddenDuplicate', () => {
  it('hides auto and confirmed duplicates', () => {
    expect(isHiddenDuplicate(makeExpense({duplicateOf: 'keep', dupeStatus: 'auto'}))).toBe(true);
    expect(isHiddenDuplicate(makeExpense({duplicateOf: 'keep', dupeStatus: 'confirmed'}))).toBe(true);
  });

  it('keeps pending and rejected visible', () => {
    expect(isHiddenDuplicate(makeExpense({duplicateOf: 'keep', dupeStatus: 'pending'}))).toBe(false);
    expect(isHiddenDuplicate(makeExpense({duplicateOf: 'keep', dupeStatus: 'rejected'}))).toBe(false);
  });

  it('is visible when duplicateOf is missing', () => {
    expect(isHiddenDuplicate(makeExpense({dupeStatus: 'auto'}))).toBe(false);
  });
});

describe('applyDuplicateResolution', () => {
  const keep = makeExpense({id: 'keep'});
  const drop = makeExpense({
    id: 'drop',
    dupeCandidateOf: 'keep',
    dupeStatus: 'pending',
    dupeRule: 'review:sameCostNearTime',
  });

  it('confirms by setting duplicateOf and clearing the candidate pointer', () => {
    const updated = applyDuplicateResolution(drop, keep, 'confirmed');
    expect(updated.duplicateOf).toBe('keep');
    expect(updated.dupeStatus).toBe('confirmed');
    expect(updated.dupeCandidateOf).toBeUndefined();
  });

  it('rejects by clearing dupe fields', () => {
    const updated = applyDuplicateResolution(drop, keep, 'rejected');
    expect(updated.dupeStatus).toBe('rejected');
    expect(updated.duplicateOf).toBeUndefined();
    expect(updated.dupeCandidateOf).toBeUndefined();
    expect(updated.dupeRule).toBeUndefined();
  });
});
