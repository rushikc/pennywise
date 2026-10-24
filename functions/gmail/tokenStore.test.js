/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {describe, it} = require('node:test');
const assert = require('node:assert/strict');
const {createTokenStore} = require('./tokenStore');

describe('saveRefreshToken', () => {
  it('destroys older secret versions after adding a new one', async () => {
    const destroyed = [];
    const client = {
      async getSecret() {
        return [{}];
      },
      async addSecretVersion() {
        return [{name: 'projects/p/secrets/gmail-rt-u1/versions/3'}];
      },
      async listSecretVersions() {
        return [[
          {name: 'projects/p/secrets/gmail-rt-u1/versions/1', state: 'ENABLED'},
          {name: 'projects/p/secrets/gmail-rt-u1/versions/2', state: 'DESTROYED'},
          {name: 'projects/p/secrets/gmail-rt-u1/versions/3', state: 'ENABLED'},
        ]];
      },
      async destroySecretVersion({name}) {
        destroyed.push(name);
      },
    };
    const store = createTokenStore(client);
    await store.saveRefreshToken('p', 'u1', 'rt-new');
    assert.deepEqual(destroyed, ['projects/p/secrets/gmail-rt-u1/versions/1']);
  });
});
