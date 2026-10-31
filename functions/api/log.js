/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

function createApiLogger(logger) {
  function call(entry) {
    logger.info({
      route: entry.route,
      method: entry.method,
      status: entry.status,
      tokenLabel: entry.tokenLabel || null,
      items: entry.items,
      ok: entry.ok,
      failed: entry.failed,
      durationMs: entry.durationMs,
      requestIdPresent: Boolean(entry.requestIdPresent),
    });
  }

  return {call};
}

module.exports = {
  createApiLogger,
};
