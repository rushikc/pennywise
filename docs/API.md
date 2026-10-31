# Pennywise API

Server-to-server HTTPS API for the local enrichment process (and the assistant). It lists expenses for one configured owner and writes **tags, description, and enrichedAt** through the Admin SDK. Firestore rules stay owner + `allowedUsers` only. The bearer token never goes in rules, documents, the repo, or logs.

Base URL:

```text
https://<REGION>-<PROJECT_ID>.cloudfunctions.net/pennywiseApi
```

Function: `pennywiseApi` (2nd gen `onRequest`, Node 22, region from `shared/gcpNames.json`). `invoker` is `public` so callers can use a bearer token instead of a Google identity token. CORS is off. Browser `Origin` headers are rejected.

## Auth

Header: `Authorization: Bearer <YOUR_TOKEN>`.

Secret Manager ids (from `shared/gcpNames.json`, bound with `defineSecret` using the same kebab-case names):

- `pennywise-api-token` (`apiTokenSecretId`) — current slot
- `pennywise-api-token-next` (`apiTokenNextSecretId`) — rotation slot

Each secret stores the **hex SHA-256 digest of the token**, never the token. A slot whose value is empty or the literal `disabled` is ignored. Verification hashes the bearer token and compares with `crypto.timingSafeEqual` against every configured digest.

Missing header → `401 missing_token`. Wrong token → `401 invalid_token`. Both send `WWW-Authenticate: Bearer`.

Owner uid comes only from `PENNYWISE_API_OWNER_EMAIL` (functions param), `allowedUsers/{email}`, and Auth (`emailVerified`, not disabled). The request cannot choose the uid.

Put `<YOUR_TOKEN>` and the base URL in the Grok Bot secret store when asked through a secure form. Never paste the token into chat, code, or commits.

## Setup and rotation

Terraform creates the secret shells and grants the functions service account accessor. Adding a version (after `terraform apply` if you manage infra that way):

```sh
# generate a token (keep it; it is shown only once)
TOKEN="$(openssl rand -base64 32 | tr '+/' '-_' | tr -d '=')"
# store only its SHA-256 digest
printf %s "$TOKEN" | shasum -a 256 | cut -d' ' -f1 | firebase functions:secrets:set pennywise-api-token --data-file=-
printf %s disabled | firebase functions:secrets:set pennywise-api-token-next --data-file=-
```

Put `PENNYWISE_API_OWNER_EMAIL=<my email>` in `functions/.env` (gitignored) before deploy.

Rotation: set the new digest in `pennywise-api-token-next` → redeploy `pennywiseApi` → switch clients to the new token → move the new digest to `pennywise-api-token` → set `next` to `disabled` → redeploy. Revocation: set the slot to `disabled` and redeploy.

`untagged=true` uses a composite index (`tags` + `modifiedDate` on collection `expense`). Deploy it before using that filter live:

```sh
firebase deploy --only firestore:indexes
firebase deploy --only functions:pennywiseApi
```

Post-migration every expense has a `tags` field. The list path still filters with `readTags` in memory.

## Routes

All responses are `application/json; charset=utf-8` with `Cache-Control: no-store` and `X-Content-Type-Options: nosniff`. Errors are `{"error":{"code":"<snake_case>","message":"<short>"}}` plus `requestId` when the client sent one.

| Method + path | Auth | Purpose |
|---|---|---|
| `GET /health` | none | `{"ok": true}` only |
| `GET /expenses` | token | List expenses for enrichment |
| `PATCH /expense/:id` | token | Patch one expense |
| `POST /expenses:batchUpdate` | token | Up to 100 patches, per-item results |
| `GET /vendorTags` | token | Read-only vendor → tag rules |
| `GET /config/tags` | token | Read-only `{tagList, legacyTagList}` |

Unknown route → `404 not_found`. Wrong method → `405 method_not_allowed` with `Allow`. `OPTIONS` → `405`. `Origin` → `403 browser_origin_not_allowed`. `x-forwarded-proto: http` → `403 https_required`.

### GET /health

```sh
curl -s <BASE_URL>/health
# {"ok":true}
```

### GET /expenses

Query (unknown params → `422`):

- `untagged=true|false` (default `false`) — empty `readTags`
- `since=<epoch ms>` — `modifiedDate >= since`
- `limit` 1..200, default 50
- `cursor` opaque base64url `{m, id}`, order `modifiedDate` asc then document id asc

Soft-deleted docs (`operation === 'delete'`) are omitted. Each item has only `id, vendor, cost, costType, date, tags, description, enrichedAt, modifiedDate` (missing optionals are `null`). Never `mailId`, `user`, dupe fields, mail bodies, or `private/`.

```sh
curl -s -H "Authorization: Bearer <YOUR_TOKEN>" \
  "<BASE_URL>/expenses?untagged=true&limit=5"
```

Response: `{"items":[...],"nextCursor":"..."|null}`.

### PATCH /expense/:id

