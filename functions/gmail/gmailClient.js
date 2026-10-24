/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me';

async function refreshAccessToken({refreshToken, clientId, clientSecret, fetchImpl}) {
  const fetchFn = fetchImpl || fetch;
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });
  const response = await fetchFn(TOKEN_URL, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body,
  });
  const payload = await response.json();
  if (!response.ok) {
    const err = new Error(payload.error || 'token_refresh_failed');
    err.code = payload.error === 'invalid_grant' ? 'invalid_grant' : 'failed-precondition';
    throw err;
  }
  return payload.access_token;
}

async function gmailGet(path, accessToken, fetchImpl) {
  const fetchFn = fetchImpl || fetch;
  const response = await fetchFn(`${GMAIL_API}${path}`, {
    headers: {Authorization: `Bearer ${accessToken}`},
  });
  const payload = await response.json().catch(() => ({}));
  return {ok: response.ok, status: response.status, payload};
}

async function listHistory({accessToken, startHistoryId, pageToken, fetchImpl}) {
  const params = new URLSearchParams({
    startHistoryId: String(startHistoryId),
    historyTypes: 'messageAdded',
  });
  if (pageToken) {
    params.set('pageToken', pageToken);
  }
  return gmailGet(`/history?${params.toString()}`, accessToken, fetchImpl);
}

async function listMessages({accessToken, q, pageToken, fetchImpl}) {
  const params = new URLSearchParams({maxResults: '50'});
  if (q) {
    params.set('q', q);
  }
  if (pageToken) {
    params.set('pageToken', pageToken);
  }
  return gmailGet(`/messages?${params.toString()}`, accessToken, fetchImpl);
}

async function getMessage({accessToken, id, fetchImpl, format = 'full'}) {
  const fmt = format || 'full';
  return gmailGet(
    `/messages/${encodeURIComponent(id)}?format=${encodeURIComponent(fmt)}`,
    accessToken,
    fetchImpl,
  );
}

async function getProfile({accessToken, fetchImpl}) {
  return gmailGet('/profile', accessToken, fetchImpl);
}

function addedMessageIds(historyPayload) {
  const ids = [];
  for (const item of historyPayload.history || []) {
    for (const added of item.messagesAdded || []) {
      if (added.message && added.message.id) {
        ids.push(added.message.id);
      }
    }
  }
  return [...new Set(ids)];
}

module.exports = {
  refreshAccessToken,
  listHistory,
  listMessages,
  getMessage,
  getProfile,
  addedMessageIds,
};
