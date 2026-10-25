# Firestore export

Read-only export of every top-level Firestore collection to JSON. The Firebase project ID comes from `REACT_APP_FIREBASE_PROJECT_ID` in the repo root `.env`. Credentials come from your gcloud login, not from a key file.

## Setup

1. From the repo root, install dependencies: `npm install`
2. Install the Google Cloud SDK if `gcloud` is not already on your PATH:

```bash
brew install --cask gcloud-cli
```

3. Once, sign in with an account that can read Firestore:

```bash
gcloud auth application-default login
```

## Run

From the repo root, or from any other directory:

```bash
node scripts/export/export-data/exportFirestore.js
```

## Output

Each run creates a new folder under the repo `temp` directory:

```text
temp/export-data-<timestamp>/
  _manifest.json
  <collection>.json
```

The timestamp looks like `2026-10-12T00-52-10`. `_manifest.json` records the project ID, export time, and document count for each collection. Each collection file is an array of documents, with the Firestore document id in `id`. Timestamps are ISO strings.

`temp/` is gitignored. This export does not include subcollections.

> **Per-user data layout:** Pennywise now stores each user's expenses, vendor tags, budgets, and config under `users/{uid}/...` subcollections, so this script no longer captures that data. For a complete backup (including subcollections), use `npm run backup` from the repo root (`scripts/backup/backupFirestore.js`), which writes to `backups/<timestamp>/` (or `PENNYWISE_BACKUP_DIR`). This script is still useful for exports of an old, pre-migration database with root collections.
