/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {describe, it} = require('node:test');
const assert = require('node:assert/strict');
const {loadGcpNames, functionsServiceAccountEmail} = require('./gcpNames');

describe('gcpNames', () => {
  it('loads shared topic and secret names', () => {
    const names = loadGcpNames();
    assert.equal(names.pubsubTopic, 'gmail-push');
    assert.equal(names.functionsServiceAccountId, 'pennywise-functions');
    assert.equal(names.gmailRefreshTokenPrefix, 'gmail-rt-');
    assert.equal(names.gmailReadonlyScope, 'https://www.googleapis.com/auth/gmail.readonly');
    assert.equal(names.apiTokenSecretId, 'pennywise-api-token');
    assert.equal(names.apiTokenNextSecretId, 'pennywise-api-token-next');
  });

  it('builds the functions service account email', () => {
    assert.equal(
      functionsServiceAccountEmail('my-project'),
      'pennywise-functions@my-project.iam.gserviceaccount.com',
    );
  });
});
