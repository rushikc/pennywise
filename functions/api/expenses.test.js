/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {describe, it} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {normalizeTags} = require('../lib/parse');
const {createExpenseApi, resolvePatchTags, publicExpense, PATCH_WRITE_KEYS} = require('./expenses');

const DELETE = {delete: true};
const fieldDelete = () => DELETE;
const tagCases = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', '..', 'shared', 'tagCases.json'), 'utf8'),
).normalizeTags;

function memoryDb() {
  const docs = new Map();
  const writes = {update: [], set: [], create: [], delete: []};

  function applyUpdate(current, data) {
    const next = {...current};
    for (const [key, value] of Object.entries(data)) {
      if (value === DELETE) {
        delete next[key];
      } else {
        next[key] = value;
      }
    }
    return next;
  }

  function doc(docPath) {
    return {
      path: docPath,
      id: docPath.split('/').pop(),
      async get() {
        return {
          id: docPath.split('/').pop(),
          exists: docs.has(docPath),
          data: () => docs.get(docPath),
        };
      },
      async update(data) {
        writes.update.push({path: docPath, data});
        if (!docs.has(docPath)) {
          throw new Error('missing');
        }
        docs.set(docPath, applyUpdate(docs.get(docPath), data));
      },
      async set() {
        writes.set.push(docPath);
        throw new Error('set');
      },
      async create() {
        writes.create.push(docPath);
        throw new Error('create');
      },
      async delete() {
        writes.delete.push(docPath);
        throw new Error('delete');
      },
    };
  }

  function collection(colPath) {
    const prefix = `${colPath}/`;
    const state = {filters: [], orders: [], start: null, lim: null};
    const query = {
      where(field, op, value) {
        state.filters.push({field, op, value});
        return query;
      },
      orderBy(field) {
        state.orders.push(field);
        return query;
      },
      startAfter(...values) {
        state.start = values;
        return query;
      },
      limit(count) {
        state.lim = count;
        return query;
      },
      async get() {
        const rows = [];
        docs.forEach((value, key) => {
          if (!key.startsWith(prefix)) {
            return;
          }
          const rest = key.slice(prefix.length);
          if (rest.includes('/')) {
            return;
          }
          rows.push({id: rest, value, data: () => value});
        });
        const filtered = rows.filter((row) => state.filters.every((filter) => {
          const actual = row.value[filter.field];
          if (filter.op === '==') {
            if (Array.isArray(filter.value)) {
              return JSON.stringify(actual || []) === JSON.stringify(filter.value);
            }
            return actual === filter.value;
          }
          if (filter.op === '>=') {
            return actual >= filter.value;
          }
          return true;
        }));
        filtered.sort((left, right) => {
          for (const field of state.orders) {
            if (field === '__name__') {
              if (left.id < right.id) return -1;
              if (left.id > right.id) return 1;
              continue;
            }
            const av = left.value[field];
            const bv = right.value[field];
            if (av < bv) return -1;
            if (av > bv) return 1;
          }
          if (left.id < right.id) return -1;
          if (left.id > right.id) return 1;
          return 0;
        });
        let started = filtered;
        if (state.start) {
          const [modifiedDate, id] = state.start;
          started = filtered.filter((row) => {
            if (row.value.modifiedDate > modifiedDate) {
              return true;
            }
            return row.value.modifiedDate === modifiedDate && row.id > id;
          });
        }
        const sliced = state.lim == null ? started : started.slice(0, state.lim);
        return {
          docs: sliced,
          empty: sliced.length === 0,
          forEach(fn) {
            sliced.forEach(fn);
          },
        };
      },
    };
    return query;
  }

  return {
    docs,
    writes,
    doc,
    collection,
    async runTransaction(fn) {
      const transaction = {
        async get(ref) {
          return ref.get();
        },
        update(ref, data) {
          return ref.update(data);
        },
        set() {
          writes.set.push('tx');
          throw new Error('set');
        },
        create() {
          writes.create.push('tx');
          throw new Error('create');
        },
        delete() {
          writes.delete.push('tx');
          throw new Error('delete');
        },
      };
      return fn(transaction);
    },
  };
}

function apiFor(db, nowMs = 1_700_000_000_000) {
  return createExpenseApi({
    db,
    now: () => nowMs,
    fieldDelete,
    documentIdField: '__name__',
  });
}

function seedExpense(db, id, data) {
  db.docs.set(`users/uid-1/expense/${id}`, data);
}

