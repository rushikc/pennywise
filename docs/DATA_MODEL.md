# Expense data model (tags-v1)

This is the source of truth for expense tags after the multi-tag change. The executable spec is [`shared/tagCases.json`](../shared/tagCases.json), implemented in [`src/domain/tags.ts`](../src/domain/tags.ts) and [`functions/src/parse/tags.ts`](../functions/src/parse/tags.ts).

## Expense fields

| Field | Type | Invariant |
|---|---|---|
| `tags` | `string[]` | Source of truth. `[]` means untagged. Never `null`. Max 8 entries. |
| `tag` | `string \| null` (deprecated) | Mirror of `tags[0] ?? null`. Always write it until a later release removes it. Old clients still call `expense.tag.toLowerCase()`. |
| `description` | `string` optional | Trimmed, max 280 characters. **Omit the field** when empty; never store `""`. |
| `enrichedAt` | `number` optional | Epoch ms set by the external local enrichment process. The app only displays and preserves it. |

`costType` is typed as `'credit' | 'debit'` in the app. Prepared import data also uses `'payment'` on some rows; that is out of scope for this schema.

## Primary tag (`tags[0]`)

- Any short label is a valid primary. Trim, collapse inner whitespace, keep original casing, cap at 40 characters (`TAG_LIMITS.maxTagLength`). Firestore rules require each `tags[i]` string to be 1–40 characters. There is no membership check.
- `config/tags.tagList` is a picker and spelling hint only. Comparisons use `sameTag()`. Editors and grouping pass the lists into `normalizeTags` / `displayTag` so a listed name is stored and labelled with list spelling; an unmatched primary is kept as given.
- Ingest and migration scripts never read `config/tags` and never pass the lists, so vendor tags stay as written.
- Grouping keys on `groupKey()` (lowercased primary). The label is `displayTag()` (list spelling when listed, otherwise first-seen). Unlisted primaries are their own group, marked in the UI as `"<tag> (not in tag list)"`.
- A **legacy tag** is informational: a name retired from the picker. Saving it still succeeds. Pickers offer Untagged + `tagList`, plus current primaries labelled `(retired)` or `(not in list)`. The budget editor offers `tagList` only.

## Extra tags (`tags[1..]`)

- Free text (for example `["food", "zomato", "online food ordering"]`).
- Normalise: trim, collapse inner whitespace, lowercase, max 40 characters, drop empties, de-dupe case-insensitively against the primary and each other, preserve order, cap at 8 tags total (1 primary + 7 extras).
- Extras need a primary. `normalizeTags(primary, extras)` returns `[]` and reports dropped extras when there is no primary. It never invents a primary.

## Config: `users/{uid}/config/tags`

```json
{ "tagList": ["food", "rent"], "legacyTagList": ["alcohol", "tech"] }
```

`legacyTagList` is optional on read and defaults to `[]`. Writes must include **both** fields so a full-document set cannot drop one.

Deleting a tag in Settings moves the stored spelling to `legacyTagList` (suggestion-only; expenses keep that primary). Adding a name that is already retired restores it to `tagList`.

## VendorTag

`VendorTag.tag` is the **primary tag only** (vendor → category is 1:1). Ingest, auto-tag, and Manage Vendor Tags stay on that string.

`extraTags?: string[]` on VendorTag is a **future** extension. Do not implement it yet. Extra tags are per-expense context from the local process.

## Budgets

`Budget.tagList` matches **primary tags** only, including legacy names. `'All'` is special and includes every debit.

## Filters, charts, Insights

Grouping, dashboard tag totals, Insights, and budgets use the **primary** tag via `groupKey` / `displayTag` (and case-insensitive budget matching). Search matches vendor, cost, **any** tag, and description. Export keeps `Tag` as the display primary (or `Untagged`) and adds `Extra tags` and `Description`.

## Local enrichment process (external)

A separate local worker (not in this repo) may add extras and descriptions. Contract:

- Write path: `users/{uid}/expense/{id}` using `update()` only. Never `set()` a whole doc. Never `create()`. Never delete.
- May add or replace `tags[1..]` and `description`.
- Must **not** change `tags[0]` once it is set.
- On an untagged expense, may set `tags[0]` to any short primary; the tag list is not a membership gate.
- Must keep the `tag` mirror equal to `tags[0] ?? null`.
- Sets `enrichedAt` and `modifiedDate = Date.now()`.
- Respects the limits above.
- Uses `normalizeTags` semantics; [`shared/tagCases.json`](../shared/tagCases.json) is the executable spec.

Gmail ingest and Gemini must **not** produce extra tags or descriptions. Ingest writes `tags: [primary]` or `[]` plus the mirror.

## Deprecated `tag` mirror

Keep writing it from the app, Cloud Functions, and migrations while old cached PWA bundles and currently deployed functions still read `.tag`. Remove it in a later release, not this one.

## `updateExpense`

Persisted edits go through `ExpenseAPI.updateExpense` (Live: `runTransaction`). Re-read the doc; fail if it is gone (do not recreate). Write `tags`, `tag`, `modifiedDate`, and only the edited fields. Never write `enrichedAt`.

- Primary comes from the edit or the server. Extras = (server extras − `removeExtras`) ∪ `addExtras`, then `normalizeTags`.
- Description only when the edit includes it (`null` clears the field).
- Duplicate Review writes dupe fields only (`null` deletes the field).
- Merge updates the keep doc and soft-deletes the others with `{operation: 'delete', modifiedDate}` only.
- Create (`AddExpense`, non-persisted ids) still uses `setDoc`.
- Offline: a failed transaction surfaces the API error alert and leaves IndexedDB unchanged.

## Cache

IndexedDB is not version-bumped. On startup, if config `expenseSchemaVersion` is not `tags-v1`, the app resets `expenseLastUpdate` to 2020-01-01 so the next fetch pulls every expense once (including imported docs whose original `modifiedDate` is older than last sync). Every expense loaded from IndexedDB or Firestore goes through `readTags`.

## Migration order (you run steps 2–7)

1. Implement and test in this repo (local commits only).
2. `npm run build --prefix functions`, then  
   `node scripts/migrate/migrateTagFiles.js --in temp/new-data --out temp/new-data-v2`  
   then the same with `--apply`.
3. `npm run backup`, then  
   `node scripts/migrate/importToFirestore.js --dir temp/new-data-v2 --email <me>`  
   dry-run, then `--apply`.
4. `node scripts/migrate/migrateTagsFirestore.js --email <me>` dry-run, then `--apply`. This live rewrite is **optional**: readers already tolerate `tag` without `tags`. Imported docs already have `tags` and are skipped. Live Gmail docs without `tags` are updated. The dry-run prints a **count** of expense docs that share a `mailId` with another doc (shadow docs from the old addExpense-by-id bug). Do not delete them from the script.
5. Deploy functions, then the app.
6. Re-run the Firestore dry-run to catch docs ingested by old functions between 4 and 5. `--apply` if the count is more than 0.
7. Open the app on each device. The schema-version bump forces one full refetch. **Settings → Reload Data** also works.

Both migration scripts default to dry-run. Never pass `--apply` against live Firestore from an agent.

Rollback for the live backfill is optional. If you used `--apply`, undo with `node scripts/migrate/migrateTagsFirestore.js --rollback temp/migrations/tags-<timestamp>.json` (dry-run by default). Rollback preconditions on each doc's post-migration `writeTime` and restores `tag` / `tags` (or deletes `tags` when they were absent).
