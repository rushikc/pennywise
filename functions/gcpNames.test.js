/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {describe, it} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
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

  it('matches the generated copy under functions/shared', () => {
    const copy = JSON.parse(fs.readFileSync(path.join(__dirname, 'shared', 'gcpNames.json'), 'utf8'));
    const source = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'shared', 'gcpNames.json'), 'utf8'));
    assert.deepEqual(copy, source);
  });

  it('builds the functions service account email', () => {
    assert.equal(
      functionsServiceAccountEmail('my-project'),
      'pennywise-functions@my-project.iam.gserviceaccount.com',
    );
  });
});
