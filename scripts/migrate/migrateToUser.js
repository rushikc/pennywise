/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const fs = require('fs');
const path = require('path');
const {payloadWithoutId} = require('../firestoreJson');

const USER_COLLECTIONS = ['expense', 'vendorTag', 'budget', 'config'];

function parseArgs(argv) {
  const args = {apply: false, from: '', uid: ''};
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--apply') {
      args.apply = true;
    } else if (token === '--from') {
      args.from = argv[i + 1];
      i += 1;
    } else if (token === '--uid') {
      args.uid = argv[i + 1];
      i += 1;
    }
  }
  return args;
}

function loadCollection(dir, name) {
  const filePath = path.join(dir, `${name}.json`);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return Array.isArray(parsed) ? parsed : [];
}

function summarize(dir) {
  const counts = {};
  for (const name of USER_COLLECTIONS) {
    counts[name] = loadCollection(dir, name).length;
  }
  const extra = fs.readdirSync(dir)
    .filter((file) => file.endsWith('.json') && file !== '_manifest.json')
    .map((file) => file.replace(/\.json$/, ''))
    .filter((name) => !USER_COLLECTIONS.includes(name));
  return {counts, extra};
}

async function applyMigration(dir, uid) {
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
  const db = admin.firestore();
  const written = {};
  for (const name of USER_COLLECTIONS) {
    const docs = loadCollection(dir, name);
    written[name] = 0;
    const batchSize = 400;
    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = db.batch();
      const chunk = docs.slice(i, i + batchSize);
      chunk.forEach((doc) => {
        if (!doc.id) {
          return;
        }
        const ref = db.doc(`users/${uid}/${name}/${doc.id}`);
        batch.set(ref, payloadWithoutId(doc));
        written[name] += 1;
      });
      await batch.commit();
    }
  }
  await db.doc(`users/${uid}/meta/profile`).set({migratedAt: Date.now()}, {merge: true});
  return written;
}

async function main(argv = process.argv) {
  const args = parseArgs(argv);
  if (!args.from || !args.uid) {
    console.error('Usage: node scripts/migrate/migrateToUser.js --from <export-dir> --uid <firebaseUid> [--apply]');
    process.exit(1);
  }
  const dir = path.resolve(args.from);
  if (!fs.existsSync(dir)) {
    console.error(`Export directory not found: ${dir}`);
    process.exit(1);
  }
  const {counts, extra} = summarize(dir);
  console.log(JSON.stringify({
    mode: args.apply ? 'apply' : 'dry-run',
    from: dir,
    uid: args.uid,
    destination: `users/${args.uid}/...`,
    counts,
    skippedFiles: extra,
  }, null, 2));
  if (!args.apply) {
    return counts;
  }
  const written = await applyMigration(dir, args.uid);
  console.log(JSON.stringify({written}, null, 2));
  return written;
}

module.exports = {
  USER_COLLECTIONS,
  parseArgs,
  summarize,
  main,
};

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
