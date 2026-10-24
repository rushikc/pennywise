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
});
