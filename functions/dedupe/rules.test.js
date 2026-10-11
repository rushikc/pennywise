/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
 */

/* eslint-disable */

const {describe, it} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {detect} = require('./rules');

const fixturePath = path.join(__dirname, '../../temp/expenses-last-2-months.json');

function loadFixture() {
  const raw = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  return raw.expenses.map((e) => ({
    id: e.id,
    cost: e.cost,
    date: e.date_ms || e.date,
    vendor: e.vendor,
    type: e.type,
    tag: e.tag,
    costType: e.costType,
    mailId: e.mailId,
  }));
}

describe('dedupe rules engine', () => {
  const expenses = loadFixture();

  it('finds alias duplicate pairs (googleplay, netflix, etc.)', () => {
    const {pairs} = detect(expenses);
    const aliasRules = pairs.filter((p) => p.rule.startsWith('alias:'));
    assert.ok(aliasRules.length >= 6, `expected >=6 alias pairs, got ${aliasRules.length}`);
    assert.ok(aliasRules.some((p) => p.rule === 'alias:googleplay'));
    assert.ok(aliasRules.some((p) => p.rule === 'alias:netflix'));
    assert.ok(aliasRules.some((p) => p.rule === 'alias:redbus'));
  });

  it('finds cross-rail invest pairs including broker/exchange', () => {
    const {pairs} = detect(expenses);
    const railPairs = pairs.filter((p) => p.rule === 'rail:invest');
    assert.ok(railPairs.length >= 4, `expected >=4 rail pairs, got ${railPairs.length}`);
  });

  it('finds exchange-to-settlement Rs 35000 pairs', () => {
    const {pairs} = detect(expenses);
    const settlement35000 = pairs.filter(
        (p) => p.rule === 'rail:invest' && p.keep.cost === 35000,
    );
    assert.equal(settlement35000.length, 2, 'expected 2 Rs 35000 invest pairs');
  });

  it('does not false-positive on Rs 20000 rent/parents/invest same day', () => {
    const {pairs} = detect(expenses);
    const sept1 = expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === 2026 && d.getMonth() === 8 && d.getDate() === 1;
    });
    const sept1Ids = new Set(sept1.map((e) => e.id));
    const badPairs = pairs.filter(
        (p) => sept1Ids.has(p.keep.id) && sept1Ids.has(p.drop.id) &&
          p.keep.cost === 20000 &&
          (p.keep.tag === 'rent' || p.keep.tag === 'parents' ||
           p.drop.tag === 'rent' || p.drop.tag === 'parents'),
    );
    assert.equal(badPairs.length, 0, `false positive rent/parents pairs: ${JSON.stringify(badPairs)}`);
  });

  it('does not match HEISETASSE or PAYTMQR daily repeats', () => {
    const {pairs} = detect(expenses);
    const repeatFalsePositives = pairs.filter((p) =>
      String(p.keep.vendor).includes('HEISETASSE') ||
      String(p.drop.vendor).includes('HEISETASSE') ||
      String(p.keep.vendor).includes('PAYTMQR5VJKOR') ||
      String(p.drop.vendor).includes('PAYTMQR5VJKOR'),
    );
    assert.equal(repeatFalsePositives.length, 0);
  });

  it('returns at least 17 high-confidence pairs on 60-day fixture', () => {
    const {pairs} = detect(expenses);
    assert.ok(pairs.length >= 17, `expected >=17 pairs, got ${pairs.length}`);
    const inflation = pairs.reduce((sum, p) => sum + Number(p.drop.cost), 0);
    assert.ok(inflation >= 95000, `expected inflation >=95000, got ${inflation}`);
  });
});
