/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {describe, it} = require('node:test');
const assert = require('node:assert/strict');
const {publicStatusDoc, connectedPrivateDoc, connectionEmailKey} = require('./connectionState');

describe('connectionState', () => {
  it('exposes no secrets on the public status doc', () => {
    const privateDoc = connectedPrivateDoc({email: 'ada@example.com', nowMs: 10});
    const status = publicStatusDoc(privateDoc);
    assert.deepEqual(Object.keys(status).sort(), ['email', 'lastError', 'status']);
    assert.equal(status.status, 'connected');
  });

  it('lowercases connection emails', () => {
    assert.equal(connectionEmailKey('Ada@Example.COM'), 'ada@example.com');
  });
});