`Content-Type: application/json` required (`415`). Body > 16 KB → `413`. Unknown keys → `422 unknown_field`. Empty patch → `422 empty_patch`. Id must match `/^[A-Za-z0-9_-]{1,128}$/`.

```json
{
  "tags": ["Food", "zomato", "online food ordering"],
  "replace": false,
  "removeExtras": ["old extra"],
  "replacePrimary": false,
  "description": "Dinner with team",
  "enrichedAt": 1793473680627,
  "requestId": "optional-client-id"
}
```

One Firestore transaction: re-read, then `update` only changed fields. Missing → `404 expense_not_found`. Soft-deleted → `409 expense_deleted`. Never create.

Merge:

- Primary is `tags[0]`. Untagged docs take it. A matching primary keeps **server spelling**. A different primary is `409 primary_conflict` unless `replacePrimary: true` (explicit opt-in; the local process must not change a set primary by default).
- Extras: `replace: true` → exactly `tags.slice(1)`; default → (server extras − `removeExtras`) ∪ `tags.slice(1)`, server order first.
- `normalizeTags` uses `config/tags` in the same transaction. Unlisted tags are allowed.
- Overflow beyond 8 is returned in `dropped`, not an error.
- `tags: []` clears tags only with `replacePrimary: true`. Extras without a primary → `422 extras_need_primary`.
- Always write `tags` and `tag = tags[0] ?? null` when tags change.
- `removeExtras` without `tags` is allowed.
- `description`: trimmed, max 280 (`422 description_too_long`, no silent truncate). `""` or `null` deletes the field.
- `enrichedAt`: epoch ms integer, not before 2015, not more than 5 minutes in the future. If omitted when tags or description change, the server sets `now()`.
- Always `modifiedDate = now()`.
- Never writes `cost`, `vendor`, `date`, `mailId`, `costType`, `type`, `user`, `operation`, or dupe fields.

```sh
curl -s -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Content-Type: application/json" \
  -X PATCH "<BASE_URL>/expense/<id>" \
  -d '{"description":"Dinner with team"}'
```

Response `200`: `{"id","tags","description","enrichedAt","modifiedDate","dropped":[]}`.

### POST /expenses:batchUpdate

Body `{"requestId"?: string, "patches":[{"id":"...","...same patch fields..."}]}`. 1..100 patches, body ≤ 256 KB, duplicate ids → `422 duplicate_id`. Each patch is its own transaction (partial success). A batch counts as one rate-limit request.

Response `200`: `{"results":[{"id","status":200|404|409|422,"error"?,"tags"?,"..."}],"ok":n,"failed":m}`.

### GET /vendorTags and GET /config/tags

```sh
curl -s -H "Authorization: Bearer <YOUR_TOKEN>" <BASE_URL>/vendorTags
curl -s -H "Authorization: Bearer <YOUR_TOKEN>" <BASE_URL>/config/tags
```

Vendor items: `{id, vendor, tag}` only. Config: `{tagList, legacyTagList}` (default `[]`).

## Idempotency

Optional `requestId` (`/^[A-Za-z0-9_-]{8,64}$/`) on PATCH and batch. Stored at `users/{uid}/private/api/requests/{tokenLabel}_{requestId}` for 24 hours (`expireAt` for an optional TTL policy). Same body replays with `Idempotent-Replay: true`. A different body hash → `409 idempotency_conflict`. Client rules deny `private/**`.

## Rate limit

60 requests/minute per token label (`current` / `next`) at `users/{uid}/private/api/rateLimits/{tokenLabel}_{minuteBucket}`. Over the limit → `429 rate_limited` with `Retry-After`. `/health` is not limited. `maxInstances: 2` is a second cost cap.

## Logging

One structured log line per call: `{route, method, status, tokenLabel, items, ok, failed, durationMs, requestIdPresent}`. Never the token, digest, owner email, uid, vendor names, descriptions, tags, or bodies.

## Error codes

| Status | Code |
|---|---|
| 400 | `invalid_json` |
| 401 | `missing_token`, `invalid_token` |
| 403 | `browser_origin_not_allowed`, `https_required` |
| 404 | `not_found`, `expense_not_found` |
| 405 | `method_not_allowed` |
| 409 | `primary_conflict`, `expense_deleted`, `idempotency_conflict` |
| 413 | `payload_too_large` |
| 415 | `unsupported_media_type` |
| 422 | `unknown_field`, `empty_patch`, `invalid_id`, `invalid_tag`, `invalid_cursor`, `invalid_field`, `invalid_request_id`, `invalid_batch`, `duplicate_id`, `description_too_long`, `invalid_enriched_at`, `empty_tags`, `extras_need_primary` |
| 429 | `rate_limited` |
| 500 | `server_misconfigured` |
| 503 | `owner_unavailable` |

## Security notes

- Token lives only in Secret Manager as a digest. `invoker: public` plus bearer auth.
- No CORS. Server-to-server only.
- Firestore rules are unchanged; Admin SDK writes. Clients cannot read `users/{uid}/private/api/**`.
