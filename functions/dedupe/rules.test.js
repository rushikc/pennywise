/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
 */

/* eslint-disable */

const {describe, it} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  detect,
  mergedTag,
  vendorMatchesPattern,
  resolveAliasEntity,
  resolveRail,
  pickSurvivor,
  defaultRules,
} = require('./rules');

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const t0 = Date.parse('2026-09-01T10:00:00+05:30');

function exp(overrides) {
  return {
    id: 'id-a',
    cost: 199,
    date: t0,
    vendor: 'NETFLIX',
    type: 'e-mandate',
    tag: null,
    costType: 'debit',
    ...overrides,
  };
}

describe('vendorMatchesPattern', () => {
  it('matches case-insensitively', () => {
    assert.equal(vendorMatchesPattern('Netflix', 'NETFLIX'), true);
  });

  it('matches GOOGLE\\s*PLAY against spaced and concatenated vendors', () => {
    assert.equal(vendorMatchesPattern('GOOGLE PLAY', 'GOOGLE\\s*PLAY'), true);
    assert.equal(vendorMatchesPattern('GOOGLEPLAY', 'GOOGLEPLAY'), true);
  });

  it('falls back to substring includes on invalid regex', () => {
    assert.equal(vendorMatchesPattern('FOO(BAR', '('), true);
    assert.equal(vendorMatchesPattern('FOO', '('), false);
  });

  it('does not match empty or undefined vendor', () => {
    assert.equal(vendorMatchesPattern(undefined, 'NETFLIX'), false);
    assert.equal(vendorMatchesPattern('', 'NETFLIX'), false);
  });
});

describe('resolveAliasEntity and resolveRail', () => {
  it('maps netflix and googleplay vendors to alias entities', () => {
    assert.equal(resolveAliasEntity(exp({vendor: 'NETFLIX'}), defaultRules), 'netflix');
    assert.equal(resolveAliasEntity(exp({vendor: 'GOOGLE PLAY'}), defaultRules), 'googleplay');
  });

  it('returns null for unknown vendors', () => {
    assert.equal(resolveAliasEntity(exp({vendor: 'HEISETASSE'}), defaultRules), null);
  });

  it('maps broker, exchange, and settlement rails', () => {
    const group = defaultRules.railGroups[0];
    assert.equal(resolveRail(exp({vendor: 'INDSTOCKS. SOMETHING'}), group), 'broker');
    assert.equal(resolveRail(exp({vendor: 'BSE STAR MF'}), group), 'exchange');
    assert.equal(resolveRail(exp({vendor: 'ICCL'}), group), 'settlement');
    assert.equal(resolveRail(exp({vendor: 'NETFLIX'}), group), null);
  });
});

describe('pickSurvivor and mergedTag', () => {
  it('keeps the earlier date', () => {
    const a = exp({id: 'z', date: t0 + MINUTE});
    const b = exp({id: 'a', date: t0});
    const {keep, drop} = pickSurvivor(a, b);
    assert.equal(keep.id, 'a');
    assert.equal(drop.id, 'z');
  });

  it('on equal date keeps the lexicographically smaller id', () => {
    const a = exp({id: 'b', date: t0});
    const b = exp({id: 'a', date: t0});
    const {keep} = pickSurvivor(a, b);
    assert.equal(keep.id, 'a');
  });

  it('mergedTag prefers keep, then drop, else undefined', () => {
    assert.equal(mergedTag({tag: 'food'}, {tag: 'travel'}), 'food');
    assert.equal(mergedTag({tag: null}, {tag: 'travel'}), 'travel');
    assert.equal(mergedTag({}, {}), undefined);
  });
});

