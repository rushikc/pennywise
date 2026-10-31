/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {EXPENSE_SCHEMA_VERSION, expenseSchemaNeedsFullRefetch} from './constants';

describe('expense schema cache reset', () => {
  it('forces a full refetch when the stored version is missing or stale', () => {
    expect(expenseSchemaNeedsFullRefetch(undefined)).toBe(true);
    expect(expenseSchemaNeedsFullRefetch('legacy')).toBe(true);
    expect(expenseSchemaNeedsFullRefetch(EXPENSE_SCHEMA_VERSION)).toBe(false);
  });
});
