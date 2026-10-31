/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {describe, it} = require('node:test');
const assert = require('node:assert/strict');
const {createHash} = require('node:crypto');
const {createApiLogger} = require('./log');

const TOKEN = 'unit-api-token-0123456789abcdef0123456789abcdef';
const DIGEST = createHash('sha256').update(TOKEN).digest('hex');
const EMAIL = 'owner@example.com';
const DESCRIPTION = 'Dinner with team';

describe('createApiLogger', () => {
  it('does not log the token, digest, email, or description', () => {
    const lines = [];
    const logger = createApiLogger({
      info(entry) {
        lines.push(JSON.stringify(entry));
      },
    });
    logger.call({
      route: '/expense/anchor-books',
      method: 'PATCH',
      status: 200,
      tokenLabel: 'current',
      items: 1,
      durationMs: 4,
      requestIdPresent: true,
    });
    const joined = lines.join('\n');
    assert.equal(joined.includes(TOKEN), false);
    assert.equal(joined.includes(DIGEST), false);
    assert.equal(joined.includes(EMAIL), false);
    assert.equal(joined.includes(DESCRIPTION), false);
    const parsed = JSON.parse(lines[0]);
    assert.equal(parsed.tokenLabel, 'current');
    assert.equal(parsed.route, '/expense/anchor-books');
    assert.equal(parsed.requestIdPresent, true);
  });
});
