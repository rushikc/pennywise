/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {Expense} from '../Types';
import {JSONCopy} from '../utility/utility';

export const isHiddenDuplicate = (expense: Expense): boolean => {
  if (!expense.duplicateOf) {
    return false;
  }
  return expense.dupeStatus === 'auto' || expense.dupeStatus === 'confirmed';
};

export const applyDuplicateResolution = (
  drop: Expense,
  keep: Expense,
  action: 'confirmed' | 'rejected',
): Expense => {
  const updated = JSONCopy(drop) as Expense;
  updated.modifiedDate = Date.now();
  updated.operation = updated.operation || 'update';

  if (action === 'confirmed') {
    updated.duplicateOf = keep.id;
    updated.dupeStatus = 'confirmed';
    delete updated.dupeCandidateOf;
  } else {
    updated.dupeStatus = 'rejected';
    delete updated.duplicateOf;
    delete updated.dupeCandidateOf;
    delete updated.dupeRule;
  }

  return updated;
};
