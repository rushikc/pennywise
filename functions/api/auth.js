/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {createHash, timingSafeEqual} = require('node:crypto');

const HEX_DIGEST = /^[0-9a-fA-F]{64}$/;
const MIN_TOKEN_LENGTH = 32;

function parseDigestSlot(value) {
  if (value == null) {
    return {kind: 'disabled'};
  }
  const trimmed = String(value).trim();
  if (!trimmed || trimmed === 'disabled') {
    return {kind: 'disabled'};
  }
  if (!HEX_DIGEST.test(trimmed)) {
    return {kind: 'malformed'};
  }
  return {kind: 'digest', buffer: Buffer.from(trimmed.toLowerCase(), 'hex')};
}

function sha256(token) {
  return createHash('sha256').update(token, 'utf8').digest();
}

function readBearerToken(authorizationHeader) {
  if (authorizationHeader == null || authorizationHeader === '') {
    return {present: false};
  }
  const raw = String(authorizationHeader);
  const match = /^Bearer\s+(\S.*)$/i.exec(raw);
  if (!match) {
    return {present: true, token: ''};
  }
  return {present: true, token: match[1].trim()};
}

function verifyBearerToken(authorizationHeader, secrets, compare = timingSafeEqual) {
  const slots = [
    {label: 'current', ...parseDigestSlot(secrets && secrets.current)},
    {label: 'next', ...parseDigestSlot(secrets && secrets.next)},
  ];
  if (slots.some((slot) => slot.kind === 'malformed')) {
    return {ok: false, status: 500, code: 'server_misconfigured', message: 'Server is misconfigured'};
  }
  const configured = slots.filter((slot) => slot.kind === 'digest');
  const bearer = readBearerToken(authorizationHeader);
  if (!bearer.present) {
    return {ok: false, status: 401, code: 'missing_token', message: 'Missing bearer token'};
  }

  const digest = sha256(bearer.token || '');
  let matchedLabel = null;
  for (const slot of configured) {
    const equal = compare(digest, slot.buffer);
    if (equal && !matchedLabel) {
      matchedLabel = slot.label;
    }
  }

  const tooShort = !bearer.token || bearer.token.length < MIN_TOKEN_LENGTH;
  if (tooShort || !matchedLabel) {
    return {ok: false, status: 401, code: 'invalid_token', message: 'Invalid bearer token'};
  }
  return {ok: true, tokenLabel: matchedLabel};
}

module.exports = {
  parseDigestSlot,
  sha256,
  verifyBearerToken,
};
