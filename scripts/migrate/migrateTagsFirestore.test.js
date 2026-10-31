/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {describe, it} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {planExpenseDocs, applyUpdates, rollbackFromFile} = require('./migrateTagsFirestore');

const deleteSentinel = {__deleteField: true};

function createFakeDb(initial = {}) {
  const docs = new Map();
  Object.entries(initial).forEach(([key, value]) => {
    docs.set(key, {
      data: {...value.data},
      updateTime: value.updateTime || 1,
      failCode: value.failCode,
    });
  });
  const db = {
    doc(docPath) {
      const self = {
        path: docPath,
        async get() {
          const rec = docs.get(docPath);
          if (!rec) {
            return {exists: false, get: () => undefined, data: () => undefined};
          }
          return {
            exists: true,
            updateTime: rec.updateTime,
            get: (field) => rec.data[field],
            data: () => rec.data,
            ref: self,
          };
        },
        async update(data, opts = {}) {
          const rec = docs.get(docPath);
          if (!rec) {
            const error = new Error('not found');
            error.code = 5;
            throw error;
          }
          if (rec.failCode) {
            const error = new Error('write failed');
            error.code = rec.failCode;
            throw error;
          }
          if (opts.lastUpdateTime != null && opts.lastUpdateTime !== rec.updateTime) {
            const error = new Error('concurrent');
            error.code = 9;
            throw error;
          }
          const next = {...rec.data};
          Object.entries(data).forEach(([key, value]) => {
            if (value === deleteSentinel) {
              delete next[key];
            } else {
              next[key] = value;
            }
          });
          rec.data = next;
          rec.updateTime += 1;
        },
      };
      return self;
    },
  };
  return {db, docs};
}

describe('planExpenseDocs', () => {
  it('includes vendor-tag-only and budget-only primaries in legacy', () => {
    const plan = planExpenseDocs(
      [{id: 'a', tags: ['food'], tag: 'food'}],
      ['food'],
      [{tag: 'alcohol'}],
      [{tagList: ['tech']}],
    );
    assert.deepEqual(plan.legacyTagList, ['alcohol', 'tech']);
  });

  it('counts null and untagged as nullToEmpty', () => {
    const plan = planExpenseDocs([
      {id: 'a', tag: 'food'},
      {id: 'b', tag: null},
      {id: 'c', tag: 'untagged'},
    ], ['food']);
    assert.equal(plan.stats.stringToArray, 1);
    assert.equal(plan.stats.nullToEmpty, 2);
  });
});

describe('applyUpdates', () => {
  it('counts a precondition failure as concurrent', async () => {
    const {db} = createFakeDb({
      'users/uid-1/expense/a': {data: {tag: 'food'}, updateTime: 2},
    });
    const result = await applyUpdates(db, 'uid-1', {
      updates: [{id: 'a', tags: ['food'], tag: 'food', updateTime: 1}],
      legacyTagList: [],
    }, null);
    assert.equal(result.skippedConcurrent, 1);
    assert.equal(result.updated, 0);
    assert.equal(result.errors.length, 0);
  });

  it('records a permission error so the caller can exit non-zero', async () => {
    const {db} = createFakeDb({
      'users/uid-1/expense/a': {data: {tag: 'food'}, updateTime: 1, failCode: 7},
    });
    const result = await applyUpdates(db, 'uid-1', {
      updates: [{id: 'a', tags: ['food'], tag: 'food', updateTime: 1}],
      legacyTagList: [],
    }, null);
    assert.equal(result.errors.length, 1);
    assert.equal(result.errors[0].code, 7);
    assert.equal(result.updated, 0);
  });
});

describe('rollbackFromFile', () => {
  it('sets a fresh modifiedDate and removes legacyTagList when hadLegacy is false', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-rollback-'));
    const filePath = path.join(dir, 'rollback.json');
    fs.writeFileSync(filePath, JSON.stringify({
      expenses: [{
        id: 'a',
        previousTag: 'food',
        previousModifiedDate: 1,
        migratedTags: ['food'],
        updateTime: 1,
      }],
      config: {hadLegacy: false},
    }));
    const {db, docs} = createFakeDb({
      'users/uid-1/expense/a': {data: {tag: 'food', tags: ['food'], modifiedDate: 1}, updateTime: 1},
      'users/uid-1/config/tags': {data: {tagList: ['food'], legacyTagList: ['alcohol']}, updateTime: 1},
    });
    const before = Date.now();
    const report = await rollbackFromFile(db, 'uid-1', filePath, true, deleteSentinel);
    assert.equal(report.restored, 1);
    const expense = docs.get('users/uid-1/expense/a').data;
    assert.equal(expense.tag, 'food');
    assert.equal(expense.tags, undefined);
    assert.ok(expense.modifiedDate >= before);
    assert.equal(docs.get('users/uid-1/config/tags').data.legacyTagList, undefined);
  });
});