describe('resolvePatchTags', () => {
  it('matches normalizeTags for every shared tag case', () => {
    for (const testCase of tagCases) {
      const patch = {
        tags: [testCase.primary, ...testCase.extras],
        replace: true,
        replacePrimary: true,
      };
      const result = resolvePatchTags({tags: []}, patch, testCase.opts || {});
      const expected = normalizeTags(testCase.primary, testCase.extras, testCase.opts);
      assert.deepEqual(result.tags, expected.tags, testCase.name);
      assert.deepEqual(result.dropped, expected.dropped, testCase.name);
    }
  });

  it('sets primary on an untagged doc', () => {
    const result = resolvePatchTags({tags: []}, {tags: ['Food', 'zomato']}, {});
    assert.deepEqual(result.tags, ['Food', 'zomato']);
  });

  it('keeps server spelling when the primary matches case-insensitively', () => {
    const result = resolvePatchTags({tags: ['food']}, {tags: ['FOOD', 'office']}, {});
    assert.equal(result.tags[0], 'food');
    assert.deepEqual(result.tags, ['food', 'office']);
  });

  it('conflicts when the primary differs', () => {
    const result = resolvePatchTags({tags: ['food']}, {tags: ['rent']}, {});
    assert.equal(result.code, 'primary_conflict');
  });

  it('replacePrimary overrides a different primary', () => {
    const result = resolvePatchTags({tags: ['food']}, {tags: ['rent'], replacePrimary: true}, {});
    assert.deepEqual(result.tags, ['rent']);
  });

  it('unions extras in server order', () => {
    const result = resolvePatchTags(
      {tags: ['food', 'office', 'weekend']},
      {tags: ['food', 'split']},
      {},
    );
    assert.deepEqual(result.tags, ['food', 'office', 'weekend', 'split']);
  });

  it('replace replaces extras', () => {
    const result = resolvePatchTags(
      {tags: ['food', 'office']},
      {tags: ['food', 'split'], replace: true},
      {},
    );
    assert.deepEqual(result.tags, ['food', 'split']);
  });

  it('removeExtras drops matching extras', () => {
    const result = resolvePatchTags(
      {tags: ['food', 'office', 'weekend']},
      {removeExtras: ['OFFICE']},
      {},
    );
    assert.deepEqual(result.tags, ['food', 'weekend']);
  });

  it('reports overflow in dropped', () => {
    const extras = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const result = resolvePatchTags({tags: ['food']}, {tags: ['food', ...extras]}, {});
    assert.equal(result.tags.length, 8);
    assert.deepEqual(result.dropped, ['h']);
  });

  it('rejects extras without a primary', () => {
    const result = resolvePatchTags({tags: []}, {removeExtras: [], tags: undefined}, {});
    assert.equal(result.ok, true);
    const extrasOnly = resolvePatchTags({tags: ['only-extra']}, {tags: [], replacePrimary: true}, {});
    assert.deepEqual(extrasOnly.tags, []);
  });
});

describe('patchExpense', () => {
  it('writes only the allowed keys and bumps modifiedDate', async () => {
    const db = memoryDb();
    seedExpense(db, 'e1', {tags: [], tag: null, vendor: 'CAFE', operation: 'add', modifiedDate: 1});
    db.docs.set('users/uid-1/config/tags', {tagList: ['food'], legacyTagList: []});
    const api = apiFor(db, 50);
    const result = await api.patchExpense('uid-1', 'e1', {
      tags: ['food', 'api extra'],
      description: 'Dinner with team',
    });
    assert.equal(result.ok, true);
    const written = db.writes.update[0].data;
    assert.deepEqual(Object.keys(written).sort(), ['description', 'enrichedAt', 'modifiedDate', 'tag', 'tags']);
    for (const key of Object.keys(written)) {
      assert.equal(PATCH_WRITE_KEYS.has(key), true);
    }
    assert.equal(written.modifiedDate, 50);
    assert.equal(written.tag, 'food');
    assert.deepEqual(written.tags, ['food', 'api extra']);
    assert.equal(written.enrichedAt, 50);
    assert.equal(db.writes.set.length, 0);
    assert.equal(db.writes.create.length, 0);
    assert.equal(db.writes.delete.length, 0);
  });

  it('clears description with delete sentinel', async () => {
    const db = memoryDb();
    seedExpense(db, 'e1', {tags: ['food'], tag: 'food', description: 'old', operation: 'add'});
    const api = apiFor(db, 9);
    const result = await api.patchExpense('uid-1', 'e1', {description: null});
    assert.equal(result.ok, true);
    assert.equal(result.value.description, null);
    assert.equal(db.writes.update[0].data.description, DELETE);
    assert.equal(Object.prototype.hasOwnProperty.call(db.docs.get('users/uid-1/expense/e1'), 'description'), false);
  });

  it('returns 404 for a missing doc and 409 for a soft-deleted doc', async () => {
    const db = memoryDb();
    seedExpense(db, 'gone', {tags: ['food'], operation: 'delete'});
    const api = apiFor(db);
    assert.equal((await api.patchExpense('uid-1', 'missing', {description: 'x'})).code, 'expense_not_found');
    assert.equal((await api.patchExpense('uid-1', 'gone', {description: 'x'})).code, 'expense_deleted');
  });

  it('uses an explicit enrichedAt when provided', async () => {
    const db = memoryDb();
    seedExpense(db, 'e1', {tags: ['food'], tag: 'food', operation: 'add'});
    const api = apiFor(db, 100);
    const result = await api.patchExpense('uid-1', 'e1', {description: 'note', enrichedAt: 80});
    assert.equal(result.value.enrichedAt, 80);
  });
});

