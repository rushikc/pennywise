/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {describe, it} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {planFileMigration, writeOutput} = require('./migrateTagFiles');
const {planExpenseDocs} = require('./migrateTagsFirestore');

describe('migrateTagFiles', () => {
  it('transforms a synthetic folder without writing on dry-run planning', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-tags-in-'));
    fs.writeFileSync(path.join(dir, 'expense.json'), JSON.stringify([
      {id: '1', tag: 'food'},
      {id: '2', tag: null},
      {id: '3', tag: 'alcohol'},
    ]));
    fs.writeFileSync(path.join(dir, 'vendorTag.json'), JSON.stringify([{id: 'v', vendor: 'X', tag: 'food'}]));
    fs.writeFileSync(path.join(dir, 'budget.json'), JSON.stringify([{id: 'b', tagList: ['food']}]));
    fs.writeFileSync(path.join(dir, 'config.json'), JSON.stringify([{id: 'tags', tagList: ['food']}, {id: 'darkMode', value: false}]));
    fs.writeFileSync(path.join(dir, 'processedIds.json'), JSON.stringify([{id: 'p'}]));
    const plan = planFileMigration(dir);
    assert.equal(plan.expenseStats.stringToArray, 2);
    assert.equal(plan.expenseStats.nullToEmpty, 1);
    assert.deepEqual(plan.legacyTagList, ['alcohol']);
    assert.deepEqual(plan.nextConfig.find((item) => item.id === 'tags').legacyTagList, ['alcohol']);
    assert.equal(plan.nextConfig.find((item) => item.id === 'darkMode').value, false);

    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-tags-out-'));
    fs.rmSync(outDir, {recursive: true, force: true});
    writeOutput(outDir, plan, dir);
    const written = JSON.parse(fs.readFileSync(path.join(outDir, 'expense.json'), 'utf8'));
    assert.deepEqual(written[0].tags, ['food']);
    assert.deepEqual(written[1].tags, []);
    assert.equal(fs.existsSync(path.join(outDir, 'README.md')), true);
    assert.equal(JSON.parse(fs.readFileSync(path.join(outDir, '_manifest.json'), 'utf8')).schema, 'tags-v1');
    assert.equal(JSON.parse(fs.readFileSync(path.join(dir, 'expense.json'), 'utf8'))[0].tags, undefined);
  });
});

describe('planExpenseDocs', () => {
  it('plans Firestore updates without contacting the network', () => {
    const plan = planExpenseDocs([
      {id: 'a', tag: 'food', mailId: 'm'},
      {id: 'b', tags: ['food'], tag: 'food', mailId: 'm'},
      {id: 'c', tag: null, mailId: 'n'},
    ], ['food']);
    assert.equal(plan.stats.needingMigration, 2);
    assert.equal(plan.stats.alreadyMigrated, 1);
    assert.equal(plan.stats.shadowMailIdDocs, 2);
  });
});
