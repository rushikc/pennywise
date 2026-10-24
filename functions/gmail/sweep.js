/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {createHash} = require('node:crypto');
const {refreshAccessToken} = require('./gmailClient');
const {processConnectedUser} = require('./ingest');
const {startGmailWatch} = require('./watch');
const {writeDisconnectedState} = require('./connectionState');
const {readCursor} = require('./cursor');

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

function uidHash(uid) {
  return createHash('sha256').update(String(uid)).digest('hex').slice(0, 12);
}

function watchNeedsRenewal(watchExpiration, nowMs) {
  if (watchExpiration == null || watchExpiration === '') {
    return true;
  }
  return Number(watchExpiration) - nowMs < TWO_DAYS_MS;
}

async function listConnectedUsers(db) {
  const snap = await db.collection('gmailConnections').where('status', '==', 'connected').get();
  const users = [];
  snap.forEach((doc) => {
    const data = doc.data() || {};
    if (data.uid) {
      users.push({email: doc.id, uid: data.uid});
    }
  });
  return users;
}

async function sweepOneUser({
  db,
  tokenStore,
  projectId,
  clientId,
  clientSecret,
  geminiKey,
  uid,
  email: _email,
  fetchImpl,
  nowMs,
}) {
  const started = Date.now();
  const refreshToken = await tokenStore.readRefreshToken(projectId, uid);
  const accessToken = await refreshAccessToken({
    refreshToken,
    clientId,
    clientSecret,
    fetchImpl,
  });
  const cursor = await readCursor(db, uid);
  if (watchNeedsRenewal(cursor && cursor.watchExpiration, nowMs)) {
    const watch = await startGmailWatch({accessToken, projectId, fetchImpl});
    await db.doc(`users/${uid}/private/gmail`).set(watch, {merge: true});
  }
  const result = await processConnectedUser({
    db,
    uid,
    accessToken,
    geminiKey,
    fetchImpl,
    nowMs,
  });
  console.log(JSON.stringify({
    event: 'gmail_sweep_user',
    uidHash: uidHash(uid),
    processed: result.processed,
    created: result.created,
    durationMs: Date.now() - started,
  }));
  return result;
}

async function runHourlySweep({
  db,
  tokenStore,
  projectId,
  clientId,
  clientSecret,
  geminiKey,
  fetchImpl,
  nowMs = Date.now(),
}) {
  const users = await listConnectedUsers(db);
  const summary = {users: users.length, ok: 0, disconnected: 0, failed: 0};
  for (const user of users) {
    try {
      await sweepOneUser({
        db,
        tokenStore,
        projectId,
        clientId,
        clientSecret,
        geminiKey,
        uid: user.uid,
        email: user.email,
        fetchImpl,
        nowMs,
      });
      summary.ok += 1;
    } catch (error) {
      if (error.code === 'invalid_grant') {
        await writeDisconnectedState(db, {
          uid: user.uid,
          email: user.email,
          lastError: 'invalid_grant',
          nowMs,
        });
        summary.disconnected += 1;
        console.log(JSON.stringify({
          event: 'gmail_sweep_invalid_grant',
          uidHash: uidHash(user.uid),
        }));
        continue;
      }
      summary.failed += 1;
      console.log(JSON.stringify({
        event: 'gmail_sweep_error',
        uidHash: uidHash(user.uid),
        code: error.code || 'unknown',
      }));
    }
  }
  console.log(JSON.stringify({event: 'gmail_sweep_done', ...summary}));
  return summary;
}

module.exports = {
  TWO_DAYS_MS,
  watchNeedsRenewal,
  runHourlySweep,
  listConnectedUsers,
};