describe('listExpenses', () => {
  it('filters untagged, since, deleted docs, and response fields', async () => {
    const db = memoryDb();
    seedExpense(db, 'a', {
      tags: [], tag: null, vendor: 'A', cost: 1, costType: 'debit', date: 1,
      modifiedDate: 10, mailId: 'secret', user: 'me', operation: 'add', duplicateOf: 'x',
    });
    seedExpense(db, 'b', {tags: ['food'], tag: 'food', vendor: 'B', modifiedDate: 20, operation: 'add'});
    seedExpense(db, 'c', {tags: [], tag: null, vendor: 'C', modifiedDate: 30, operation: 'delete'});
    seedExpense(db, 'd', {tags: [], tag: null, vendor: 'D', modifiedDate: 40, operation: 'add'});
    const api = apiFor(db);
    const listed = await api.listExpenses('uid-1', {untagged: true, since: 10, limit: 50});
    assert.deepEqual(listed.value.items.map((item) => item.id), ['a', 'd']);
    const item = listed.value.items[0];
    assert.deepEqual(Object.keys(item).sort(), [
      'cost', 'costType', 'date', 'description', 'enrichedAt', 'id', 'modifiedDate', 'tags', 'vendor',
    ]);
    assert.equal(item.mailId, undefined);
    assert.equal(item.user, undefined);
    assert.equal(item.duplicateOf, undefined);
    assert.equal(item.description, null);
  });

  it('round-trips a cursor', async () => {
    const db = memoryDb();
    seedExpense(db, 'a', {tags: [], modifiedDate: 1, operation: 'add', vendor: 'A'});
    seedExpense(db, 'b', {tags: [], modifiedDate: 2, operation: 'add', vendor: 'B'});
    seedExpense(db, 'c', {tags: [], modifiedDate: 3, operation: 'add', vendor: 'C'});
    const api = apiFor(db);
    const first = await api.listExpenses('uid-1', {untagged: false, limit: 2});
    assert.deepEqual(first.value.items.map((item) => item.id), ['a', 'b']);
    assert.equal(typeof first.value.nextCursor, 'string');
    const second = await api.listExpenses('uid-1', {untagged: false, limit: 2, cursor: first.value.nextCursor});
    assert.deepEqual(second.value.items.map((item) => item.id), ['c']);
    assert.equal(second.value.nextCursor, null);
  });
});

describe('batchUpdate', () => {
  it('returns mixed statuses and counts', async () => {
    const db = memoryDb();
    seedExpense(db, 'ok', {tags: [], tag: null, operation: 'add'});
    seedExpense(db, 'dead', {tags: ['food'], operation: 'delete'});
    seedExpense(db, 'tagged', {tags: ['food'], tag: 'food', operation: 'add'});
    const api = apiFor(db);
    const result = await api.batchUpdate('uid-1', [
      {id: 'ok', tags: ['food']},
      {id: 'missing', description: 'x'},
      {id: 'dead', description: 'x'},
      {id: 'tagged', tags: ['rent']},
    ]);
    assert.equal(result.value.ok, 1);
    assert.equal(result.value.failed, 3);
    assert.deepEqual(result.value.results.map((item) => item.status), [200, 404, 409, 409]);
  });
});

describe('read helpers', () => {
  it('returns vendor tag and config lists with defaults', async () => {
    const db = memoryDb();
    db.docs.set('users/uid-1/vendorTag/v1', {vendor: 'CAFE', tag: 'food', extra: 'nope'});
    const api = apiFor(db);
    const vendors = await api.listVendorTags('uid-1');
    assert.deepEqual(vendors.value.items, [{id: 'v1', vendor: 'CAFE', tag: 'food'}]);
    const empty = await api.getTagConfig('uid-1');
    assert.deepEqual(empty.value, {tagList: [], legacyTagList: []});
  });

  it('whitelists public expense fields', () => {
    const item = publicExpense('id1', {vendor: 'X', mailId: 'm', user: 'u', duplicateOf: 'd', tags: ['food']});
    assert.equal(item.mailId, undefined);
    assert.equal(item.user, undefined);
    assert.deepEqual(item.tags, ['food']);
  });
});
