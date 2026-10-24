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
  const collections = await db.listCollections();
  const exportedAt = new Date();
  const outDir = path.join(outRoot, timestampFolderName(exportedAt));
  fs.mkdirSync(outDir, {recursive: true});

  const counts = {};
  for (const collection of collections) {
    const snapshot = await collection.get();
    const docs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...serialize(doc.data()),
    }));
    fs.writeFileSync(path.join(outDir, `${collection.id}.json`), JSON.stringify(docs, null, 2));
    counts[collection.id] = docs.length;
    console.log(`${collection.id}: ${docs.length} documents`);
  }

  fs.writeFileSync(path.join(outDir, '_manifest.json'), JSON.stringify({
    projectId,
    exportedAt: exportedAt.toISOString(),
    collections: counts,
  }, null, 2));
  console.log(`Wrote ${Object.keys(counts).length} collections to ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
