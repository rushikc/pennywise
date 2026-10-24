/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {describe, it} = require('node:test');
const assert = require('node:assert/strict');
const {runBackfillPage} = require('./ingest');

describe('runBackfillPage', () => {
  it('stores the next page token so a later run can resume', async () => {
    const docs = new Map();
    const db = {
      docs,
      doc(path) {
        return {
          async set(data, options) {
            const current = docs.get(path) || {};
            docs.set(path, options && options.merge ? {...current, ...data} : data);
          },
        };
      },
    };
    const fetchImpl = async (url) => {
      if (String(url).includes('/messages?')) {
        return {ok: true, json: async () => ({messages: [], nextPageToken: 'page-2'})};
      }
      return {ok: true, json: async () => ({})};
    };
    const result = await runBackfillPage({
      db,
      uid: 'u1',
      cursor: {backfillAfterMs: 1, backfillPageToken: null},
      accessToken: 'at',
      banks: [{matchStrings: ['HDFC Bank']}],
      vendorTags: [],
      geminiKey: '',
      fetchImpl,
      nowMs: 10,
      messageCap: 50,
    });
    assert.equal(result.ran, true);
    assert.equal(docs.get('users/u1/private/gmail').backfillPageToken, 'page-2');
    assert.equal(docs.get('users/u1/private/gmail').backfillDone, false);
  });
});
