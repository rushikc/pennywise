/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {describe, it} = require('node:test');
const assert = require('node:assert/strict');
const fns = require('./functions');

global.isValidExpenseGeminiShape = fns.isValidExpenseGeminiShape;
global.normalizeGeminiExpense = fns.normalizeGeminiExpense;

const {
  isOutsideExpenseWindow,
  canonicalizeVendor,
  resolveVendorTag,
  mailDateFromMessage,
  validateExpense,
} = require('./expenses');

describe('isOutsideExpenseWindow', () => {
  it('skips hours 8 and 23', () => {
    assert.equal(isOutsideExpenseWindow(8), true);
    assert.equal(isOutsideExpenseWindow(23), true);
  });

  it('runs at hours 9 and 22', () => {
    assert.equal(isOutsideExpenseWindow(9), false);
    assert.equal(isOutsideExpenseWindow(22), false);
  });
});

describe('canonicalizeVendor', () => {
  it('reorders UPI id-then-name to NAME ID', () => {
    assert.equal(canonicalizeVendor('user@ybl Shop Name'), 'SHOP NAME USER@YBL');
  });

  it('does not reorder a vendor without a trailing name', () => {
    assert.equal(canonicalizeVendor('user@ybl'), 'USER@YBL');
  });

  it('truncates to 100 characters', () => {
    const long = 'a'.repeat(120);
    assert.equal(canonicalizeVendor(long).length, 100);
  });
});

describe('resolveVendorTag', () => {
  it('matches the truncated uppercase vendor', () => {
    const vendor = canonicalizeVendor('user@ybl Shop');
    const tag = resolveVendorTag(vendor, [{vendor: 'SHOP USER@YBL', tag: 'food'}]);
    assert.equal(tag, 'food');
  });

  it('treats a non-array tag list as empty', () => {
    assert.equal(resolveVendorTag('SHOP', null), undefined);
  });

  it('skips entries without vendor', () => {
    assert.equal(resolveVendorTag('SHOP', [{tag: 'food'}]), undefined);
  });
});

describe('mailDateFromMessage', () => {
  const now = 1_700_000_000_000;

  it('uses numeric internalDate', () => {
    assert.equal(mailDateFromMessage({internalDate: '1700000000000'}, now), 1700000000000);
  });

  it('falls back to now for invalid or missing dates', () => {
    assert.equal(mailDateFromMessage({internalDate: 'not-a-number'}, now), now);
    assert.equal(mailDateFromMessage({}, now), now);
  });
});

describe('validateExpense retry', () => {
  const valid = {cost: 12, costType: 'debit', vendor: 'Shop'};

  it('does not retry when the first body is null', () => {
    let calls = 0;
    const result = validateExpense(null, 't', 's', 'k', () => {
      calls += 1;
      return valid;
    });
    assert.equal(result, null);
    assert.equal(calls, 0);
  });

  it('does not retry when the first body is valid', () => {
    let calls = 0;
    const result = validateExpense(valid, 't', 's', 'k', () => {
      calls += 1;
      return valid;
    });
    assert.equal(result.vendor, 'Shop');
    assert.equal(calls, 0);
  });

  it('retries once when the first body is invalid then valid', () => {
    let calls = 0;
    const result = validateExpense({cost: 0, costType: 'debit', vendor: 'X'}, 't', 's', 'k', () => {
      calls += 1;
      return valid;
    });
    assert.equal(result.cost, 12);
    assert.equal(calls, 1);
  });

  it('returns null after an invalid retry', () => {
    const result = validateExpense(
        {vendor: 'X'},
        't',
        's',
        'k',
        () => ({vendor: 'still-bad'}),
    );
    assert.equal(result, null);
  });
});
