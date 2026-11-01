/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {describe, it} = require('node:test');
const assert = require('node:assert/strict');
const {refreshAccessToken} = require('./gmailClient');

describe('refreshAccessToken', () => {
  it('returns the access token from a successful refresh', async () => {
    const token = await refreshAccessToken({
      refreshToken: 'rt-1',
      clientId: 'id',
      clientSecret: 'secret',
      fetchImpl: async () => ({ok: true, json: async () => ({access_token: 'at-1'})}),
    });
    assert.equal(token, 'at-1');
  });

  it('marks invalid_grant when Google rejects the refresh token', async () => {
    await assert.rejects(
      () => refreshAccessToken({
        refreshToken: 'rt-revoked',
        clientId: 'id',
        clientSecret: 'secret',
        fetchImpl: async () => ({ok: false, json: async () => ({error: 'invalid_grant'})}),
      }),
      (err) => err.code === 'invalid_grant',
    );
  });
});
