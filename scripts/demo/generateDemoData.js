#!/usr/bin/env node
/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '../..');
const TAG_LIST_PATH = path.join(ROOT, 'src/demoData/tagList.ts');
const EXPENSE_PATH = path.join(ROOT, 'src/demoData/expense.ts');
const VENDOR_TAG_PATH = path.join(ROOT, 'src/demoData/vendorTag.ts');
const PENDING_PAIRS_PATH = path.join(ROOT, 'src/demoData/pendingPairs.ts');

const SEED = 20251025;
const ANCHOR_MS = Date.UTC(2025, 9, 1, 18, 30, 0);
const DAY_MS = 24 * 60 * 60 * 1000;
const MONTHS = 12;
const TARGET_COUNT = 1080;

const MERCHANTS = [
  {vendor: 'SWIGGY', tag: 'food', extras: ['swiggy', 'online food ordering'], type: 'upi', min: 120, max: 650},
  {vendor: 'ZOMATO', tag: 'food', extras: ['zomato', 'online food ordering'], type: 'upi', min: 150, max: 800},
  {vendor: 'BigBasket', tag: 'groceries', type: 'upi', min: 400, max: 3200},
  {vendor: 'Local Kirana', tag: 'groceries', type: 'upi', min: 80, max: 900},
  {vendor: 'Uber', tag: 'transport', type: 'upi', min: 80, max: 450},
  {vendor: 'Amazon', tag: 'shopping', type: 'credit', min: 299, max: 4999},
  {vendor: 'Airtel', tag: 'amenities', type: 'e-mandate', min: 399, max: 999},
  {vendor: 'Rent', tag: 'rent', type: 'upi', min: 18000, max: 18000},
  {vendor: 'Indian Oil', tag: 'petrol', type: 'upi', min: 500, max: 2500},
  {vendor: 'A. SHARMA asharma42@okfake', tag: 'snacks', type: 'upi', min: 40, max: 220},
  {vendor: 'R. IYER riyer88@okfake', tag: 'drinks', type: 'upi', min: 80, max: 400},
  {vendor: 'P. NAIK pnaik17@okfake', tag: 'badminton', type: 'upi', min: 200, max: 600},
  {vendor: 'merchant123@okfake', tag: 'shopping', type: 'upi', min: 150, max: 1800},
  {vendor: 'localstore@okfake', tag: 'veg & fruits', type: 'upi', min: 60, max: 480},
  {vendor: 'Cult.fit', tag: 'fitness', type: 'upi', min: 300, max: 2000},
  {vendor: 'Decathlon', tag: 'sports', type: 'credit', min: 499, max: 3999},
  {vendor: 'Nykaa', tag: 'skin & hair', type: 'upi', min: 250, max: 1800},
  {vendor: 'Myntra', tag: 'clothes', type: 'credit', min: 499, max: 3499},
  {vendor: 'Croma', tag: 'gadgets', type: 'credit', min: 999, max: 12999},
  {vendor: 'Apollo Pharmacy', tag: 'medical', type: 'upi', min: 120, max: 1800},
  {vendor: 'Bata', tag: 'shoes', type: 'upi', min: 799, max: 2999},
  {vendor: 'Flipkart', tag: 'tech', type: 'credit', min: 499, max: 8999},
  {vendor: 'Groww', tag: 'invest', type: 'upi', min: 500, max: 5000},
  {vendor: 'Bike Service', tag: 'bike', type: 'upi', min: 350, max: 2500},
  {vendor: 'Spa House', tag: 'spa therapy ', type: 'upi', min: 800, max: 2500},
  {vendor: 'IRCTC', tag: 'travel', type: 'upi', min: 450, max: 3500},
  {vendor: 'Parents Transfer', tag: 'parents', type: 'upi', min: 2000, max: 8000},
];

