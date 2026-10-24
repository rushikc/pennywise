/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {describe, it} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {summarize, parseArgs, main} = require('./migrateToUser');

describe('migrateToUser', () => {
  it('parses flags and defaults to dry-run', () => {
    const args = parseArgs(['node', 'migrateToUser.js', '--from', '/tmp/export', '--uid', 'abc']);
    assert.equal(args.apply, false);
    assert.equal(args.uid, 'abc');
  });

  it('counts collection files without contacting Firestore', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-migrate-'));
    fs.writeFileSync(path.join(dir, 'expense.json'), JSON.stringify([{id: 'a', cost: 1}, {id: 'b', cost: 2}]));
    fs.writeFileSync(path.join(dir, 'budget.json'), JSON.stringify([{id: 't', name: 'Total'}]));
    fs.writeFileSync(path.join(dir, 'notes.json'), JSON.stringify([{id: 'n'}]));
    const summary = summarize(dir);
    assert.equal(summary.counts.expense, 2);
    assert.equal(summary.counts.budget, 1);
    assert.equal(summary.counts.vendorTag, 0);
    assert.deepEqual(summary.extra, ['notes']);
    const result = await main(['node', 'migrateToUser.js', '--from', dir, '--uid', 'uid-1']);
    assert.equal(result.expense, 2);
  });
});