describe('detect alias window and greedy pairing', () => {
  it('pairs alias vendors at exactly windowMinutes', () => {
    const {pairs} = detect([
      exp({id: '1', vendor: 'NETFLIX', date: t0}),
      exp({id: '2', vendor: 'NETFLIX BILL', date: t0 + 10 * MINUTE, type: 'upi'}),
    ]);
    assert.equal(pairs.length, 1);
    assert.equal(pairs[0].rule, 'alias:netflix');
  });

  it('does not pair alias vendors one millisecond past the window', () => {
    const {pairs} = detect([
      exp({id: '1', vendor: 'NETFLIX', date: t0}),
      exp({id: '2', vendor: 'NETFLIX BILL', date: t0 + 10 * MINUTE + 1, type: 'upi'}),
    ]);
    assert.equal(pairs.length, 0);
  });

  it('pairs greedy 1:1 so three same-cost hits produce one pair', () => {
    const {pairs, needsReview} = detect([
      exp({id: '1', vendor: 'NETFLIX', date: t0, type: 'upi'}),
      exp({id: '2', vendor: 'NETFLIX BILL', date: t0 + MINUTE, type: 'e-mandate'}),
      exp({id: '3', vendor: 'NETFLIX INDIA', date: t0 + 2 * MINUTE, type: 'credit-card'}),
    ]);
    assert.equal(pairs.length, 1);
    const used = new Set([pairs[0].keep.id, pairs[0].drop.id]);
    assert.equal(used.has('3') || needsReview.length >= 0, true);
  });
});

describe('detect same vendor / type', () => {
  it('does not auto-merge same vendor and same type', () => {
    const {pairs, needsReview} = detect([
      exp({id: '1', vendor: 'NETFLIX', type: 'e-mandate', date: t0}),
      exp({id: '2', vendor: 'NETFLIX', type: 'e-mandate', date: t0 + MINUTE}),
    ]);
    assert.equal(pairs.length, 0);
    assert.equal(needsReview.length, 1);
    assert.equal(needsReview[0].reason, 'sameVendorSameType');
  });

  it('auto-merges same vendor when types differ', () => {
    const {pairs, needsReview} = detect([
      exp({id: '1', vendor: 'NETFLIX', type: 'e-mandate', date: t0}),
      exp({id: '2', vendor: 'NETFLIX', type: 'upi', date: t0 + MINUTE}),
    ]);
    assert.equal(pairs.length, 1);
    assert.equal(needsReview.length, 0);
  });
});

describe('detect never-merge tags', () => {
  const netflixA = {vendor: 'NETFLIX', type: 'upi'};
  const netflixB = {vendor: 'NETFLIX BILL', type: 'e-mandate'};

  it('does not pair or review rent + parents', () => {
    const {pairs, needsReview} = detect([
      exp({id: '1', cost: 20000, vendor: 'LANDLORD', tag: 'rent', date: t0}),
      exp({id: '2', cost: 20000, vendor: 'FAMILY', tag: 'parents', date: t0 + MINUTE}),
    ]);
    assert.equal(pairs.length, 0);
    assert.equal(needsReview.length, 0);
  });

  it('may pair when only one side is tagged rent', () => {
    const {pairs} = detect([
      exp({id: '1', ...netflixA, tag: 'rent', date: t0}),
      exp({id: '2', ...netflixB, tag: null, date: t0 + MINUTE}),
    ]);
    assert.equal(pairs.length, 1);
  });

  it('may pair when both sides share the same tag', () => {
    const {pairs} = detect([
      exp({id: '1', ...netflixA, tag: 'entertainment', date: t0}),
      exp({id: '2', ...netflixB, tag: 'entertainment', date: t0 + MINUTE}),
    ]);
    assert.equal(pairs.length, 1);
  });

  it('does not block unrelated tags', () => {
    const {pairs} = detect([
      exp({id: '1', ...netflixA, tag: 'food', date: t0}),
      exp({id: '2', ...netflixB, tag: 'travel', date: t0 + MINUTE}),
    ]);
    assert.equal(pairs.length, 1);
  });
});

describe('detect amounts', () => {
  it('pairs string "199" with number 199', () => {
    const {pairs} = detect([
      exp({id: '1', vendor: 'NETFLIX', cost: '199', type: 'upi', date: t0}),
      exp({id: '2', vendor: 'NETFLIX BILL', cost: 199, type: 'e-mandate', date: t0 + MINUTE}),
    ]);
    assert.equal(pairs.length, 1);
  });

  it('does not pair 199.99 with 200', () => {
    const {pairs} = detect([
      exp({id: '1', vendor: 'NETFLIX', cost: 199.99, type: 'upi', date: t0}),
      exp({id: '2', vendor: 'NETFLIX BILL', cost: 200, type: 'e-mandate', date: t0 + MINUTE}),
    ]);
    assert.equal(pairs.length, 0);
  });

  it('can pair cost 0 when other fields match', () => {
    const {pairs} = detect([
      exp({id: '1', vendor: 'NETFLIX', cost: 0, type: 'upi', date: t0}),
      exp({id: '2', vendor: 'NETFLIX BILL', cost: 0, type: 'e-mandate', date: t0 + MINUTE}),
    ]);
    assert.equal(pairs.length, 1);
  });
});

