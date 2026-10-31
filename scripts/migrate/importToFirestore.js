/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '../..');

function parseArgs(argv) {
  const args = {
    apply: false,
    uid: '',
    email: '',
    dir: path.join(repoRoot, 'temp/new-data'),
    allowLegacyShape: false,
  };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--apply') args.apply = true;
    else if (argv[i] === '--uid') args.uid = argv[++i];
    else if (argv[i] === '--email') args.email = argv[++i];
    else if (argv[i] === '--dir') args.dir = argv[++i];
    else if (argv[i] === '--allow-legacy-shape') args.allowLegacyShape = true;
  }
  return args;
}

function assertTagsSchema(expenses, allowLegacyShape, dataDir) {
  const manifestPath = path.join(dataDir, '_manifest.json');
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (manifest.schema !== 'tags-v1') {
      throw new Error(`_manifest.json schema must be tags-v1, got ${manifest.schema}`);
    }
  }
  if (allowLegacyShape) {
    return;
  }
  const missing = expenses.filter((row) => !Array.isArray(row.tags));
  if (missing.length) {
    throw new Error(
      `expense.json is missing a tags array on ${missing.length} rows. ` +
      'Migrate with scripts/migrate/migrateTagFiles.js or pass --allow-legacy-shape.',
    );
  }
  const mismatched = expenses.filter((row) => (row.tag ?? null) !== (row.tags[0] ?? null));
  if (mismatched.length) {
    throw new Error(
      `expense.json tag mirror mismatch on ${mismatched.length} rows (tag must equal tags[0] ?? null).`,
    );
  }
}

const load = (dir, name) => JSON.parse(fs.readFileSync(path.join(dir, `${name}.json`), 'utf8'));
const withoutId = ({id, ...rest}) => rest;

const PLAN = [
  {file: 'expense', path: (uid, id) => `users/${uid}/expense/${id}`},
  {file: 'vendorTag', path: (uid, id) => `users/${uid}/vendorTag/${id}`},
  {file: 'budget', path: (uid, id) => `users/${uid}/budget/${id}`},
  {file: 'config', path: (uid, id) => `users/${uid}/config/${id}`},
  {file: 'processedIds', path: (uid, id) => `users/${uid}/private/gmail/processedIds/${id}`},
];

function isAlreadyExists(err) {
  return Boolean(err && (err.code === 6 || /already exists/i.test(String(err.message || ''))));
}

async function importAll({db, uid, dataDir}) {
  const writer = db.bulkWriter();
  const result = {};
  for (const step of PLAN) {
    const stat = {created: 0, skippedExisting: 0, failed: 0};
    result[step.file] = stat;
    const jobs = load(dataDir, step.file).map((doc) =>
      writer.create(db.doc(step.path(uid, doc.id)), withoutId(doc))
        .then(() => {
          stat.created += 1;
        })
        .catch((err) => {
          if (isAlreadyExists(err)) {
            stat.skippedExisting += 1;
          } else {
            stat.failed += 1;
            console.error(step.file, doc.id, err.message);
          }
        }));
    await writer.flush();
    await Promise.all(jobs);
    console.log(step.file, JSON.stringify(stat));
  }
  await writer.close();
  const ok = Object.values(result).every((stat) => stat.failed === 0);
  if (ok) {
    await db.doc(`users/${uid}/meta/profile`).set({migratedAt: Date.now()}, {merge: true});
  }
  return {ok, result};
}

async function initLive(args) {
  require('dotenv').config({path: path.join(repoRoot, '.env')});
  const projectId = process.env.REACT_APP_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error('REACT_APP_FIREBASE_PROJECT_ID missing from the repo root .env');
  }
  const admin = require('firebase-admin');
  if (!admin.apps.length) {
    admin.initializeApp({credential: admin.credential.applicationDefault(), projectId});
  }
  let uid = args.uid;
  if (!uid) {
    uid = (await admin.auth().getUserByEmail(args.email)).uid;
  }
  return {db: admin.firestore(), uid};
}

async function main(argv = process.argv) {
  const args = parseArgs(argv);
  if (!args.uid && !args.email) {
    console.error('Pass --email <your google email> or --uid <firebase uid>.');
    process.exitCode = 1;
    return {done: false};
  }

  const dataDir = path.resolve(process.cwd(), args.dir);
  const counts = {};
  for (const step of PLAN) counts[step.file] = load(dataDir, step.file).length;
  assertTagsSchema(load(dataDir, 'expense'), args.allowLegacyShape, dataDir);
  console.log(JSON.stringify({mode: args.apply ? 'APPLY' : 'dry-run', dir: dataDir, counts}, null, 2));

  if (!args.apply) {
    console.log('Dry run only. Re-run with --apply to write to Firestore.');
    return {mode: 'dry-run', dir: dataDir, counts};
  }

  const {db, uid} = await initLive(args);
  console.log(`Credentials: gcloud application-default; project from .env (not printed); writing under users/${uid}/`);
  const {ok, result} = await importAll({db, uid, dataDir});
  return reportResult(ok, result);
}

function reportResult(ok, result) {
  console.log(JSON.stringify({done: ok, result}, null, 2));
  if (!ok) {
    process.exitCode = 1;
  }
  return {done: ok, result};
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = {parseArgs, assertTagsSchema, importAll, main, reportResult, PLAN};
