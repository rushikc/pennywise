/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {describe, it} from 'node:test';
import assert from 'node:assert/strict';
import {
  canonicalizeVendor,
  extractEmailAddress,
  extractPlainTextFromHtml,
  extractUsername,
  findEmailParseBankMatch,
  gmailSearchQuery,
  getMailSenderReceiver,
  getMailSubject,
  isOutsideExpenseWindow,
  isValidExpenseGeminiShape,
  mailDateFromMessage,
  normalizeGeminiExpense,
  parseExpenseWithRegex,
  resolveVendorTag,
  validateExpense,
} from './index';

const valid = {cost: 10.5, costType: 'debit', vendor: 'Shop'};

describe('isValidExpenseGeminiShape', () => {
  it('accepts a valid debit expense', () => {
    assert.equal(isValidExpenseGeminiShape(valid), true);
  });

  it('accepts CREDIT / Debit with extra type', () => {
    assert.equal(isValidExpenseGeminiShape({...valid, costType: 'CREDIT', type: 'upi'}), true);
    assert.equal(isValidExpenseGeminiShape({...valid, costType: ' Debit '}), true);
  });

  it('rejects null, arrays, and missing keys', () => {
    assert.equal(isValidExpenseGeminiShape(null), false);
    assert.equal(isValidExpenseGeminiShape([]), false);
    assert.equal(isValidExpenseGeminiShape({costType: 'debit', vendor: 'X'}), false);
  });

  it('rejects non-positive or non-numeric cost', () => {
    assert.equal(isValidExpenseGeminiShape({...valid, cost: 0}), false);
    assert.equal(isValidExpenseGeminiShape({...valid, cost: -1}), false);
    assert.equal(isValidExpenseGeminiShape({...valid, cost: 'abc'}), false);
  });

  it('rejects blank vendor and unknown costType', () => {
    assert.equal(isValidExpenseGeminiShape({...valid, vendor: '   '}), false);
    assert.equal(isValidExpenseGeminiShape({...valid, costType: 'transfer'}), false);
  });
});

describe('normalizeGeminiExpense', () => {
  it('rounds cost to two decimals', () => {
    assert.equal(normalizeGeminiExpense({...valid, cost: 10.999}).cost, 11);
  });

  it('lowercases costType and type, and blanks type to null', () => {
    const n = normalizeGeminiExpense({...valid, costType: ' CREDIT ', type: ' UPI '});
    assert.equal(n.costType, 'credit');
    assert.equal(n.type, 'upi');
    assert.equal(normalizeGeminiExpense({...valid, type: '  '}).type, null);
  });

  it('trims vendor', () => {
    assert.equal(normalizeGeminiExpense({...valid, vendor: '  Shop  '}).vendor, 'Shop');
  });
});

describe('findEmailParseBankMatch', () => {
  const banks = [
    {displayName: 'HDFC', matchStrings: ['HDFC Bank', '']},
    {displayName: 'SBI', matchStrings: ['State Bank']},
    {displayName: '', matchStrings: ['Mystery Bank']},
  ];

  it('returns null for empty text or banks', () => {
    assert.equal(findEmailParseBankMatch('', banks), null);
    assert.equal(findEmailParseBankMatch('HDFC Bank', []), null);
  });

  it('matches case-insensitively and prefers the first bank', () => {
    assert.equal(findEmailParseBankMatch('debited by hdfc bank today', banks), 'HDFC');
    assert.equal(
      findEmailParseBankMatch('HDFC Bank and State Bank both mentioned', banks),
      'HDFC',
    );
  });

  it('falls back to Bank when displayName is empty', () => {
    assert.equal(findEmailParseBankMatch('Mystery Bank alert', banks), 'Bank');
  });

  it('matches substrings, not whole words', () => {
    assert.equal(findEmailParseBankMatch('xxHDFC Bankyy', banks), 'HDFC');
  });
});

describe('gmailSearchQuery', () => {
  it('includes an after: bound when afterMs is set', () => {
    const q = gmailSearchQuery(
      [{matchStrings: ['HDFC Bank']}],
      Date.UTC(2026, 8, 25),
    );
    assert.match(q, /after:2026\/09\/25/);
    assert.match(q, /"HDFC Bank"/);
  });
});

