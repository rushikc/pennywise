/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {connectionEmailKey} = require('./connectionState');
const {refreshAccessToken} = require('./gmailClient');
const {processConnectedUser} = require('./ingest');
const {createHash} = require('node:crypto');

function decodePushMessage(message) {
  if (!message) {
    return null;
  }
  if (message.json && message.json.emailAddress) {
    return {
      emailAddress: String(message.json.emailAddress),
      historyId: message.json.historyId != null ? String(message.json.historyId) : null,
    };
  }
  if (!message.data) {
    return null;
  }
  const raw = Buffer.from(message.data, 'base64').toString('utf8');
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.log(JSON.stringify({event: 'gmail_push_bad_payload'}));
    return null;
  }
  return {
    emailAddress: String(parsed.emailAddress || ''),
    historyId: parsed.historyId != null ? String(parsed.historyId) : null,
  };
}

function uidHash(uid) {
  return createHash('sha256').update(String(uid)).digest('hex').slice(0, 12);
}

async function handleGmailPush({
  db,
  tokenStore,
  projectId,
  clientId,
  clientSecret,
  geminiKey,
  message,
  fetchImpl,
  nowMs,
}) {
  const decoded = decodePushMessage(message);
  if (!decoded || !decoded.emailAddress) {
    return {ignored: true};
  }
  const connSnap = await db.doc(`gmailConnections/${connectionEmailKey(decoded.emailAddress)}`).get();
  if (!connSnap.exists || connSnap.data().status !== 'connected') {
    return {ignored: true};
  }
  const uid = connSnap.data().uid;
  const started = Date.now();
  const refreshToken = await tokenStore.readRefreshToken(projectId, uid);
  const accessToken = await refreshAccessToken({
    refreshToken,
    clientId,
    clientSecret,
    fetchImpl,
  });
  const result = await processConnectedUser({
    db,
    uid,
    accessToken,
    geminiKey,
    fetchImpl,
    nowMs: nowMs || Date.now(),
  });
  console.log(JSON.stringify({
    event: 'gmail_push',
    uidHash: uidHash(uid),
    processed: result.processed,
    created: result.created,
    durationMs: Date.now() - started,
  }));
  return result;
}

module.exports = {
  decodePushMessage,
  handleGmailPush,
  uidHash,
};
