const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const {GoogleAuth} = require('google-auth-library');
const {
  Timestamp,
  GeoPoint,
  DocumentReference,
} = require('firebase-admin/firestore');

const repoRoot = path.resolve(__dirname, '../../..');

require('dotenv').config({
  path: path.resolve(__dirname, '../../../.env'),
});

function serialize(value) {
  if (value === null || value === undefined) {
    return value;
  }
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (value instanceof GeoPoint) {
    return {latitude: value.latitude, longitude: value.longitude};
  }
  if (value instanceof DocumentReference) {
    return value.path;
  }
  if (Array.isArray(value)) {
    return value.map(serialize);
  }
  if (typeof value === 'object' && value.constructor === Object) {
    const out = {};
    for (const [key, nested] of Object.entries(value)) {
      out[key] = serialize(nested);
    }
    return out;
  }
  return value;
}

function timestampFolderName(date) {
  return date.toISOString().replace(/\.\d+Z$/, '').replace(/:/g, '-');
}

async function main() {
  const projectId = process.env.REACT_APP_FIREBASE_PROJECT_ID;
  if (!projectId) {
    console.error('REACT_APP_FIREBASE_PROJECT_ID is missing from the repo root .env.');
    process.exit(1);
  }

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
  let collections;
  try {
    collections = await db.listCollections();
  } catch (err) {
    console.error('Could not list Firestore collections.');
    console.error('If this is an auth error, run: gcloud auth application-default login');
    console.error(err.message);
    process.exit(1);
  }

  const exportedAt = new Date();
  const outDir = path.join(repoRoot, 'temp', `export-data-${timestampFolderName(exportedAt)}`);
  fs.mkdirSync(outDir, {recursive: true});

  const counts = {};
  for (const collection of collections) {
    const snapshot = await collection.get();
    const docs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...serialize(doc.data()),
    }));
    const filePath = path.join(outDir, `${collection.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(docs, null, 2));
    counts[collection.id] = docs.length;
    console.log(`${collection.id}: ${docs.length} documents`);
  }

  const manifest = {
    projectId,
    exportedAt: exportedAt.toISOString(),
    collections: counts,
  };
  fs.writeFileSync(path.join(outDir, '_manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`Wrote ${Object.keys(counts).length} collections to ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
