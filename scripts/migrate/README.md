# Migration scripts

All scripts default to a dry run. `--apply` writes; never pass it against live Firestore from an agent.

| Script | What it does |
| --- | --- |
| `migrateTagFiles.js` | Rewrites exported JSON files to the `tags: string[]` shape (`--in`, `--out`). |
| `importToFirestore.js` | Creates the exported docs under `users/{uid}/` (`--dir`, `--email` or `--uid`). |
| `migrateTagsFirestore.js` | Backfills `tags` on live expense docs, with `--rollback`. |
| `migrateToUser.js` | Moves legacy root collections under `users/{uid}/`. |

## importToFirestore

- Only `create`s docs. Existing ids count as `skippedExisting`; other errors count as `failed` and set exit code 1.
- `users/{uid}/meta/profile.lastImportRunAt` is written on every run.
- `users/{uid}/meta/profile.migratedAt` is written only when it is not set yet and the run succeeded and created at least one doc. Re-runs keep the first value.
- Emulator: when `FIRESTORE_EMULATOR_HOST` is set and `FIREBASE_AUTH_EMULATOR_HOST` is not, `--uid` is required. `--email` exits 1 with a message, because resolving it would need the real project's Auth.
- The live project id comes from the repo root `.env` and is never printed.

Tests: `npm run test:migrate` (unit) and `npm run test:migrate:emulator`.
