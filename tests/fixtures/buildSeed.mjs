/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

/**
 * Regenerates tests/fixtures/seed/*.json. Deterministic (fixed PRNG seed and fixed NOW),
 * fully synthetic. Run: node tests/fixtures/buildSeed.mjs
 * Specs reference the "anchor" expenses by id, so keep those stable.
 */
import {writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const NOW = Date.UTC(2026, 5, 15, 6, 30, 0); // keep in sync with tests/fixtures/constants.ts
const HOUR = 3600000;
const DAY = 24 * HOUR;
const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'seed');

let state = 20260615;
const rand = () => {
  state = (state + 0x6d2b79f5) | 0;
  let t = Math.imul(state ^ (state >>> 15), 1 | state);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = (list) => list[Math.floor(rand() * list.length)];

const TAG_LIST = ['food', 'groceries', 'travel', 'petrol', 'subscribe', 'utility', 'rent', 'health', 'shopping', 'snacks'];
const LEGACY_TAG_LIST = ['amenities', 'Movies'];
const EXTRAS = ['office', 'weekend', 'split', 'cash'];

const BACKGROUND_VENDORS = [
  {vendor: 'FRESH BASKET', tag: 'groceries', min: 150, max: 2400},
  {vendor: 'GREEN GROCER', tag: 'groceries', min: 80, max: 900},
  {vendor: 'CITY CAFE', tag: 'food', min: 120, max: 900},
  {vendor: 'SPICE KITCHEN', tag: 'food', min: 200, max: 1600},
  {vendor: 'METRO RAIL', tag: 'travel', min: 30, max: 120},
  {vendor: 'QUICK FUEL', tag: 'petrol', min: 500, max: 3000},
  {vendor: 'SKY MOBILE', tag: 'utility', min: 299, max: 799},
  {vendor: 'PIXEL STREAM', tag: 'subscribe', min: 149, max: 649},
  {vendor: 'TOWN PHARMACY', tag: 'health', min: 90, max: 1400},
  {vendor: 'GYM PULSE', tag: 'health', min: 999, max: 1999},
  {vendor: 'BOOK NOOK', tag: 'shopping', min: 199, max: 1499},
  {vendor: 'CORNER SNACKS', tag: 'snacks', min: 40, max: 260},
];

const round2 = (value) => Math.round(value * 100) / 100;
let serial = 0;
const expense = ({id, vendor, cost, date, tags, description, costType = 'debit', type = 'credit', extra = {}}) => {
  serial += 1;
  const mailId = id ?? `e2e${String(serial).padStart(13, '0')}`;
  return {
    id: mailId,
    mailId,
    vendor,
    cost,
    costType,
    type,
    date,
    modifiedDate: date,
    user: 'e2e',
    operation: 'add',
    tags,
    tag: tags[0] ?? null,
    ...(description ? {description} : {}),
    ...extra,
  };
};

// Anchors: the only expenses inside the default 7 day window. Specs refer to these ids.
const anchors = [
  expense({id: 'anchor-cafe', vendor: 'CITY CAFE', cost: 450, date: NOW - 2 * HOUR,
    tags: ['food', 'office', 'weekend', 'split'], description: 'Team lunch with the design crew'}),
  expense({id: 'anchor-books', vendor: 'BOOK NOOK', cost: 899, date: NOW - 1 * DAY, tags: []}),
  expense({id: 'anchor-pets-lower', vendor: 'PET PALS', cost: 640, date: NOW - 1 * DAY - 3 * HOUR, tags: ['pets']}),
  expense({id: 'anchor-pets-upper', vendor: 'PET PALS', cost: 310, date: NOW - 2 * DAY, tags: ['Pets']}),
  expense({id: 'anchor-gift', vendor: 'GIFT GALLERY', cost: 1250, date: NOW - 3 * DAY, tags: ['gifts']}),
  expense({id: 'anchor-spice', vendor: 'SPICE KITCHEN', cost: 720, date: NOW - 2 * DAY - 5 * HOUR, tags: ['food']}),
  expense({id: 'anchor-metro', vendor: 'METRO RAIL', cost: 60, date: NOW - 4 * DAY,
    tags: ['travel', 'office'], description: 'Client visit downtown'}),
  expense({id: 'anchor-fuel', vendor: 'QUICK FUEL', cost: 1800, date: NOW - 3 * DAY - 2 * HOUR, tags: []}),
  expense({id: 'anchor-stream', vendor: 'PIXEL STREAM', cost: 199, date: NOW - 6 * DAY, tags: []}),
  expense({id: 'anchor-movie', vendor: 'MOVIE MAX', cost: 540, date: NOW - 5 * DAY, tags: ['Movies']}),
  expense({id: 'anchor-refund', vendor: 'FRESH BASKET', cost: 230, date: NOW - 4 * DAY - 6 * HOUR,
    tags: ['groceries'], costType: 'credit'}),
  // Duplicate pair 1 (inside the window): candidate points at the keeper.
  expense({id: 'dupe-sky-keep', vendor: 'SKY MOBILE', cost: 599, date: NOW - 5 * DAY - 2 * HOUR, tags: ['utility']}),
  expense({id: 'dupe-sky-drop', vendor: 'SKY MOBILE', cost: 599, date: NOW - 5 * DAY - 2 * HOUR + 120000, tags: ['utility'],
    extra: {dupeCandidateOf: 'dupe-sky-keep', dupeStatus: 'pending', dupeRule: 'review'}}),
];

// Duplicate pair 2 (older).
const olderDupes = [
  expense({id: 'dupe-grocer-keep', vendor: 'GREEN GROCER', cost: 342.5, date: NOW - 20 * DAY, tags: ['groceries']}),
  expense({id: 'dupe-grocer-drop', vendor: 'GREEN GROCER', cost: 342.5, date: NOW - 20 * DAY + 60000, tags: ['groceries'],
    extra: {dupeCandidateOf: 'dupe-grocer-keep', dupeStatus: 'pending', dupeRule: 'review'}}),
];

// Background: 8 to 120 days old, monthly rent, a few extras, notes and untagged rows.
const background = [];
for (let month = 0; month < 4; month += 1) {
  background.push(expense({vendor: 'HOME RENT CO', cost: 18000, date: NOW - (10 + month * 30) * DAY, tags: ['rent']}));
}
for (let i = 0; i < 130; i += 1) {
  const v = pick(BACKGROUND_VENDORS);
  const date = NOW - 8 * DAY - Math.floor(rand() * 112 * DAY);
  const roll = rand();
  let tags = [v.tag];
  if (roll < 0.06) tags = [];
  else if (roll < 0.2) tags = [v.tag, pick(EXTRAS)];
  const description = rand() < 0.07 ? pick(['Split with flatmates', 'Monthly top-up', 'Paid by card']) : undefined;
  background.push(expense({vendor: v.vendor, cost: round2(v.min + rand() * (v.max - v.min)), date, tags, description}));
}

const expenses = [...anchors, ...olderDupes, ...background].sort((a, b) => b.date - a.date);

const vendorTags = [
  ['CITY CAFE', 'food'], ['SPICE KITCHEN', 'food'], ['METRO RAIL', 'travel'], [' quick fuel ', 'petrol'],
  ['GREEN GROCER', 'groceries'], ['FRESH BASKET', 'groceries'], ['SKY MOBILE', 'utility'], ['HOME RENT CO', 'rent'],
  ['GYM PULSE', 'health'], ['TOWN PHARMACY', 'health'], ['CORNER SNACKS', 'snacks'], ['MOVIE MAX', 'Movies'],
].map(([vendor, tag], index) => ({id: `vt-${index + 1}`, vendor, tag, date: NOW - 30 * DAY}));

const budgets = [
  {id: 'budget-food', name: 'Food', amount: 12000, tagList: ['food', 'groceries', 'snacks'], modifiedDate: NOW - 30 * DAY},
  {id: 'budget-travel', name: 'Travel', amount: 5000, tagList: ['travel', 'petrol'], modifiedDate: NOW - 30 * DAY},
  {id: 'budget-bills', name: 'Bills', amount: 30000, tagList: ['rent', 'utility', 'subscribe'], modifiedDate: NOW - 30 * DAY},
];

const config = {
  tags: {tagList: TAG_LIST, legacyTagList: LEGACY_TAG_LIST},
  darkMode: {value: false},
  emailParseBanks: {
    banks: [
      {id: 'e2e-bank-a', displayName: 'Sample Bank A', matchStrings: ['SAMPLEBANKA']},
      {id: 'e2e-bank-b', displayName: 'Sample Bank B', matchStrings: ['SAMPLEBANKB']},
    ],
    modifiedDate: NOW - 60 * DAY,
  },
  investments: {list: []},
};

const write = (name, data) => writeFileSync(path.join(outDir, name), `${JSON.stringify(data, null, 1)}\n`);
write('expenses.json', expenses);
write('vendorTags.json', vendorTags);
write('budgets.json', budgets);
write('config.json', config);
console.log(`expenses=${expenses.length} vendorTags=${vendorTags.length} budgets=${budgets.length}`);