describe('email header helpers', () => {
  it('extracts angle-bracket emails without lowercasing', () => {
    assert.equal(extractEmailAddress('HDFC <Alerts@HDFC.com>'), 'Alerts@HDFC.com');
  });

  it('lowercases a bare email', () => {
    assert.equal(extractEmailAddress('A@B.com'), 'a@b.com');
  });

  it('reads Subject case-insensitively', () => {
    const res = {payload: {headers: [{name: 'SUBJECT', value: 'Txn'}]}};
    assert.equal(getMailSubject(res), 'Txn');
    assert.equal(getMailSubject({}), '');
  });

  it('reads From/To with exact header names', () => {
    const res = {
      payload: {
        headers: [
          {name: 'From', value: 'Bank <a@b.com>'},
          {name: 'To', value: 'Me <me@x.com>'},
        ],
      },
    };
    const out = getMailSenderReceiver(res);
    assert.equal(out.senderEmail, 'a@b.com');
    assert.equal(out.receiverEmail, 'me@x.com');
  });

  it('extracts username before @, and empty for invalid input', () => {
    assert.equal(extractUsername('RUSHI743@gmail.com'), 'rushi743');
    assert.equal(extractUsername('nonesuch'), 'nonesuch');
    assert.equal(extractUsername(null), '');
  });
});

describe('vendor helpers', () => {
  it('skips hours 8 and 23', () => {
    assert.equal(isOutsideExpenseWindow(8), true);
    assert.equal(isOutsideExpenseWindow(23), true);
  });

  it('runs at hours 9 and 22', () => {
    assert.equal(isOutsideExpenseWindow(9), false);
    assert.equal(isOutsideExpenseWindow(22), false);
  });

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

  it('matches the truncated uppercase vendor', () => {
    const vendor = canonicalizeVendor('user@ybl Shop');
    const tag = resolveVendorTag(vendor, [{vendor: 'SHOP USER@YBL', tag: 'food'}]);
    assert.equal(tag, 'food');
  });

  it('matches vendors case-insensitively', () => {
    assert.equal(
      resolveVendorTag(canonicalizeVendor('shop'), [{vendor: 'Shop', tag: 'mystery'}]),
      'mystery',
    );
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
    assert.equal(result?.vendor, 'Shop');
    assert.equal(calls, 0);
  });

  it('retries once when the first body is invalid then valid', () => {
    let calls = 0;
    const result = validateExpense({cost: 0, costType: 'debit', vendor: 'X'}, 't', 's', 'k', () => {
      calls += 1;
      return valid;
    });
    assert.equal(result?.cost, 10.5);
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

describe('regex parse', () => {
  it('parses an HDFC credit card debit', () => {
    const text = 'Rs.1,234.50 is debited from your HDFC Bank Credit Card ending 1234 towards AMAZON on 01-01-26';
    const parsed = parseExpenseWithRegex(text);
    assert.equal(parsed?.cost, 1234.5);
    assert.equal(parsed?.type, 'credit-card');
    assert.equal(parsed?.vendor, 'AMAZON');
  });
});

describe('extractPlainTextFromHtml', () => {
  it('strips style, script, and comments', () => {
    const html = '<style>p{}</style><script>x()</script><!-- hi --><p>Hello</p>';
    assert.equal(extractPlainTextFromHtml(html), 'Hello');
  });

  it('decodes entities and collapses whitespace', () => {
    const html = 'A&nbsp;&amp;&nbsp;B<br/>C&#8364;';
    const text = extractPlainTextFromHtml(html);
    assert.match(text, /A & B/);
    assert.match(text, /€/);
  });

  it('returns empty string for non-string input', () => {
    assert.equal(extractPlainTextFromHtml(null), '');
    assert.equal(extractPlainTextFromHtml(''), '');
  });

  it('keeps inner text of nested tags', () => {
    assert.equal(extractPlainTextFromHtml('<div><b>Shop</b> bill</div>'), 'Shop bill');
  });
});