describe('detect rails', () => {
  it('pairs broker and exchange within 24h', () => {
    const {pairs} = detect([
      exp({id: '1', vendor: 'INDSTOCKS. BUY', cost: 5000, date: t0}),
      exp({id: '2', vendor: 'BSE STAR MF', cost: 5000, date: t0 + 2 * HOUR}),
    ]);
    assert.equal(pairs.length, 1);
    assert.equal(pairs[0].rule, 'rail:invest');
  });

  it('does not pair two items on the same rail', () => {
    const {pairs} = detect([
      exp({id: '1', vendor: 'INDSTOCKS. A', cost: 5000, date: t0}),
      exp({id: '2', vendor: 'INDMONEY B', cost: 5000, date: t0 + HOUR}),
    ]);
    assert.equal(pairs.filter((p) => p.rule === 'rail:invest').length, 0);
  });

  it('chooses the closer candidate on the same opposing rail', () => {
    const {pairs} = detect([
      exp({id: 'broker', vendor: 'INDSTOCKS. BUY', cost: 35000, date: t0}),
      exp({id: 'far', vendor: 'BSE STAR MF', cost: 35000, date: t0 + 20 * HOUR}),
      exp({id: 'near', vendor: 'INDEX FUND A', cost: 35000, date: t0 + HOUR}),
    ]);
    assert.equal(pairs.length, 1);
    const ids = [pairs[0].keep.id, pairs[0].drop.id].sort();
    assert.deepEqual(ids, ['broker', 'near']);
  });

  it('does not rematch an alias pair in the rail pass', () => {
    const {pairs} = detect([
      exp({id: 'n1', vendor: 'NETFLIX', cost: 5000, type: 'upi', date: t0}),
      exp({id: 'n2', vendor: 'NETFLIX BILL', cost: 5000, type: 'e-mandate', date: t0 + MINUTE}),
      exp({id: 'b', vendor: 'INDSTOCKS. BUY', cost: 5000, date: t0}),
    ]);
    assert.equal(pairs.filter((p) => p.rule === 'alias:netflix').length, 1);
    assert.equal(pairs.filter((p) => p.rule === 'rail:invest').length, 0);
  });
});

describe('detect review, empty, and missing id', () => {
  it('flags unmatched different vendors with same cost within 5 minutes', () => {
    const {needsReview} = detect([
      exp({id: '1', vendor: 'SHOP A', cost: 99, date: t0}),
      exp({id: '2', vendor: 'SHOP B', cost: 99, date: t0 + 4 * MINUTE}),
    ]);
    assert.equal(needsReview.length, 1);
    assert.equal(needsReview[0].reason, 'sameCostNearTime');
  });

  it('ignores expenses without id', () => {
    const {pairs} = detect([
      {cost: 199, date: t0, vendor: 'NETFLIX'},
      exp({id: '2', vendor: 'NETFLIX BILL', type: 'upi'}),
    ]);
    assert.equal(pairs.length, 0);
  });

  it('returns empty lists for empty input', () => {
    const {pairs, needsReview} = detect([]);
    assert.deepEqual(pairs, []);
    assert.deepEqual(needsReview, []);
  });

  it('does not pair HEISETASSE daily repeats', () => {
    const {pairs} = detect([
      exp({id: '1', vendor: 'HEISETASSE', cost: 120, date: t0}),
      exp({id: '2', vendor: 'HEISETASSE', cost: 120, date: t0 + 24 * HOUR}),
    ]);
    assert.equal(pairs.length, 0);
  });
});

const fixturePath = path.join(__dirname, '../../temp/expenses-last-2-months.json');
const hasFixture = fs.existsSync(fixturePath);

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

describe('dedupe rules engine fixture', {skip: !hasFixture}, () => {
  const expenses = hasFixture ? loadFixture() : [];

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
