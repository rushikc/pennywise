/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {HttpsError} = require('firebase-functions/v2/https');
const {exchangeAuthorizationCode, fetchGmailEmail, revokeToken} = require('./oauth');
const {assertAllowlisted, startGmailWatch, stopGmailWatch, writeConnectedState, writeDisconnectedState} =
  require('./connectionState');

function requireAllowlistedAuth(request) {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError('unauthenticated', 'Sign in required.');
  }
  const email = request.auth.token && request.auth.token.email;
  const verified = request.auth.token && request.auth.token.email_verified;
  if (!email || verified !== true) {
    throw new HttpsError('permission-denied', 'Verified email required.');
  }
  return {uid: request.auth.uid, email};
}

function createGmailCallables({db, tokenStore, projectId, clientId, clientSecret, fetchImpl, now}) {
  async function connectGmail(request) {
    const {uid, email} = requireAllowlistedAuth(request);
    const allowed = await assertAllowlisted(db, email);
    if (!allowed) {
      throw new HttpsError('permission-denied', 'User is not allowlisted.');
    }
    const code = request.data && request.data.code;
    if (!code || typeof code !== 'string') {
      throw new HttpsError('invalid-argument', 'Authorization code required.');
    }

    const tokens = await exchangeAuthorizationCode({
      code,
      clientId,
      clientSecret,
      fetchImpl,
    });
    const gmailEmail = await fetchGmailEmail(tokens.accessToken, fetchImpl) || email;
    await tokenStore.saveRefreshToken(projectId, uid, tokens.refreshToken);
    await writeConnectedState(db, {uid, email: gmailEmail, nowMs: now()});
    await startGmailWatch({uid, accessToken: tokens.accessToken});
    return {status: 'connected', email};
  }

  async function disconnectGmail(request) {
    const {uid, email} = requireAllowlistedAuth(request);
    const allowed = await assertAllowlisted(db, email);
    if (!allowed) {
      throw new HttpsError('permission-denied', 'User is not allowlisted.');
    }
    let refreshToken = null;
    try {
      refreshToken = await tokenStore.readRefreshToken(projectId, uid);
    } catch (error) {
      if (error.code !== 5) {
        throw error;
      }
    }
    await stopGmailWatch({uid, refreshToken});
    await revokeToken(refreshToken, fetchImpl);
    await tokenStore.deleteRefreshToken(projectId, uid);
    await writeDisconnectedState(db, {uid, email, lastError: null, nowMs: now()});
    return {status: 'disconnected'};
  }

  return {connectGmail, disconnectGmail, requireAllowlistedAuth};
}

module.exports = {
  createGmailCallables,
  requireAllowlistedAuth,
};
