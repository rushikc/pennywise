# Tags-v1 migration

Move expense documents onto `tags[]` and the `tag` mirror. This is separate from `npm run migrate`, which only copies old root collections into `users/{uid}` (`scripts/migrate/migrateToUser.js`).

Every script defaults to a dry run. `--apply` writes. Do not pass `--apply` against live Firestore from an agent.

## Step 0: backup

From the repo root:

```bash
npm run backup
```

That writes `backups/<timestamp>/`, or `$PENNYWISE_BACKUP_DIR/<timestamp>/` when `PENNYWISE_BACKUP_DIR` is set. The project id comes from `REACT_APP_FIREBASE_PROJECT_ID` in the root `.env`.

## Flags

| Script | Flags |
| --- | --- |
| `scripts/migrate/migrateTagFiles.js` | `--in <export-dir> --out <out-dir> [--apply] [--force]` |
| `scripts/migrate/importToFirestore.js` | `--dir <out-dir> --email <owner-email>` or `--uid <uid> [--apply] [--allow-legacy-shape]` |
| `scripts/migrate/migrateTagsFirestore.js` | `--email <owner-email>` or `--uid <uid> [--apply] [--rollback <file>]` |
| `scripts/migrate/migrateToUser.js` | `--from <export-dir> --uid <uid> [--apply]` |

`--force` lets `migrateTagFiles` replace an existing `--out` directory. It refuses to use the same directory for `--in` and `--out`.

`--allow-legacy-shape` lets `importToFirestore` accept files that are not yet in the tags-v1 shape. Without it, migrate those files with `migrateTagFiles` first.

## Order

1. Build the functions parsers if you have not already: `npm run build --prefix functions`.
2. Rewrite an export directory on disk:
   ```bash
   node scripts/migrate/migrateTagFiles.js --in <export-dir> --out <out-dir>
   node scripts/migrate/migrateTagFiles.js --in <export-dir> --out <out-dir> --apply
   ```
3. Import. Dry-run, then apply:
   ```bash
   node scripts/migrate/importToFirestore.js --dir <out-dir> --email <owner-email>
   node scripts/migrate/importToFirestore.js --dir <out-dir> --email <owner-email> --apply
   ```
4. Optional live backfill of Gmail docs that still have no `tags` array. Readers already tolerate `tag` without `tags`. Imported docs that already have `tags` are skipped.
   ```bash
   node scripts/migrate/migrateTagsFirestore.js --email <owner-email>
   node scripts/migrate/migrateTagsFirestore.js --email <owner-email> --apply
   ```
   The dry-run prints a count of expense docs that share a `mailId` with another doc. Do not delete those from the script.
5. Deploy functions, then the app.
6. Re-run the Firestore dry-run to catch docs ingested by old functions between steps 4 and 5. `--apply` if the count is more than 0.
7. Open the app on each device. If `expenseSchemaVersion` is not `tags-v1`, the next fetch reloads every expense. **Settings → Reload Data** does the same.

`importToFirestore` only creates docs (existing ids are skipped). It stamps `users/{uid}/meta/profile`: `lastImportRunAt` on every run, and `migratedAt` only on the first successful run that created at least one doc.

Against the emulator (`FIRESTORE_EMULATOR_HOST` set) without `FIREBASE_AUTH_EMULATOR_HOST`, pass `--uid`. `--email` exits 1 because the email cannot be resolved safely. The live project id comes from the root `.env` and is not printed.

## Rollback

`--apply` on `migrateTagsFirestore` writes a rollback file and prints its path (`temp/migrations/tags-<timestamp>.json`). Undo is a dry-run until you pass `--apply`:

```bash
node scripts/migrate/migrateTagsFirestore.js --rollback <rollback-file>
node scripts/migrate/migrateTagsFirestore.js --rollback <rollback-file> --apply
```

Rollback checks each doc's post-migration `writeTime` and restores `tag` / `tags`, or deletes `tags` when they were absent.

## Root collections

Moving `expense`, `vendorTag`, `budget`, and `config` from the old root into one user is `npm run migrate` (an alias of `migrateToUser`):

```bash
node scripts/migrate/migrateToUser.js --from <export-dir> --uid <uid>
node scripts/migrate/migrateToUser.js --from <export-dir> --uid <uid> --apply
```

Do that before the tags-v1 import if the backup still has root collections. See the upgrade checklist in [SETUP.md](../../SETUP.md).
