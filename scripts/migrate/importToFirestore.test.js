/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {describe, it} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const Module = require('module');
const {importAll, main, reportResult} = require('./importToFirestore');

function writeFixture(overrides = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-import-'));
  const files = {
    expense: [{id: 'e1', tags: ['food'], tag: 'food', cost: 1}],
    vendorTag: [{id: 'v1', vendor: 'X', tag: 'food'}],
    budget: [{id: 'b1', tagList: ['food']}],
    config: [{id: 'tags', tagList: ['food']}],
    processedIds: [{id: 'p1'}],
    ...overrides,
  };
  for (const [name, rows] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, `${name}.json`), JSON.stringify(rows));
  }
  return dir;
}

function fakeDb(onCreate = () => 'ok') {
  const pending = [];
  const profileSets = [];
  const writer = {
    create(ref, data) {
      let settle;
      const promise = new Promise((resolve, reject) => {
        settle = {resolve, reject};
      });
      pending.push({ref, data, settle});
      return promise;
    },
    async flush() {
      const batch = pending.splice(0);
      for (const job of batch) {
        const outcome = onCreate(job.ref, job.data);
        if (outcome === 'exists') {
          const err = new Error('ALREADY_EXISTS: already exists');
          err.code = 6;
          job.settle.reject(err);
        } else if (outcome === 'fail') {
          job.settle.reject(new Error('permission denied'));
        } else {
          job.settle.resolve();
        }
      }
    },
    async close() {
      await writer.flush();
    },
  };
  return {
    bulkWriter: () => writer,
    doc: (docPath) => ({
      path: docPath,
      set: async (data, opts) => {
        profileSets.push({path: docPath, data, opts});
      },
    }),
    profileSets,
  };
}

describe('importAll', () => {
  it('flushes BulkWriter before awaiting creates so the last batch settles', async () => {
    const dir = writeFixture();
    const db = fakeDb();
    const outcome = await Promise.race([
      importAll({db, uid: 'uid-1', dataDir: dir}),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('importAll hung waiting for flush')), 500);
      }),
    ]);
    assert.equal(outcome.ok, true);
    assert.equal(outcome.result.expense.created, 1);
    assert.equal(db.profileSets.length, 1);
    assert.equal(db.profileSets[0].path, 'users/uid-1/meta/profile');
    assert.equal(typeof db.profileSets[0].data.migratedAt, 'number');
  });

  it('counts already-exists as skippedExisting and still writes migratedAt', async () => {
    const dir = writeFixture();
    const db = fakeDb((ref) => (ref.path.includes('/expense/') ? 'exists' : 'ok'));
    const outcome = await importAll({db, uid: 'uid-1', dataDir: dir});
    assert.equal(outcome.ok, true);
    assert.equal(outcome.result.expense.skippedExisting, 1);
    assert.equal(outcome.result.expense.created, 0);
    assert.equal(db.profileSets.length, 1);
  });

  it('counts other errors as failed, skips migratedAt, and is not ok', async () => {
    const dir = writeFixture();
    const db = fakeDb((ref) => (ref.path.includes('/budget/') ? 'fail' : 'ok'));
    const previous = process.exitCode;
    const outcome = await importAll({db, uid: 'uid-1', dataDir: dir});
    reportResult(outcome.ok, outcome.result);
    assert.equal(outcome.ok, false);
    assert.equal(outcome.result.budget.failed, 1);
    assert.equal(db.profileSets.length, 0);
    assert.equal(process.exitCode, 1);
    process.exitCode = previous;
  });
});

describe('main', () => {
  it('dry run does not load firebase-admin', async () => {
    const dir = writeFixture();
    const origLoad = Module._load;
    Module._load = function load(request, parent, isMain) {
      if (request === 'firebase-admin') {
        throw new Error('firebase-admin loaded during dry run');
      }
      return origLoad.call(this, request, parent, isMain);
    };
    try {
      const result = await main(['node', 'importToFirestore.js', '--dir', dir, '--uid', 'uid-1']);
      assert.equal(result.mode, 'dry-run');
      assert.equal(result.counts.expense, 1);
    } finally {
      Module._load = origLoad;
    }
  });
});
