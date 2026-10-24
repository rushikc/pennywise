/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {HttpsError} = require('firebase-functions/v2/https');
const {exchangeAuthorizationCode, fetchGmailEmail, revokeToken} = require('./oauth');
const {assertAllowlisted, writeConnectedState, writeDisconnectedState} =
  require('./connectionState');
const {startGmailWatch, stopGmailWatch} = require('./watch');
const {refreshAccessToken} = require('./gmailClient');

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
    try {
      await writeConnectedState(db, {uid, email: gmailEmail, nowMs: now()});
    } catch (error) {
      if (error.code === 'already-exists') {
        throw new HttpsError(
          'already-exists',
          'This Gmail account is already connected to another Pennywise user.',
        );
      }
      throw error;
    }
    if (tokens.accessToken) {
      const watch = await startGmailWatch({
        accessToken: tokens.accessToken,
        projectId,
        fetchImpl,
      });
      await db.doc(`users/${uid}/private/gmail`).set(watch, {merge: true});
    }
    return {status: 'connected', email: gmailEmail};
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
    if (refreshToken) {
      try {
        const accessToken = await refreshAccessToken({
          refreshToken,
          clientId,
          clientSecret,
          fetchImpl,
        });
        await stopGmailWatch({accessToken, fetchImpl});
      } catch (error) {
        if (error.code !== 'invalid_grant') {
          throw error;
        }
      }
    }
    await revokeToken(refreshToken, fetchImpl);
    await tokenStore.deleteRefreshToken(projectId, uid);
    const privateSnap = await db.doc(`users/${uid}/private/gmail`).get();
    const gmailEmail = privateSnap.exists && privateSnap.data() ? privateSnap.data().email : null;
    await writeDisconnectedState(db, {uid, email: gmailEmail || null, lastError: null, nowMs: now()});
    return {status: 'disconnected'};
  }

  return {connectGmail, disconnectGmail, requireAllowlistedAuth};
}

module.exports = {
  createGmailCallables,
  requireAllowlistedAuth,
};