const mulberry32 = (seed) => {
  let a = seed >>> 0;
  return () => {
    a += 0x6D2B79F5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const random = mulberry32(SEED);

const pick = (list) => list[Math.floor(random() * list.length)];

const money = (min, max) => {
  const value = min + random() * (max - min);
  return Math.round(value * 100) / 100;
};

const hexMailId = () => {
  let id = '';
  for (let i = 0; i < 16; i += 1) {
    id += Math.floor(random() * 16).toString(16);
  }
  return id;
};

const readTagList = () => {
  const source = fs.readFileSync(TAG_LIST_PATH, 'utf8');
  const matches = [...source.matchAll(/'([^']+)'/g)].map((match) => match[1]);
  return matches.filter((tag) => tag !== 'export const TAG_LIST = [');
};

const jsString = (value) => `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

const jsValue = (value, indent) => {
  if (value === null) {
    return 'null';
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (typeof value === 'string') {
    return jsString(value);
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[]';
    }
    const next = `${indent}  `;
    const items = value.map((item) => `${next}${jsValue(item, next)}`);
    return `[\n${items.join(',\n')},\n${indent}]`;
  }
  const keys = Object.keys(value);
  const next = `${indent}  `;
  const fields = keys.map((key) => `${next}${jsString(key)}: ${jsValue(value[key], next)}`);
  return `{\n${fields.join(',\n')},\n${indent}}`;
};

const formatTs = (body) => `/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

${body}
`;

const main = () => {
  const tags = readTagList();
  const tagSet = new Set(tags);
  for (const merchant of MERCHANTS) {
    if (!tagSet.has(merchant.tag)) {
      throw new Error(`Merchant tag "${merchant.tag}" is missing from tagList.ts`);
    }
  }

  const spanMs = MONTHS * 30 * DAY_MS;
  const expenses = [];
  const usedMailIds = new Set();

  while (expenses.length < TARGET_COUNT) {
    const merchant = pick(MERCHANTS);
    if (merchant.vendor === 'Rent' && expenses.length % 40 !== 0) {
      continue;
    }
    const age = Math.floor(random() * spanMs);
    const date = ANCHOR_MS - age;
    let mailId = hexMailId();
    while (usedMailIds.has(mailId)) {
      mailId = hexMailId();
    }
    usedMailIds.add(mailId);
    const vendorShort = merchant.vendor.split(' ')[0].slice(0, 12);
    const idDate = new Date(date).toISOString().slice(0, 16).replace('T', ' ');
    const tags = [merchant.tag, ...(merchant.extras || [])];
    expenses.push({
      cost: money(merchant.min, merchant.max),
      costType: random() > 0.08 ? 'debit' : 'credit',
      vendor: merchant.vendor,
      tags,
      tag: merchant.tag,
      type: merchant.type,
      date,
      modifiedDate: date,
      user: 'demo',
      mailId,
      id: `${idDate} ${vendorShort}`,
      operation: 'add',
    });
  }

  expenses.sort((a, b) => b.date - a.date);

  const zomatoNote = expenses.find((item) => item.vendor === 'ZOMATO');
  if (zomatoNote) {
    zomatoNote.description = 'Weekend treat';
  }
  const irctcNote = expenses.find((item) => item.vendor === 'IRCTC');
  if (irctcNote) {
    irctcNote.description = 'Long-distance trip';
  }

  const duplicateSources = [
    expenses.find((item) => item.vendor === 'SWIGGY'),
    expenses.find((item) => item.vendor === 'Uber'),
    expenses.find((item) => item.vendor === 'ZOMATO'),
  ];
  const pendingPairs = [];
  for (const keep of duplicateSources) {
    if (!keep) {
      throw new Error('Could not find a merchant to clone for duplicate review');
    }
    let mailId = hexMailId();
    while (usedMailIds.has(mailId)) {
      mailId = hexMailId();
    }
    usedMailIds.add(mailId);
    const dropDate = keep.date - Math.floor(2 * 60 * 1000 + random() * 8 * 60 * 1000);
    const drop = {
      ...keep,
      mailId,
      date: dropDate,
      modifiedDate: dropDate,
      cost: Math.round((keep.cost + (random() - 0.5) * 4) * 100) / 100,
      id: `${keep.id} ${mailId.slice(-4)}`,
    };
    expenses.push(drop);
    pendingPairs.push([keep.mailId, drop.mailId]);
  }

  expenses.sort((a, b) => b.date - a.date);

  const vendorTags = MERCHANTS.map((merchant) => ({
    vendor: merchant.vendor,
    tag: merchant.tag,
    date: ANCHOR_MS,
    id: merchant.vendor,
  }));

  const expenseBody = `export const ExpenseListNew = ${jsValue(expenses, '')};\n`;
  const vendorBody = `import {VendorTag} from '../Types';\n\nexport const VendorTags: VendorTag[] = ${jsValue(vendorTags, '')};\n`;
  const pairsBody = `export const PENDING_PAIRS: Array<[string, string]> = ${jsValue(pendingPairs, '')};\n`;

  fs.writeFileSync(EXPENSE_PATH, formatTs(expenseBody));
  fs.writeFileSync(VENDOR_TAG_PATH, formatTs(vendorBody));
  fs.writeFileSync(PENDING_PAIRS_PATH, formatTs(pairsBody));

  console.log(`Wrote ${expenses.length} expenses, ${vendorTags.length} vendor tags, ${pendingPairs.length} pending pairs`);
};

main();
