/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {verifyBearerToken} = require('./auth');
const {createOwnerResolver} = require('./owner');
const {
  MAX_PATCH_BYTES,
  MAX_BATCH_BYTES,
  checkContentType,
  checkBodySize,
  parseJson,
  parseExpenseId,
  parseListQuery,
  parsePatchObject,
  parseBatchBody,
} = require('./schema');
const {createExpenseApi} = require('./expenses');
const {createRateLimiter, DEFAULT_LIMIT} = require('./rateLimit');
const {createIdempotency} = require('./idempotency');
const {createApiLogger} = require('./log');

const ROUTES = [
  {method: 'GET', path: '/health', name: 'health'},
  {method: 'GET', path: '/expenses', name: 'list'},
  {method: 'PATCH', pattern: /^\/expense\/([^/]+)$/, name: 'patch'},
  {method: 'POST', path: '/expenses:batchUpdate', name: 'batch'},
  {method: 'GET', path: '/vendorTags', name: 'vendorTags'},
  {method: 'GET', path: '/config/tags', name: 'configTags'},
];

function requestPath(req) {
  const raw = String(req.path || (req.url && String(req.url).split('?')[0]) || '/');
  const marker = '/pennywiseApi';
  const index = raw.lastIndexOf(marker);
  const sliced = index >= 0 ? raw.slice(index + marker.length) : raw;
  if (!sliced || sliced === '/') {
    return '/';
  }
  return sliced.startsWith('/') ? sliced : `/${sliced}`;
}

function header(req, name) {
  const headers = req.headers || {};
  const direct = headers[name] || headers[name.toLowerCase()];
  if (direct) {
    return Array.isArray(direct) ? direct[0] : direct;
  }
  if (typeof req.get === 'function') {
    return req.get(name);
  }
  return undefined;
}

function matchRoute(method, path) {
  const known = [];
  for (const route of ROUTES) {
    if (route.path === path || (route.pattern && route.pattern.test(path))) {
      known.push(route);
      if (route.method === method) {
        const params = {};
        if (route.pattern) {
          const match = path.match(route.pattern);
          params.id = match[1];
        }
        return {route, params};
      }
    }
  }
  if (known.length) {
    return {wrongMethod: true, allow: [...new Set(known.map((item) => item.method))].join(', ')};
  }
  return {notFound: true};
}

function setCommonHeaders(res) {
  setHeader(res, 'Content-Type', 'application/json; charset=utf-8');
  setHeader(res, 'Cache-Control', 'no-store');
  setHeader(res, 'X-Content-Type-Options', 'nosniff');
}

function setHeader(res, name, value) {
  if (typeof res.set === 'function') {
    res.set(name, value);
    return;
  }
  if (typeof res.setHeader === 'function') {
    res.setHeader(name, value);
  }
}

function send(res, status, body) {
  setCommonHeaders(res);
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    res.status(status).json(body);
    return;
  }
  res.statusCode = status;
  if (typeof res.end === 'function') {
    res.end(JSON.stringify(body));
  }
}

function errorBody(code, message, requestId) {
  const body = {error: {code, message}};
  if (requestId) {
    body.requestId = requestId;
  }
  return body;
}

function parseJsonBody(req, maxBytes, requestId) {
  const lengthHeader = header(req, 'content-length');
  if (lengthHeader != null && Number(lengthHeader) > maxBytes) {
    return {ok: false, status: 413, code: 'payload_too_large', message: 'Payload is too large', requestId};
  }
  const type = checkContentType(header(req, 'content-type'));
  if (!type.ok) {
    return {...type, requestId};
  }
  const raw = req.rawBody != null ? req.rawBody : '';
  const size = checkBodySize(raw, maxBytes);
  if (!size.ok) {
    return {...size, requestId};
  }
  return parseJson(raw);
}

async function dispatch(ctx) {
  const {name} = ctx.matched.route;
  const {uid, expenses, nowMs} = ctx;

  if (name === 'list') {
    const query = parseListQuery(ctx.req.query || {});
    if (!query.ok) {
      return query;
    }
    return expenses.listExpenses(uid, query.value);
  }

  if (name === 'patch') {
    const id = parseExpenseId(ctx.matched.params.id);
    if (!id.ok) {
      return id;
    }
    const parsed = parseJsonBody(ctx.req, MAX_PATCH_BYTES, undefined);
    if (!parsed.ok) {
      return parsed;
    }
    const patch = parsePatchObject(parsed.value, nowMs);
    if (!patch.ok) {
      return patch;
    }
    ctx.requestId = patch.value.requestId;
    const idem = await ctx.idempotency.lookup({
      uid,
      tokenLabel: ctx.tokenLabel,
      requestId: patch.value.requestId,
      body: parsed.value,
    });
    if (!idem.ok) {
      return {...idem, requestId: ctx.requestId};
    }
    if (idem.replay) {
      return {ok: true, status: idem.status, value: idem.body, replay: true, requestId: ctx.requestId};
    }
    const result = await expenses.patchExpense(uid, id.value, patch.value);
    if (result.ok && patch.value.requestId) {
      await ctx.idempotency.store(idem.ref, {
        status: 200,
        body: result.value,
        bodyHash: idem.bodyHash,
        nowMs,
      });
    }
    return {...result, requestId: ctx.requestId};
  }

  if (name === 'batch') {
    const parsed = parseJsonBody(ctx.req, MAX_BATCH_BYTES, undefined);
    if (!parsed.ok) {
      return parsed;
    }
    const batch = parseBatchBody(parsed.value, nowMs);
    if (!batch.ok) {
      return batch;
    }
    ctx.requestId = batch.value.requestId;
    const idem = await ctx.idempotency.lookup({
      uid,
      tokenLabel: ctx.tokenLabel,
      requestId: batch.value.requestId,
      body: parsed.value,
    });
    if (!idem.ok) {
      return {...idem, requestId: ctx.requestId};
    }
    if (idem.replay) {
      return {ok: true, status: idem.status, value: idem.body, replay: true, requestId: ctx.requestId};
    }
    const result = await expenses.batchUpdate(uid, batch.value.patches);
    if (result.ok && batch.value.requestId) {
      await ctx.idempotency.store(idem.ref, {
        status: 200,
        body: result.value,
        bodyHash: idem.bodyHash,
        nowMs,
      });
    }
    return {...result, requestId: ctx.requestId};
  }

  if (name === 'vendorTags') {
    return expenses.listVendorTags(uid);
  }
  if (name === 'configTags') {
    return expenses.getTagConfig(uid);
  }
  return {ok: false, status: 404, code: 'not_found', message: 'Not found'};
}

