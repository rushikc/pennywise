/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {createHash} = require('node:crypto');

const TTL_MS = 24 * 60 * 60 * 1000;

function hashBody(body) {
  return createHash('sha256').update(JSON.stringify(body)).digest('hex');
}

function requestRef(db, uid, tokenLabel, requestId) {
  return db.doc(`users/${uid}/private/api/requests/${tokenLabel}_${requestId}`);
}

function createIdempotency({db}) {
  async function lookup({uid, tokenLabel, requestId, body}) {
    if (!requestId) {
      return {ok: true, replay: false};
    }
    const ref = requestRef(db, uid, tokenLabel, requestId);
    const snap = await ref.get();
    if (!snap.exists) {
      return {ok: true, replay: false, ref, bodyHash: hashBody(body)};
    }
    const data = snap.data() || {};
    if (data.bodyHash !== hashBody(body)) {
      return {
        ok: false,
        status: 409,
        code: 'idempotency_conflict',
        message: 'requestId was reused with a different body',
      };
    }
    return {ok: true, replay: true, status: data.status, body: data.body};
  }

  async function store(ref, {status, body, bodyHash, nowMs}) {
    if (!ref) {
      return;
    }
    await ref.set({
      status,
      body,
      bodyHash,
      createdAt: nowMs,
      expireAt: nowMs + TTL_MS,
    });
  }

  return {lookup, store, hashBody};
}

module.exports = {
  TTL_MS,
  hashBody,
  createIdempotency,
};
