/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {describe, it} = require('node:test');
const assert = require('node:assert/strict');
const {
  MAX_PATCH_BYTES,
  checkContentType,
  checkBodySize,
  parseJson,
  parseExpenseId,
  parseListQuery,
  parsePatchObject,
  parseBatchBody,
} = require('./schema');

const NOW = Date.UTC(2026, 5, 15);

describe('schema http helpers', () => {
  it('requires application/json', () => {
    assert.equal(checkContentType('text/plain').status, 415);
    assert.equal(checkContentType('application/json; charset=utf-8').ok, true);
  });

  it('rejects oversized bodies using rawBody length', () => {
    const raw = Buffer.alloc(MAX_PATCH_BYTES + 1);
    assert.equal(checkBodySize(raw, MAX_PATCH_BYTES).status, 413);
    assert.equal(checkBodySize(raw, MAX_PATCH_BYTES).code, 'payload_too_large');
  });

  it('rejects invalid JSON', () => {
    assert.equal(parseJson('{').status, 400);
    assert.equal(parseJson('{').code, 'invalid_json');
  });
});

describe('parseExpenseId', () => {
  it('rejects path-like and empty ids', () => {
    assert.equal(parseExpenseId('../x').code, 'invalid_id');
    assert.equal(parseExpenseId('a/b').code, 'invalid_id');
    assert.equal(parseExpenseId('').code, 'invalid_id');
    assert.equal(parseExpenseId('anchor-books').ok, true);
  });
});

describe('parseListQuery', () => {
  it('rejects unknown params', () => {
    assert.equal(parseListQuery({foo: '1'}).code, 'unknown_field');
  });

  it('defaults untagged and limit', () => {
    assert.deepEqual(parseListQuery({}).value, {untagged: false, since: undefined, limit: 50, cursor: undefined});
  });

  it('parses bounds', () => {
    assert.equal(parseListQuery({limit: '0'}).ok, false);
    assert.equal(parseListQuery({limit: '201'}).ok, false);
    assert.equal(parseListQuery({untagged: 'yes'}).ok, false);
    assert.equal(parseListQuery({since: '1.5'}).ok, false);
    assert.equal(parseListQuery({untagged: 'true', limit: '10', since: '1'}).ok, true);
  });
});

describe('parsePatchObject', () => {
  it('rejects unknown body keys', () => {
    for (const key of ['cost', 'vendor', 'date', 'mailId', 'operation', 'uid']) {
      assert.equal(parsePatchObject({[key]: 1, description: 'x'}, NOW).code, 'unknown_field');
    }
  });

  it('rejects an empty patch', () => {
    assert.equal(parsePatchObject({replace: true}, NOW).code, 'empty_patch');
    assert.equal(parsePatchObject({requestId: 'abcdefgh'}, NOW).code, 'empty_patch');
  });

  it('rejects invalid tags and long descriptions', () => {
    assert.equal(parsePatchObject({tags: ['']}, NOW).code, 'invalid_tag');
    assert.equal(parsePatchObject({tags: ['x'.repeat(41)]}, NOW).code, 'invalid_tag');
    assert.equal(parsePatchObject({tags: Array.from({length: 9}, (_, i) => `t${i}`)}, NOW).code, 'invalid_tag');
    assert.equal(parsePatchObject({description: 'x'.repeat(281)}, NOW).code, 'description_too_long');
  });

  it('requires replacePrimary to clear tags', () => {
    assert.equal(parsePatchObject({tags: []}, NOW).code, 'empty_tags');
    assert.equal(parsePatchObject({tags: [], replacePrimary: true}, NOW).ok, true);
  });

  it('validates enrichedAt range', () => {
    assert.equal(parsePatchObject({enrichedAt: Date.UTC(2014, 0, 1)}, NOW).code, 'invalid_enriched_at');
    assert.equal(parsePatchObject({enrichedAt: NOW + (6 * 60 * 1000)}, NOW).code, 'invalid_enriched_at');
    assert.equal(parsePatchObject({enrichedAt: NOW}, NOW).ok, true);
  });

  it('allows removeExtras without tags', () => {
    const parsed = parsePatchObject({removeExtras: ['old extra']}, NOW);
    assert.equal(parsed.ok, true);
    assert.deepEqual(parsed.value.removeExtras, ['old extra']);
  });
});

describe('parseBatchBody', () => {
  it('rejects more than 100 patches and duplicate ids', () => {
    const tooMany = {
      patches: Array.from({length: 101}, (_, i) => ({id: `id-${i}`, description: 'x'})),
    };
    assert.equal(parseBatchBody(tooMany, NOW).code, 'invalid_batch');
    assert.equal(parseBatchBody({
      patches: [
        {id: 'a', description: 'one'},
        {id: 'a', description: 'two'},
      ],
    }, NOW).code, 'duplicate_id');
  });
});
