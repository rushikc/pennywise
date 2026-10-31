/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {TAG_LIMITS} = require('../lib/parse');

const LIST_PARAMS = new Set(['untagged', 'since', 'limit', 'cursor']);
const PATCH_FIELDS = new Set([
  'tags', 'replace', 'removeExtras', 'replacePrimary', 'description', 'enrichedAt', 'requestId',
]);
const BATCH_FIELDS = new Set(['requestId', 'patches']);
const ID_RE = /^[A-Za-z0-9_-]{1,128}$/;
const REQUEST_ID_RE = /^[A-Za-z0-9_-]{8,64}$/;
const MAX_PATCH_BYTES = 16 * 1024;
const MAX_BATCH_BYTES = 256 * 1024;
const MIN_ENRICHED_AT = Date.UTC(2015, 0, 1);
const FUTURE_SLACK_MS = 5 * 60 * 1000;
const DEFAULT_LIMIT = 50;
const MIN_LIMIT = 1;
const MAX_LIMIT = 200;
const MAX_BATCH = 100;

function fail(status, code, message) {
  return {ok: false, status, code, message};
}

function ok(value) {
  return {ok: true, value};
}

function checkContentType(contentType) {
  const raw = String(contentType || '').split(';')[0].trim();
  if (raw.toLowerCase() !== 'application/json') {
    return fail(415, 'unsupported_media_type', 'Content-Type must be application/json');
  }
  return {ok: true};
}

function bodyLength(rawBody) {
  if (Buffer.isBuffer(rawBody)) {
    return rawBody.length;
  }
  if (rawBody == null) {
    return 0;
  }
  return Buffer.byteLength(String(rawBody));
}

function checkBodySize(rawBody, maxBytes) {
  if (bodyLength(rawBody) > maxBytes) {
    return fail(413, 'payload_too_large', 'Payload is too large');
  }
  return {ok: true};
}

function parseJson(rawBody) {
  try {
    const text = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody || '');
    if (!text.trim()) {
      return fail(400, 'invalid_json', 'Invalid JSON');
    }
    return ok(JSON.parse(text));
  } catch {
    return fail(400, 'invalid_json', 'Invalid JSON');
  }
}

function unknownKeys(object, allowed) {
  return Object.keys(object).filter((key) => !allowed.has(key));
}

function parseExpenseId(id) {
  if (typeof id !== 'string' || !ID_RE.test(id)) {
    return fail(422, 'invalid_id', 'Invalid expense id');
  }
  return ok(id);
}

function parseRequestId(value, {optional} = {optional: true}) {
  if (value == null) {
    if (optional) {
      return ok(undefined);
    }
    return fail(422, 'invalid_request_id', 'Invalid request id');
  }
  if (typeof value !== 'string' || !REQUEST_ID_RE.test(value)) {
    return fail(422, 'invalid_request_id', 'Invalid request id');
  }
  return ok(value);
}

function parseTagList(tags) {
  if (!Array.isArray(tags)) {
    return fail(422, 'invalid_tag', 'tags must be an array of strings');
  }
  if (tags.length > TAG_LIMITS.maxTags) {
    return fail(422, 'invalid_tag', 'tags may have at most 8 entries');
  }
  const trimmed = [];
  for (const tag of tags) {
    if (typeof tag !== 'string') {
      return fail(422, 'invalid_tag', 'Each tag must be a string');
    }
    const value = tag.trim();
    if (!value || value.length > TAG_LIMITS.maxTagLength) {
      return fail(422, 'invalid_tag', 'Each tag must be 1 to 40 characters');
    }
    trimmed.push(value);
  }
  return ok(trimmed);
}

function parseRemoveExtras(value) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    return fail(422, 'invalid_tag', 'removeExtras must be an array of strings');
  }
  return ok(value);
}

function parseDescription(value) {
  if (value === null) {
    return ok(null);
  }
  if (typeof value !== 'string') {
    return fail(422, 'invalid_description', 'description must be a string or null');
  }
  const trimmed = value.trim();
  if (trimmed.length > TAG_LIMITS.maxDescription) {
    return fail(422, 'description_too_long', 'description must be at most 280 characters');
  }
  return ok(value);
}

function parseEnrichedAt(value, nowMs) {
  if (!Number.isInteger(value)) {
    return fail(422, 'invalid_enriched_at', 'enrichedAt must be an epoch millisecond integer');
  }
  if (value < MIN_ENRICHED_AT || value > nowMs + FUTURE_SLACK_MS) {
    return fail(422, 'invalid_enriched_at', 'enrichedAt is out of range');
  }
  return ok(value);
}

function parseBooleanField(value, name) {
  if (value === undefined) {
    return ok(false);
  }
  if (typeof value !== 'boolean') {
    return fail(422, 'invalid_field', `${name} must be a boolean`);
  }
  return ok(value);
}

