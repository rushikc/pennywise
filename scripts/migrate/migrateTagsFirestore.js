/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

// Optional: readers already tolerate `tag` without `tags`. Use this only to
// undo a live apply of the tags-v1 field rewrite.

const fs = require('fs');
const path = require('path');
const {migrateExpenseDoc, computeLegacyTags, countMailIdCollisions, isNullToEmptyTag} = require('./tagsModel');

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

function planExpenseDocs(expenses, tagList, vendorTags = [], budgets = []) {
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
    if (typeof expense.tag === 'string' && expense.tag.trim() &&
        expense.tag.trim().toLowerCase() !== 'untagged' && !Array.isArray(expense.tags)) {
      stats.stringToArray += 1;
    } else if (isNullToEmptyTag(expense.tag)) {
      stats.nullToEmpty += 1;
    }
    updates.push({
      id: expense.id,
      tags: next.tags,
      tag: next.tag,
      previousTag: expense.tag === undefined ? null : expense.tag,
      previousTags: Array.isArray(expense.tags) ? expense.tags : '__absent__',
      previousModifiedDate: expense.modifiedDate,
      updateTime: expense._updateTime || null,
    });
  }
  const legacyTagList = computeLegacyTags(expenses, vendorTags, budgets, tagList);
  return {stats, updates, legacyTagList};
}

function isConcurrentError(error) {
  const code = error && error.code;
  return code === 9 || code === '9' ||
    String(code).toLowerCase() === 'failed-precondition';
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

function serializeWriteTime(writeTime) {
  if (!writeTime) {
    return null;
  }
  if (typeof writeTime.seconds === 'number' && typeof writeTime.nanoseconds === 'number') {
    return {seconds: writeTime.seconds, nanoseconds: writeTime.nanoseconds};
  }
  if (typeof writeTime._seconds === 'number') {
    return {seconds: writeTime._seconds, nanoseconds: writeTime._nanoseconds || 0};
  }
  return null;
}

async function applyUpdates(db, uid, plan, tagsSnap) {
  const rollbackExpenses = [];
  const result = {
    updated: 0,
    skippedConcurrent: 0,
    configUpdated: false,
    rollbackPath: null,
    errors: [],
  };
  const nowMs = Date.now();
  for (const item of plan.updates) {
    const ref = db.doc(`users/${uid}/expense/${item.id}`);
    try {
      const writeResult = await ref.update({
        tags: item.tags,
        tag: item.tag,
        modifiedDate: nowMs,
      }, item.updateTime ? {lastUpdateTime: item.updateTime} : {});
      result.updated += 1;
      rollbackExpenses.push({
        id: item.id,
        previousTag: item.previousTag,
        previousTags: item.previousTags === undefined ? '__absent__' : item.previousTags,
        previousModifiedDate: item.previousModifiedDate,
        migratedTags: item.tags,
        writeTime: serializeWriteTime(writeResult && writeResult.writeTime),
      });
    } catch (error) {
      if (isConcurrentError(error)) {
        result.skippedConcurrent += 1;
        continue;
      }
      result.errors.push({id: item.id, message: error.message || String(error), code: error.code});
      if (result.errors.length >= 5) {
        break;
      }
    }
  }
  const rollback = {
    expenses: rollbackExpenses,
    config: tagsSnap && tagsSnap.exists && tagsSnap.get('legacyTagList') == null
      ? {hadLegacy: false}
      : null,
  };
  const rollbackDir = path.resolve(__dirname, '../../temp/migrations');
  fs.mkdirSync(rollbackDir, {recursive: true});
  const rollbackPath = path.join(rollbackDir, `tags-${Date.now()}.json`);
  fs.writeFileSync(rollbackPath, JSON.stringify(rollback, null, 2));
  result.rollbackPath = rollbackPath;
  if (result.errors.length === 0 && tagsSnap && tagsSnap.exists && tagsSnap.get('legacyTagList') == null) {
    await tagsSnap.ref.update({legacyTagList: plan.legacyTagList});
    result.configUpdated = true;
  }
  return result;
}

async function loadCollection(db, uid, name) {
  const snap = await db.collection(`users/${uid}/${name}`).get();
  const rows = [];
  snap.forEach((doc) => {
    rows.push({id: doc.id, ...doc.data()});
  });
  return rows;
}

function rehydrateWriteTime(writeTime, TimestampCtor) {
  if (!writeTime || typeof writeTime.seconds !== 'number') {
    return null;
  }
  if (TimestampCtor) {
    return new TimestampCtor(writeTime.seconds, writeTime.nanoseconds || 0);
  }
  return writeTime;
}

async function rollbackFromFile(db, uid, filePath, apply, fieldValueDelete, TimestampCtor) {
  const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const report = {
    mode: apply ? 'APPLY' : 'dry-run',
    expenseCount: (payload.expenses || []).length,
    restored: 0,
    skipped: 0,
    skippedChangedSince: 0,
    errors: [],
  };
  console.log(JSON.stringify({mode: report.mode, expenseCount: report.expenseCount}, null, 2));
  if (!apply) {
    return report;
  }
  const deleteField = fieldValueDelete || require('firebase-admin').firestore.FieldValue.delete();
  const Timestamp = TimestampCtor || require('firebase-admin').firestore.Timestamp;
  const nowMs = Date.now();
  for (const item of payload.expenses || []) {
    const ref = db.doc(`users/${uid}/expense/${item.id}`);
    try {
      const snap = await ref.get();
      if (!snap.exists) {
        report.skipped += 1;
        continue;
      }
      const writeTime = rehydrateWriteTime(item.writeTime, Timestamp);
      const precondition = writeTime ? {lastUpdateTime: writeTime} : {};
      const data = {
        tag: item.previousTag,
        modifiedDate: nowMs,
      };
      if (item.previousTags === '__absent__' || item.previousTags === undefined) {
        data.tags = deleteField;
      } else {
        data.tags = item.previousTags;
      }
      await ref.update(data, precondition);
      report.restored += 1;
    } catch (error) {
      if (isConcurrentError(error)) {
        report.skipped += 1;
        report.skippedChangedSince += 1;
        continue;
      }
      report.errors.push({id: item.id, message: error.message || String(error), code: error.code});
    }
  }
  if (payload.config && payload.config.hadLegacy === false) {
    try {
      await db.doc(`users/${uid}/config/tags`).update({legacyTagList: deleteField});
    } catch (error) {
      report.errors.push({id: 'config/tags', message: error.message || String(error), code: error.code});
    }
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
    return rollbackFromFile(
      db,
      uid,
      path.resolve(args.rollback),
      args.apply,
      admin.firestore.FieldValue.delete(),
      admin.firestore.Timestamp,
    );
  }

  const tagsSnap = await db.doc(`users/${uid}/config/tags`).get();
  const tagList = tagsSnap.exists ? (tagsSnap.get('tagList') || []) : [];
  const expenses = await loadLiveExpenses(db, uid);
  const vendorTags = await loadCollection(db, uid, 'vendorTag');
  const budgets = await loadCollection(db, uid, 'budget');
  const plan = planExpenseDocs(expenses, tagList, vendorTags, budgets);
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
  if ((result.errors || []).length > 0) {
    process.exit(1);
  }
  return result;
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
}

module.exports = {parseArgs, planExpenseDocs, applyUpdates, rollbackFromFile, main};
