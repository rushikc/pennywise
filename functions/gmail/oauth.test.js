/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {describe, it} = require('node:test');
const assert = require('node:assert/strict');
const {exchangeAuthorizationCode, fetchGmailEmail, revokeToken} = require('./oauth');

describe('exchangeAuthorizationCode', () => {
  it('exchanges a code with offline redirect_uri and returns a refresh token', async () => {
    const calls = [];
    const fetchImpl = async (url, options) => {
      calls.push({url, options});
      return {
        ok: true,
        json: async () => ({
          refresh_token: 'rt-1',
          access_token: 'at-1',
          scope: 'https://www.googleapis.com/auth/gmail.readonly',
        }),
      };
    };
    const tokens = await exchangeAuthorizationCode({
      code: 'auth-code',
      clientId: 'id',
      clientSecret: 'secret',
      fetchImpl,
    });
    assert.equal(tokens.refreshToken, 'rt-1');
    const body = String(calls[0].options.body);
    assert.match(body, /grant_type=authorization_code/);
    assert.match(body, /redirect_uri=postmessage/);
    assert.doesNotMatch(JSON.stringify(tokens), /auth-code/);
  });

  it('fails when Google omits a refresh token', async () => {
    const fetchImpl = async () => ({
      ok: true,
      json: async () => ({access_token: 'at-1', scope: 'https://www.googleapis.com/auth/gmail.readonly'}),
    });
    await assert.rejects(
      () => exchangeAuthorizationCode({code: 'x', clientId: 'id', clientSecret: 's', fetchImpl}),
      /oauth_exchange_failed/,
    );
  });
});

describe('fetchGmailEmail', () => {
  it('reads emailAddress from Gmail users.me.profile', async () => {
    const fetchImpl = async (url) => {
      assert.match(String(url), /gmail\.googleapis\.com\/gmail\/v1\/users\/me\/profile/);
      return {ok: true, json: async () => ({emailAddress: 'ada@example.com'})};
    };
    assert.equal(await fetchGmailEmail('at', fetchImpl), 'ada@example.com');
  });
});

describe('revokeToken', () => {
  it('posts the token to Google revoke without throwing on empty input', async () => {
    let called = false;
    await revokeToken(null, async () => {
      called = true;
    });
    assert.equal(called, false);
    await revokeToken('rt', async () => ({ok: true}));
  });
});
