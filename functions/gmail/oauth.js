/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const REVOKE_URL = 'https://oauth2.googleapis.com/revoke';
const GMAIL_READONLY = 'https://www.googleapis.com/auth/gmail.readonly';

function assertOfflineScope(scope) {
  const scopes = String(scope || '').split(/\s+/);
  if (!scopes.includes(GMAIL_READONLY)) {
    const err = new Error('missing_gmail_readonly_scope');
    err.code = 'failed-precondition';
    throw err;
  }
}

async function exchangeAuthorizationCode({code, clientId, clientSecret, fetchImpl}) {
  const fetchFn = fetchImpl || fetch;
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: 'postmessage',
  });
  const response = await fetchFn(TOKEN_URL, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body,
  });
  const payload = await response.json();
  if (!response.ok || !payload.refresh_token) {
    const err = new Error('oauth_exchange_failed');
    err.code = 'failed-precondition';
    throw err;
  }
  assertOfflineScope(payload.scope);
  return {
    refreshToken: payload.refresh_token,
    accessToken: payload.access_token || null,
    scope: payload.scope,
  };
}

async function fetchGmailEmail(accessToken, fetchImpl) {
  if (!accessToken) {
    return null;
  }
  const fetchFn = fetchImpl || fetch;
  const response = await fetchFn('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {Authorization: `Bearer ${accessToken}`},
  });
  if (!response.ok) {
    return null;
  }
  const payload = await response.json();
  return payload.email || null;
}

async function revokeToken(token, fetchImpl) {
  if (!token) {
    return;
  }
  const fetchFn = fetchImpl || fetch;
  await fetchFn(`${REVOKE_URL}?token=${encodeURIComponent(token)}`, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
  });
}

module.exports = {
  GMAIL_READONLY,
  exchangeAuthorizationCode,
  fetchGmailEmail,
  revokeToken,
  assertOfflineScope,
};
