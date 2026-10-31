/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const fs = require('fs');
const path = require('path');
const {migrateExpenseDoc, computeLegacyTags, loadTags, isNullToEmptyTag} = require('./tagsModel');

function parseArgs(argv) {
  const args = {apply: false, force: false, in: '', out: ''};
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--apply') args.apply = true;
    else if (token === '--force') args.force = true;
    else if (token === '--in') args.in = argv[++i];
    else if (token === '--out') args.out = argv[++i];
  }
  return args;
}

function loadJson(dir, name) {
  const filePath = path.join(dir, `${name}.json`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function planFileMigration(inDir) {
  const {isValidPrimary} = loadTags();
  const expenses = loadJson(inDir, 'expense');
  const vendorTags = loadJson(inDir, 'vendorTag');
  const budgets = loadJson(inDir, 'budget');
  const config = loadJson(inDir, 'config');
  const processedIds = loadJson(inDir, 'processedIds');
  const tagsDoc = config.find((item) => item.id === 'tags') || {tagList: []};
  const tagList = tagsDoc.tagList || [];
  const legacyTagList = computeLegacyTags(expenses, vendorTags, budgets, tagList);
  const allowed = [...tagList, ...legacyTagList];

  const counts = {
    expense: expenses.length,
    vendorTag: vendorTags.length,
    budget: budgets.length,
    config: config.length,
    processedIds: processedIds.length,
  };
  const expenseStats = {
    stringToArray: 0,
    nullToEmpty: 0,
    alreadyArray: 0,
    invalidPrimaries: 0,
    dropped: 0,
    changed: 0,
  };
  const nextExpenses = expenses.map((doc) => {
    const beforeArray = Array.isArray(doc.tags);
    const {changed, next} = migrateExpenseDoc(doc);
    if (beforeArray) expenseStats.alreadyArray += 1;
    else if (typeof doc.tag === 'string' && doc.tag.trim() && doc.tag.trim().toLowerCase() !== 'untagged') {
      expenseStats.stringToArray += 1;
    } else if (isNullToEmptyTag(doc.tag)) {
      expenseStats.nullToEmpty += 1;
    }
    if (changed) expenseStats.changed += 1;
    const primary = next.tags[0];
    if (primary && !isValidPrimary(primary, tagList, legacyTagList)) {
      expenseStats.invalidPrimaries += 1;
    }
    return next;
  });

  const invalidVendor = vendorTags.filter((item) => item.tag && !isValidPrimary(item.tag, tagList, legacyTagList));
  const invalidBudget = [];
  for (const budget of budgets) {
    for (const tag of budget.tagList || []) {
      if (tag !== 'All' && !isValidPrimary(tag, tagList, legacyTagList)) {
        invalidBudget.push({id: budget.id, tag});
      }
    }
  }

  const nextConfig = config.map((doc) => {
    if (doc.id !== 'tags') {
      return doc;
    }
    return {...doc, tagList, legacyTagList};
  });

  return {
    counts,
    expenseStats,
    legacyTagList,
    invalidVendorCount: invalidVendor.length,
    invalidBudgetCount: invalidBudget.length,
    allowed,
    nextExpenses,
    nextConfig,
    vendorTags,
    budgets,
    processedIds,
  };
}

function writeOutput(outDir, plan, inDir) {
  fs.mkdirSync(outDir, {recursive: true});
  fs.writeFileSync(path.join(outDir, 'expense.json'), JSON.stringify(plan.nextExpenses, null, 2));
  fs.writeFileSync(path.join(outDir, 'vendorTag.json'), JSON.stringify(plan.vendorTags, null, 2));
  fs.writeFileSync(path.join(outDir, 'budget.json'), JSON.stringify(plan.budgets, null, 2));
  fs.writeFileSync(path.join(outDir, 'config.json'), JSON.stringify(plan.nextConfig, null, 2));
  fs.writeFileSync(path.join(outDir, 'processedIds.json'), JSON.stringify(plan.processedIds, null, 2));
  const manifest = {
    schema: 'tags-v1',
    derivedFrom: path.resolve(inDir),
    migratedAt: Date.now(),
    counts: {
      ...plan.counts,
      expenseChanged: plan.expenseStats.changed,
    },
    legacyTagList: plan.legacyTagList,
  };
  fs.writeFileSync(path.join(outDir, '_manifest.json'), JSON.stringify(manifest, null, 2));
  fs.writeFileSync(path.join(outDir, 'README.md'), [
    '# tags-v1 import folder',
    '',
    'Import this folder, not the original `temp/new-data/`.',
    '',
    '```text',
    'node temp/new-data/import-to-firestore.js --dir temp/new-data-v2 --email <me>',
    '```',
    '',
  ].join('\n'));
  const importSrc = path.join(inDir, 'import-to-firestore.js');
  if (fs.existsSync(importSrc)) {
    fs.copyFileSync(importSrc, path.join(outDir, 'import-to-firestore.js'));
  }
}

async function main(argv = process.argv) {
  const args = parseArgs(argv);
  if (!args.in || !args.out) {
    console.error('Usage: node scripts/migrate/migrateTagFiles.js --in <dir> --out <dir> [--apply] [--force]');
    process.exit(1);
  }
  const inDir = path.resolve(args.in);
  const outDir = path.resolve(args.out);
  if (path.resolve(inDir) === path.resolve(outDir)) {
    throw new Error('Refusing to write into --in. Choose a different --out directory.');
  }
  const plan = planFileMigration(inDir);
  const report = {
    mode: args.apply ? 'APPLY' : 'dry-run',
    counts: plan.counts,
    expenses: plan.expenseStats,
    legacyTagList: plan.legacyTagList,
    invalidVendorCount: plan.invalidVendorCount,
    invalidBudgetCount: plan.invalidBudgetCount,
  };
  console.log(JSON.stringify(report, null, 2));
  if (!args.apply) {
    return report;
  }
  if (fs.existsSync(outDir) && !args.force) {
    throw new Error(`${outDir} already exists. Pass --force to replace it.`);
  }
  writeOutput(outDir, plan, inDir);
  return report;
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
}

module.exports = {parseArgs, planFileMigration, writeOutput, main};
