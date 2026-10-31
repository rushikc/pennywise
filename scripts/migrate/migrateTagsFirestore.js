/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const fs = require('fs');
const path = require('path');
const {migrateExpenseDoc, computeLegacyTags, countMailIdCollisions} = require('./tagsModel');

function parseArgs(argv) {
  const args = {apply: false, email: '', uid: '', rollback: ''};
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--apply') args.apply = true;
    else if (token === '--email') args.email = argv[++i];
    else if (token === '--uid') args.uid = argv[++i];
    else if (token === '--rollback') args.rollback = argv[++i];
  }
  return args;
}

function planExpenseDocs(expenses, tagList) {
  const stats = {
    needingMigration: 0,
    alreadyMigrated: 0,
    stringToArray: 0,
    nullToEmpty: 0,
    invalidPrimaries: 0,
    shadowMailIdDocs: countMailIdCollisions(expenses),
  };
  const updates = [];
  for (const expense of expenses) {
    const {changed, next} = migrateExpenseDoc(expense);
    if (!changed) {
      stats.alreadyMigrated += 1;
      continue;
    }
    stats.needingMigration += 1;
    if (typeof expense.tag === 'string' && expense.tag.trim() && !Array.isArray(expense.tags)) {
      stats.stringToArray += 1;
    } else {
      stats.nullToEmpty += 1;
    }
    updates.push({
      id: expense.id,
      tags: next.tags,
      tag: next.tag,
      previousTag: expense.tag === undefined ? null : expense.tag,
      previousModifiedDate: expense.modifiedDate,
    });
  }
  const vendorTags = [];
  const budgets = [];
  const legacyTagList = computeLegacyTags(expenses, vendorTags, budgets, tagList);
  return {stats, updates, legacyTagList};
}

function initAdmin() {
  const admin = require('firebase-admin');
  const repoRoot = path.resolve(__dirname, '../..');
  require('dotenv').config({path: path.join(repoRoot, '.env')});
  const projectId = process.env.REACT_APP_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error('REACT_APP_FIREBASE_PROJECT_ID is missing from the repo root .env.');
  }
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId,
    });
  }
  return admin;
}

async function loadLiveExpenses(db, uid) {
  const snap = await db.collection(`users/${uid}/expense`).get();
  const expenses = [];
  snap.forEach((doc) => {
    expenses.push({id: doc.id, ...doc.data(), _updateTime: doc.updateTime});
  });
  return expenses;
}

async function applyUpdates(db, uid, plan, tagsSnap) {
  const rollback = {
    expenses: plan.updates.map((item) => ({
      id: item.id,
      previousTag: item.previousTag,
      previousModifiedDate: item.previousModifiedDate,
    })),
    config: tagsSnap && tagsSnap.exists && tagsSnap.get('legacyTagList') == null
      ? {hadLegacy: false}
      : null,
  };
  const rollbackDir = path.resolve(__dirname, '../../temp/migrations');
  fs.mkdirSync(rollbackDir, {recursive: true});
  const rollbackPath = path.join(rollbackDir, `tags-${Date.now()}.json`);
  fs.writeFileSync(rollbackPath, JSON.stringify(rollback, null, 2));

  const result = {updated: 0, skippedConcurrent: 0, configUpdated: false, rollbackPath};
  const nowMs = Date.now();
  for (const item of plan.updates) {
    const ref = db.doc(`users/${uid}/expense/${item.id}`);
    const snap = await ref.get();
    if (!snap.exists) {
      result.skippedConcurrent += 1;
      continue;
    }
    try {
      await ref.update({
        tags: item.tags,
        tag: item.tag,
        modifiedDate: nowMs,
      }, {lastUpdateTime: snap.updateTime});
      result.updated += 1;
    } catch (error) {
      result.skippedConcurrent += 1;
    }
  }
  if (tagsSnap && tagsSnap.exists && tagsSnap.get('legacyTagList') == null) {
    await tagsSnap.ref.update({legacyTagList: plan.legacyTagList});
    result.configUpdated = true;
  }
  return result;
}

async function rollbackFromFile(db, uid, filePath, apply) {
  const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const report = {mode: apply ? 'APPLY' : 'dry-run', expenseCount: (payload.expenses || []).length};
  console.log(JSON.stringify(report, null, 2));
  if (!apply) {
    return report;
  }
  const FieldValue = require('firebase-admin').firestore.FieldValue;
  for (const item of payload.expenses || []) {
    await db.doc(`users/${uid}/expense/${item.id}`).update({
      tag: item.previousTag,
      modifiedDate: item.previousModifiedDate,
      tags: FieldValue.delete(),
    });
  }
  return report;
}

async function main(argv = process.argv) {
  const args = parseArgs(argv);
  if (!args.email && !args.uid && !args.rollback) {
    console.error('Usage: node scripts/migrate/migrateTagsFirestore.js --email <me> [--apply]');
    process.exit(1);
  }
  if (args.rollback && !args.apply) {
    // still need credentials only on apply; dry-run rollback just prints the file
  }
  if (!args.apply && args.rollback) {
    const payload = JSON.parse(fs.readFileSync(path.resolve(args.rollback), 'utf8'));
    const report = {mode: 'dry-run', rollback: true, expenseCount: (payload.expenses || []).length};
    console.log(JSON.stringify(report, null, 2));
    return report;
  }

  const admin = initAdmin();
  const db = admin.firestore();
  let uid = args.uid;
  if (!uid) {
    uid = (await admin.auth().getUserByEmail(args.email)).uid;
  }

  if (args.rollback) {
    return rollbackFromFile(db, uid, path.resolve(args.rollback), args.apply);
  }

  const tagsSnap = await db.doc(`users/${uid}/config/tags`).get();
  const tagList = tagsSnap.exists ? (tagsSnap.get('tagList') || []) : [];
  const expenses = await loadLiveExpenses(db, uid);
  const plan = planExpenseDocs(expenses, tagList);
  const report = {
    mode: args.apply ? 'APPLY' : 'dry-run',
    ...plan.stats,
    legacyTagList: plan.legacyTagList,
    configHasLegacy: tagsSnap.exists ? tagsSnap.get('legacyTagList') != null : false,
  };
  console.log(JSON.stringify(report, null, 2));
  if (!args.apply) {
    return report;
  }
  const result = await applyUpdates(db, uid, plan, tagsSnap.exists ? tagsSnap : null);
  console.log(JSON.stringify(result, null, 2));
  return result;
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
}

module.exports = {parseArgs, planExpenseDocs, main};
