/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {assertAllowlisted, connectionEmailKey} = require('../gmail/connectionState');

const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;

function ownerUnavailable(reason, logger) {
  if (logger && typeof logger.warn === 'function') {
    logger.warn({event: 'owner_unavailable', reason});
  }
  return {ok: false, status: 503, code: 'owner_unavailable', message: 'Owner is unavailable', reason};
}

function createOwnerResolver({
  db,
  auth,
  ownerEmail,
  now,
  cacheTtlMs = DEFAULT_CACHE_TTL_MS,
  logger,
}) {
  let cache = null;

  async function resolveOwner() {
    const nowMs = now();
    if (cache && cache.expiresAt > nowMs) {
      return {ok: true, uid: cache.uid};
    }

    const configured = typeof ownerEmail === 'function' ? ownerEmail() : ownerEmail;
    const email = connectionEmailKey(configured);
    if (!email) {
      return ownerUnavailable('missing_email', logger);
    }

    let allowed;
    try {
      allowed = await assertAllowlisted(db, email);
    } catch {
      return ownerUnavailable('allowlist_lookup_failed', logger);
    }
    if (!allowed) {
      return ownerUnavailable('not_allowlisted', logger);
    }

    let user;
    try {
      user = await auth.getUserByEmail(email);
    } catch {
      return ownerUnavailable('auth_lookup_failed', logger);
    }
    if (!user || user.disabled) {
      return ownerUnavailable('disabled', logger);
    }
    if (user.emailVerified !== true) {
      return ownerUnavailable('unverified', logger);
    }

    cache = {uid: user.uid, expiresAt: nowMs + cacheTtlMs};
    return {ok: true, uid: user.uid};
  }

  return {resolveOwner};
}

module.exports = {
  createOwnerResolver,
};