function createApiHandler(deps) {
  const now = deps.now || (() => Date.now());
  const apiLogger = createApiLogger(deps.logger || {info() {}});
  const owner = createOwnerResolver({
    db: deps.db,
    auth: deps.auth,
    ownerEmail: deps.ownerEmail,
    now,
    logger: deps.logger,
  });
  const expenses = createExpenseApi({
    db: deps.db,
    now,
    fieldDelete: deps.fieldDelete,
    documentIdField: deps.documentIdField,
  });
  const rateLimiter = createRateLimiter({
    db: deps.db,
    limit: deps.rateLimit != null ? deps.rateLimit : DEFAULT_LIMIT,
  });
  const idempotency = createIdempotency({db: deps.db});

  return async function handle(req, res) {
    const started = now();
    const method = String(req.method || 'GET').toUpperCase();
    const path = requestPath(req);
    let status = 500;
    let tokenLabel = null;
    let requestIdPresent = false;
    let items;
    let okCount;
    let failed;
    let logRoute = path;

    const finish = (code, body, extraHeaders) => {
      status = code;
      if (extraHeaders) {
        for (const [name, value] of Object.entries(extraHeaders)) {
          setHeader(res, name, value);
        }
      }
      send(res, code, body);
    };

    try {
      const proto = header(req, 'x-forwarded-proto');
      if (proto && String(proto).toLowerCase() === 'http') {
        finish(403, errorBody('https_required', 'HTTPS is required'));
        return;
      }
      if (header(req, 'origin')) {
        finish(403, errorBody('browser_origin_not_allowed', 'Browser origins are not allowed'));
        return;
      }

      const matched = matchRoute(method, path);
      if (matched.notFound) {
        finish(404, errorBody('not_found', 'Not found'));
        return;
      }
      if (matched.wrongMethod) {
        finish(405, errorBody('method_not_allowed', 'Method not allowed'), {Allow: matched.allow});
        return;
      }
      logRoute = matched.route.path || path;

      if (matched.route.name === 'health') {
        finish(200, {ok: true});
        return;
      }

      const authResult = verifyBearerToken(header(req, 'authorization'), deps.getTokenDigests());
      if (!authResult.ok) {
        finish(authResult.status, errorBody(authResult.code, authResult.message), {
          'WWW-Authenticate': 'Bearer',
        });
        return;
      }
      tokenLabel = authResult.tokenLabel;

      const ownerResult = await owner.resolveOwner();
      if (!ownerResult.ok) {
        finish(ownerResult.status, errorBody(ownerResult.code, ownerResult.message));
        return;
      }

      const nowMs = now();
      const limited = await rateLimiter.consume({
        uid: ownerResult.uid,
        tokenLabel,
        nowMs,
      });
      if (!limited.ok) {
        finish(limited.status, errorBody(limited.code, limited.message), {
          'Retry-After': String(limited.retryAfter),
        });
        return;
      }

      const result = await dispatch({
        req,
        matched,
        uid: ownerResult.uid,
        tokenLabel,
        expenses,
        idempotency,
        nowMs,
      });
      requestIdPresent = Boolean(result.requestId);

      if (!result.ok) {
        finish(result.status, errorBody(result.code, result.message, result.requestId));
        return;
      }
      if (result.value && Array.isArray(result.value.items)) {
        items = result.value.items.length;
      }
      if (result.value && result.value.ok != null && result.value.failed != null) {
        okCount = result.value.ok;
        failed = result.value.failed;
      }
      const headers = {};
      if (result.replay) {
        headers['Idempotent-Replay'] = 'true';
      }
      finish(result.status || 200, result.value, headers);
    } finally {
      apiLogger.call({
        route: logRoute,
        method,
        status,
        tokenLabel,
        items,
        ok: okCount,
        failed,
        durationMs: now() - started,
        requestIdPresent,
      });
    }
  };
}

module.exports = {
  createApiHandler,
  requestPath,
};
