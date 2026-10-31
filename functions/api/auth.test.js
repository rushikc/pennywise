/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {describe, it} = require('node:test');
const assert = require('node:assert/strict');
const {createHash, timingSafeEqual} = require('node:crypto');
const {parseDigestSlot, sha256, verifyBearerToken} = require('./auth');

const TOKEN = 'a'.repeat(32);
const NEXT_TOKEN = 'b'.repeat(32);
const CURRENT_DIGEST = createHash('sha256').update(TOKEN).digest('hex');
const NEXT_DIGEST = createHash('sha256').update(NEXT_TOKEN).digest('hex');

describe('parseDigestSlot', () => {
  it('treats empty and disabled as ignored slots', () => {
    assert.equal(parseDigestSlot('').kind, 'disabled');
    assert.equal(parseDigestSlot('disabled').kind, 'disabled');
    assert.equal(parseDigestSlot(null).kind, 'disabled');
    assert.equal(parseDigestSlot('  disabled  ').kind, 'disabled');
  });

  it('rejects values that are not 64 hex chars', () => {
    assert.equal(parseDigestSlot('not-a-digest').kind, 'malformed');
    assert.equal(parseDigestSlot(CURRENT_DIGEST.slice(0, 63)).kind, 'malformed');
  });

  it('parses a 64-hex digest to a 32-byte buffer', () => {
    const slot = parseDigestSlot(CURRENT_DIGEST.toUpperCase());
    assert.equal(slot.kind, 'digest');
    assert.equal(slot.buffer.length, 32);
    assert.equal(slot.buffer.equals(Buffer.from(CURRENT_DIGEST, 'hex')), true);
  });
});

describe('verifyBearerToken', () => {
  const secrets = {current: CURRENT_DIGEST, next: NEXT_DIGEST};

  it('returns missing_token when the header is absent', () => {
    const result = verifyBearerToken(undefined, secrets);
    assert.equal(result.status, 401);
    assert.equal(result.code, 'missing_token');
  });

  it('returns invalid_token for a non-Bearer scheme', () => {
    const result = verifyBearerToken(`Basic ${TOKEN}`, secrets);
    assert.equal(result.status, 401);
    assert.equal(result.code, 'invalid_token');
  });

  it('returns invalid_token for an empty Bearer token', () => {
    const result = verifyBearerToken('Bearer ', secrets);
    assert.equal(result.status, 401);
    assert.equal(result.code, 'invalid_token');
  });

  it('returns invalid_token for a wrong token', () => {
    const result = verifyBearerToken(`Bearer ${'c'.repeat(32)}`, secrets);
    assert.equal(result.status, 401);
    assert.equal(result.code, 'invalid_token');
  });

  it('matches the current slot', () => {
    const result = verifyBearerToken(`Bearer ${TOKEN}`, secrets);
    assert.equal(result.ok, true);
    assert.equal(result.tokenLabel, 'current');
  });

  it('matches the next slot during rotation', () => {
    const result = verifyBearerToken(`Bearer ${NEXT_TOKEN}`, secrets);
    assert.equal(result.ok, true);
    assert.equal(result.tokenLabel, 'next');
  });

  it('ignores a next slot set to disabled', () => {
    const result = verifyBearerToken(`Bearer ${NEXT_TOKEN}`, {current: CURRENT_DIGEST, next: 'disabled'});
    assert.equal(result.ok, false);
    assert.equal(result.code, 'invalid_token');
  });

  it('returns 500 when a configured digest is malformed', () => {
    const result = verifyBearerToken(`Bearer ${TOKEN}`, {current: 'zzzz', next: 'disabled'});
    assert.equal(result.status, 500);
    assert.equal(result.code, 'server_misconfigured');
  });

  it('compares every configured slot with 32-byte buffers', () => {
    const calls = [];
    const compare = (left, right) => {
      calls.push({leftLen: left.length, rightLen: right.length});
      return timingSafeEqual(left, right);
    };
    verifyBearerToken(`Bearer ${TOKEN}`, secrets, compare);
    assert.equal(calls.length, 2);
    for (const call of calls) {
      assert.equal(call.leftLen, 32);
      assert.equal(call.rightLen, 32);
    }
  });

  it('still hashes and compares a short token, then rejects it', () => {
    const calls = [];
    const compare = (left, right) => {
      calls.push(left);
      return timingSafeEqual(left, right);
    };
    const short = 'short-token';
    const secrets = {current: sha256(short).toString('hex'), next: 'disabled'};
    const result = verifyBearerToken(`Bearer ${short}`, secrets, compare);
    assert.equal(result.code, 'invalid_token');
    assert.equal(calls.length, 1);
    assert.equal(calls[0].length, 32);
  });

  it('prefers current when both slots would match', () => {
    const result = verifyBearerToken(`Bearer ${TOKEN}`, {current: CURRENT_DIGEST, next: CURRENT_DIGEST});
    assert.equal(result.tokenLabel, 'current');
  });
});
