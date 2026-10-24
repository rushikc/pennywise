/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const {GoogleAuth} = require('google-auth-library');
const {serialize, timestampFolderName} = require('../firestoreJson');

const repoRoot = path.resolve(__dirname, '../..');

require('dotenv').config({
  path: path.resolve(repoRoot, '.env'),
});

async function exportCollection(collection) {
  const refs = await collection.listDocuments();
  const docs = [];
  for (const ref of refs) {
    docs.push(await exportDocument(ref));
  }
  return docs;
}

async function exportDocument(docRef) {
  const snap = await docRef.get();
  const out = {id: docRef.id};
  if (snap.exists) {
    Object.assign(out, serialize(snap.data()));
  }
  const subcols = await docRef.listCollections();
  if (subcols.length > 0) {
    out.__collections = {};
    for (const col of subcols) {
      out.__collections[col.id] = await exportCollection(col);
    }
  }
  return out;
}

async function walkRootCollections(db) {
  const collections = await db.listCollections();
  const tree = {};
  const counts = {};
  for (const collection of collections) {
    const docs = await exportCollection(collection);
    tree[collection.id] = docs;
    counts[collection.id] = docs.length;
  }
  return {tree, counts};
}

async function main() {
  const projectId = process.env.REACT_APP_FIREBASE_PROJECT_ID;
  if (!projectId) {
    console.error('REACT_APP_FIREBASE_PROJECT_ID is missing from the repo root .env.');
    process.exit(1);
  }

  const outRoot = process.env.PENNYWISE_BACKUP_DIR
    ? path.resolve(process.env.PENNYWISE_BACKUP_DIR)
    : path.join(repoRoot, 'backups');

  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/datastore'],
    projectId,
  });
  try {
    await auth.getClient();
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId,
    });
  } catch (err) {
    console.error('Could not load Google application default credentials.');
    console.error('Run: gcloud auth application-default login');
    console.error(err.message);
    process.exit(1);
  }

  const db = admin.firestore();
  const exportedAt = new Date();
  const outDir = path.join(outRoot, timestampFolderName(exportedAt));
  fs.mkdirSync(outDir, {recursive: true});

  const {tree, counts} = await walkRootCollections(db);
  for (const [name, docs] of Object.entries(tree)) {
    fs.writeFileSync(path.join(outDir, `${name}.json`), JSON.stringify(docs, null, 2));
    console.log(`${name}: ${docs.length} documents`);
  }

  fs.writeFileSync(path.join(outDir, '_manifest.json'), JSON.stringify({
    projectId,
    exportedAt: exportedAt.toISOString(),
    collections: counts,
  }, null, 2));
  console.log(`Wrote ${Object.keys(counts).length} collections to ${outDir}`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = {
  exportCollection,
  exportDocument,
  walkRootCollections,
};
