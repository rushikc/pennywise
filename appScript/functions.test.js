/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {describe, it} = require('node:test');
const assert = require('node:assert/strict');
const {
  isValidExpenseGeminiShape,
  normalizeGeminiExpense,
  findEmailParseBankMatch,
  extractEmailAddress,
  getMailSubject,
  getMailSenderReceiver,
  extractUsername,
} = require('./functions');

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
