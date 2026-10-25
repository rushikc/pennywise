/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {describe, it} = require('node:test');
const assert = require('node:assert/strict');
const {decodePushMessage} = require('./push');

describe('decodePushMessage', () => {
  it('decodes base64 Gmail push payloads', () => {
    const payload = Buffer.from(JSON.stringify({emailAddress: 'a@b.com', historyId: 9})).toString('base64');
    const decoded = decodePushMessage({data: payload});
    assert.equal(decoded.emailAddress, 'a@b.com');
    assert.equal(decoded.historyId, '9');
  });

  it('returns null for invalid JSON without throwing', () => {
    const decoded = decodePushMessage({data: Buffer.from('{not-json').toString('base64')});
    assert.equal(decoded, null);
  });

  it('returns null when the json getter throws', () => {
    const message = {
      get json() {
        throw new Error('bad json');
      },
      data: Buffer.from(JSON.stringify({emailAddress: 'a@b.com'})).toString('base64'),
    };
    assert.equal(decodePushMessage(message), null);
  });
});
