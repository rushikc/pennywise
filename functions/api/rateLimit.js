/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const DEFAULT_LIMIT = 60;
const MINUTE_MS = 60 * 1000;

function minuteBucket(nowMs) {
  return Math.floor(nowMs / MINUTE_MS);
}

function createRateLimiter({db, limit = DEFAULT_LIMIT}) {
  async function consume({uid, tokenLabel, nowMs}) {
    const bucket = minuteBucket(nowMs);
    const ref = db.doc(`users/${uid}/private/api/rateLimits/${tokenLabel}_${bucket}`);
    return db.runTransaction(async (transaction) => {
      const snap = await transaction.get(ref);
      const count = snap.exists && snap.data() ? Number(snap.data().count) || 0 : 0;
      if (count >= limit) {
        const retryAfter = Math.max(1, Math.ceil(((bucket + 1) * MINUTE_MS - nowMs) / 1000));
        return {
          ok: false,
          status: 429,
          code: 'rate_limited',
          message: 'Rate limit exceeded',
          retryAfter,
        };
      }
      transaction.set(ref, {
        count: count + 1,
        expireAt: (bucket + 1) * MINUTE_MS,
      }, {merge: true});
      return {ok: true, count: count + 1};
    });
  }

  return {consume, limit};
}

module.exports = {
  DEFAULT_LIMIT,
  createRateLimiter,
  minuteBucket,
};
