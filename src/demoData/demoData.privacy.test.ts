/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {ExpenseListNew} from './expense';
import {VendorTags} from './vendorTag';
import {TAG_LIST} from './tagList';
import {PENDING_PAIRS} from './pendingPairs';

const REAL_UPI = /@(ybl|ptybl|ptys|pty|paytm|okaxis|okhdfcbank|okicici|oksbi|ibl|axl|upi)\b/i;

describe('synthetic demo data privacy', () => {
  it('does not use real UPI handles on expenses or vendor tags', () => {
    for (const expense of ExpenseListNew) {
      expect(expense.vendor).not.toMatch(REAL_UPI);
    }
    for (const vendorTag of VendorTags) {
      expect(vendorTag.vendor).not.toMatch(REAL_UPI);
    }
  });

  it('only uses tags from tagList', () => {
    const allowed = new Set(TAG_LIST);
    for (const expense of ExpenseListNew) {
      if (expense.tag) {
        expect(allowed.has(expense.tag)).toBe(true);
      }
    }
    for (const vendorTag of VendorTags) {
      expect(allowed.has(vendorTag.tag)).toBe(true);
    }
  });

  it('includes pending duplicate pairs that exist in the expense list', () => {
    expect(PENDING_PAIRS.length).toBeGreaterThanOrEqual(2);
    const mailIds = new Set(ExpenseListNew.map((item) => item.mailId));
    for (const [keep, drop] of PENDING_PAIRS) {
      expect(mailIds.has(keep)).toBe(true);
      expect(mailIds.has(drop)).toBe(true);
    }
  });
});