function parsePatchObject(body, nowMs, {requireId} = {requireId: false}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return fail(422, 'invalid_json', 'Patch body must be an object');
  }
  const extra = unknownKeys(body, requireId ? new Set([...PATCH_FIELDS, 'id']) : PATCH_FIELDS);
  if (extra.length) {
    return fail(422, 'unknown_field', `Unknown field: ${extra[0]}`);
  }

  let id;
  if (requireId) {
    const parsedId = parseExpenseId(body.id);
    if (!parsedId.ok) {
      return parsedId;
    }
    id = parsedId.value;
  }

  const requestId = parseRequestId(body.requestId);
  if (!requestId.ok) {
    return requestId;
  }

  const replace = parseBooleanField(body.replace, 'replace');
  if (!replace.ok) {
    return replace;
  }
  const replacePrimary = parseBooleanField(body.replacePrimary, 'replacePrimary');
  if (!replacePrimary.ok) {
    return replacePrimary;
  }

  let tags;
  if (Object.prototype.hasOwnProperty.call(body, 'tags')) {
    const parsed = parseTagList(body.tags);
    if (!parsed.ok) {
      return parsed;
    }
    tags = parsed.value;
    if (tags.length === 0 && !replacePrimary.value) {
      return fail(422, 'empty_tags', 'tags: [] requires replacePrimary');
    }
  }

  let removeExtras;
  if (Object.prototype.hasOwnProperty.call(body, 'removeExtras')) {
    const parsed = parseRemoveExtras(body.removeExtras);
    if (!parsed.ok) {
      return parsed;
    }
    removeExtras = parsed.value;
  }

  let description;
  if (Object.prototype.hasOwnProperty.call(body, 'description')) {
    const parsed = parseDescription(body.description);
    if (!parsed.ok) {
      return parsed;
    }
    description = parsed.value;
  }

  let enrichedAt;
  if (Object.prototype.hasOwnProperty.call(body, 'enrichedAt')) {
    const parsed = parseEnrichedAt(body.enrichedAt, nowMs);
    if (!parsed.ok) {
      return parsed;
    }
    enrichedAt = parsed.value;
  }

  const hasChange = tags !== undefined ||
    removeExtras !== undefined ||
    description !== undefined ||
    enrichedAt !== undefined;
  if (!hasChange) {
    return fail(422, 'empty_patch', 'Patch has no fields to apply');
  }

  return ok({
    id,
    tags,
    replace: replace.value,
    removeExtras,
    replacePrimary: replacePrimary.value,
    description,
    enrichedAt,
    requestId: requestId.value,
  });
}

function parseListQuery(query) {
  const params = query || {};
  const extra = unknownKeys(params, LIST_PARAMS);
  if (extra.length) {
    return fail(422, 'unknown_field', `Unknown query parameter: ${extra[0]}`);
  }

  let untagged = false;
  if (params.untagged !== undefined) {
    if (params.untagged !== 'true' && params.untagged !== 'false') {
      return fail(422, 'invalid_field', 'untagged must be true or false');
    }
    untagged = params.untagged === 'true';
  }

  let since;
  if (params.since !== undefined) {
    const value = Number(params.since);
    if (!Number.isInteger(value) || String(value) !== String(params.since) || value < 0) {
      return fail(422, 'invalid_field', 'since must be an epoch millisecond integer');
    }
    since = value;
  }

  let limit = DEFAULT_LIMIT;
  if (params.limit !== undefined) {
    const value = Number(params.limit);
    if (!Number.isInteger(value) || String(value) !== String(params.limit) ||
      value < MIN_LIMIT || value > MAX_LIMIT) {
      return fail(422, 'invalid_field', 'limit must be an integer from 1 to 200');
    }
    limit = value;
  }

  let cursor;
  if (params.cursor !== undefined) {
    if (typeof params.cursor !== 'string' || !params.cursor) {
      return fail(422, 'invalid_cursor', 'cursor is invalid');
    }
    cursor = params.cursor;
  }

  return ok({untagged, since, limit, cursor});
}

function parseBatchBody(body, nowMs) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return fail(422, 'invalid_json', 'Batch body must be an object');
  }
  const extra = unknownKeys(body, BATCH_FIELDS);
  if (extra.length) {
    return fail(422, 'unknown_field', `Unknown field: ${extra[0]}`);
  }
  const requestId = parseRequestId(body.requestId);
  if (!requestId.ok) {
    return requestId;
  }
  if (!Array.isArray(body.patches) || body.patches.length < 1 || body.patches.length > MAX_BATCH) {
    return fail(422, 'invalid_batch', 'patches must contain 1 to 100 items');
  }
  const seen = new Set();
  const patches = [];
  for (const item of body.patches) {
    const parsed = parsePatchObject(item, nowMs, {requireId: true});
    if (!parsed.ok) {
      return parsed;
    }
    if (seen.has(parsed.value.id)) {
      return fail(422, 'duplicate_id', 'Duplicate expense id in batch');
    }
    seen.add(parsed.value.id);
    patches.push(parsed.value);
  }
  return ok({requestId: requestId.value, patches});
}

module.exports = {
  MAX_PATCH_BYTES,
  MAX_BATCH_BYTES,
  checkContentType,
  checkBodySize,
  parseJson,
  parseExpenseId,
  parseListQuery,
  parsePatchObject,
  parseBatchBody,
  parseRequestId,
};
