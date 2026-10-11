/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {formatVendorName} from './utility';

describe('formatVendorName', () => {
  it('splits a UPI name-then-id vendor', () => {
    expect(formatVendorName('SHOP NAME user@ybl')).toEqual(['shop name', 'user@ybl']);
  });

  it('strips UUID text before manual entry', () => {
    expect(formatVendorName('abc-uuid manual entry payer@okaxis')).toEqual(['manual entry', 'payer@okaxis']);
    expect(formatVendorName('abc-uuid manual entry')).toEqual(['manual entry']);
  });

  it('lowercases a plain vendor', () => {
    expect(formatVendorName('Netflix')).toEqual(['netflix']);
  });

  it('returns empty string for empty vendor', () => {
    expect(formatVendorName('')).toBe('');
  });
});
