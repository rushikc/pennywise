/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {loadGcpNames} = require('../gcpNames');

const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me';

function topicResourceName(projectId) {
  return `projects/${projectId}/topics/${loadGcpNames().pubsubTopic}`;
}

async function startGmailWatch({accessToken, projectId, fetchImpl}) {
  const fetchFn = fetchImpl || fetch;
  const response = await fetchFn(`${GMAIL_API}/watch`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      topicName: topicResourceName(projectId),
      labelIds: ['INBOX'],
      labelFilterBehavior: 'INCLUDE',
    }),
  });
  if (!response.ok) {
    const err = new Error('gmail_watch_failed');
    err.code = 'failed-precondition';
    throw err;
  }
  const body = await response.json();
  return {
    historyId: body.historyId != null ? String(body.historyId) : null,
    watchExpiration: body.expiration != null ? Number(body.expiration) : null,
  };
}

async function stopGmailWatch({accessToken, fetchImpl}) {
  if (!accessToken) {
    return;
  }
  const fetchFn = fetchImpl || fetch;
  await fetchFn(`${GMAIL_API}/stop`, {
    method: 'POST',
    headers: {Authorization: `Bearer ${accessToken}`},
  });
}

module.exports = {
  topicResourceName,
  startGmailWatch,
  stopGmailWatch,
};
