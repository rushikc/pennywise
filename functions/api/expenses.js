/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {
  normalizeTags,
  withTags,
  readTags,
  sameTag,
  normalizeDescription,
} = require('../lib/parse');

const ITEM_FIELDS = [
  'id', 'vendor', 'cost', 'costType', 'date', 'tags', 'description', 'enrichedAt', 'modifiedDate',
];
const PATCH_WRITE_KEYS = new Set(['tags', 'tag', 'description', 'enrichedAt', 'modifiedDate']);
const SCAN_CAP = 2000;

function fail(status, code, message) {
  return {ok: false, status, code, message};
}

function encodeCursor({m, id}) {
  return Buffer.from(JSON.stringify({m, id})).toString('base64url');
}

function decodeCursor(cursor) {
  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    if (!Number.isInteger(parsed.m) || typeof parsed.id !== 'string' || !parsed.id) {
      return null;
    }
    return {m: parsed.m, id: parsed.id};
  } catch {
    return null;
  }
}

function unionExtras(serverExtras, addExtras, removeExtras) {
  const removed = (item) => removeExtras.some((other) => sameTag(item, other));
  const kept = serverExtras.filter((item) => !removed(item));
  const result = [...kept];
  for (const extra of addExtras) {
    if (!result.some((item) => sameTag(item, extra))) {
      result.push(extra);
    }
  }
  return result;
}

function resolvePatchTags(serverDoc, patch, lists) {
  const serverTags = readTags(serverDoc);
  const serverPrimary = serverTags[0] || null;
  const serverExtras = serverTags.slice(1);
  let primary = serverPrimary;
  let extras = serverExtras;
  let tagsTouched = false;

  if (patch.tags !== undefined) {
    tagsTouched = true;
    if (patch.tags.length === 0) {
      primary = null;
      extras = [];
    } else {
      const requestedPrimary = patch.tags[0];
      const requestedExtras = patch.tags.slice(1);
      if (!serverPrimary) {
        primary = requestedPrimary;
      } else if (sameTag(serverPrimary, requestedPrimary)) {
        primary = serverPrimary;
      } else if (patch.replacePrimary) {
        primary = requestedPrimary;
      } else {
        return fail(409, 'primary_conflict', 'Primary tag already set');
      }
      extras = patch.replace ?
        requestedExtras :
        unionExtras(serverExtras, requestedExtras, patch.removeExtras || []);
    }
  } else if (patch.removeExtras) {
    tagsTouched = true;
    extras = extras.filter((item) => !patch.removeExtras.some((other) => sameTag(item, other)));
  }

  if (extras.length > 0 && !primary) {
    const requestedPrimary = patch.tags && patch.tags.length ? patch.tags[0] : null;
    const emptyPrimary = !requestedPrimary ||
      (typeof requestedPrimary === 'string' && !requestedPrimary.trim());
    if (patch.tags && patch.tags.length > 0 && emptyPrimary) {
      const normalised = normalizeTags(requestedPrimary, extras, lists);
      return {ok: true, tagsTouched: true, tags: normalised.tags, dropped: normalised.dropped};
    }
    return fail(422, 'extras_need_primary', 'Extra tags require a primary tag');
  }
  if (!tagsTouched) {
    return {ok: true, tagsTouched: false, tags: serverTags, dropped: []};
  }
  const normalised = normalizeTags(primary, extras, lists);
  return {ok: true, tagsTouched: true, tags: normalised.tags, dropped: normalised.dropped};
}

function publicExpense(id, data) {
  const tags = readTags(data);
  return {
    id,
    vendor: data.vendor == null ? null : data.vendor,
    cost: data.cost == null ? null : data.cost,
    costType: data.costType == null ? null : data.costType,
    date: data.date == null ? null : data.date,
    tags,
    description: data.description == null ? null : data.description,
    enrichedAt: data.enrichedAt == null ? null : data.enrichedAt,
    modifiedDate: data.modifiedDate == null ? null : data.modifiedDate,
  };
}

function isDeleted(data) {
  return data && data.operation === 'delete';
}

function createExpenseApi({db, now, fieldDelete, documentIdField}) {
  function expenseRef(uid, id) {
    return db.doc(`users/${uid}/expense/${id}`);
  }

  async function readTagLists(transaction, uid) {
    const snap = await transaction.get(db.doc(`users/${uid}/config/tags`));
    const data = snap.exists ? snap.data() || {} : {};
    return {
      tagList: Array.isArray(data.tagList) ? data.tagList : [],
      legacyTagList: Array.isArray(data.legacyTagList) ? data.legacyTagList : [],
    };
  }

  function expenseQuery(uid, {untagged, since, cursor}) {
    let query = db.collection(`users/${uid}/expense`);
    if (untagged) {
      query = query.where('tags', '==', []);
    }
    if (since != null) {
      query = query.where('modifiedDate', '>=', since);
    }
    query = query.orderBy('modifiedDate').orderBy(documentIdField);
    if (cursor) {
      query = query.startAfter(cursor.m, cursor.id);
    }
    return query;
  }

  async function listExpenses(uid, params) {
    let cursor = null;
    if (params.cursor) {
      cursor = decodeCursor(params.cursor);
      if (!cursor) {
        return fail(422, 'invalid_cursor', 'cursor is invalid');
      }
    }

    const items = [];
    let last = cursor;
    let scanned = 0;
    while (items.length < params.limit && scanned < SCAN_CAP) {
      const batchSize = params.limit - items.length;
      const snap = await expenseQuery(uid, {...params, cursor: last}).limit(batchSize).get();
      const docs = snap.docs || [];
      if (!docs.length) {
        break;
      }
      for (const doc of docs) {
        scanned += 1;
        const data = doc.data() || {};
        last = {m: data.modifiedDate, id: doc.id};
        if (isDeleted(data)) {
          continue;
        }
        if (params.untagged && readTags(data).length > 0) {
          continue;
        }
        items.push(publicExpense(doc.id, data));
        if (items.length === params.limit) {
          break;
        }
      }
      if (docs.length < batchSize) {
        break;
      }
    }

    const nextCursor = items.length === params.limit && last ? encodeCursor(last) : null;
    return {ok: true, value: {items, nextCursor}};
  }

  async function patchExpense(uid, id, patch) {
    const nowMs = now();
    const ref = expenseRef(uid, id);
    return db.runTransaction(async (transaction) => {
      const snap = await transaction.get(ref);
      if (!snap.exists) {
        return fail(404, 'expense_not_found', 'Expense not found');
      }
      const data = snap.data() || {};
      if (isDeleted(data)) {
        return fail(409, 'expense_deleted', 'Expense is deleted');
      }

      const lists = await readTagLists(transaction, uid);
      const resolved = resolvePatchTags(data, patch, lists);
      if (!resolved.ok) {
        return resolved;
      }

      const writes = {};
      if (resolved.tagsTouched) {
        const tagged = withTags({}, resolved.tags);
        writes.tags = tagged.tags;
        writes.tag = tagged.tag ?? null;
      }
      let descriptionDeleted = false;
      if (patch.description !== undefined) {
        const note = typeof patch.description === 'string' ? normalizeDescription(patch.description) : undefined;
        if (note) {
          writes.description = note;
        } else {
          writes.description = fieldDelete();
          descriptionDeleted = true;
        }
      }
      const changed = resolved.tagsTouched || patch.description !== undefined;
      if (patch.enrichedAt !== undefined) {
        writes.enrichedAt = patch.enrichedAt;
      } else if (changed) {
        writes.enrichedAt = nowMs;
      }
      writes.modifiedDate = nowMs;

      const extraKeys = Object.keys(writes).filter((key) => !PATCH_WRITE_KEYS.has(key));
      if (extraKeys.length) {
        return fail(500, 'server_misconfigured', 'Refusing unexpected write keys');
      }
      transaction.update(ref, writes);

      const next = {...data, ...writes};
      if (descriptionDeleted) {
        delete next.description;
      }
      return {
        ok: true,
        writes,
        value: {
          id,
          tags: resolved.tagsTouched ? resolved.tags : readTags(next),
          description: next.description == null ? null : next.description,
          enrichedAt: next.enrichedAt == null ? null : next.enrichedAt,
          modifiedDate: writes.modifiedDate,
          dropped: resolved.dropped || [],
        },
      };
    });
  }

  async function batchUpdate(uid, patches) {
    const results = [];
    let okCount = 0;
    let failed = 0;
    for (const patch of patches) {
      const result = await patchExpense(uid, patch.id, patch);
      if (result.ok) {
        okCount += 1;
        results.push({status: 200, ...result.value});
      } else {
        failed += 1;
        results.push({
          id: patch.id,
          status: result.status,
          error: {code: result.code, message: result.message},
        });
      }
    }
    return {ok: true, value: {results, ok: okCount, failed}};
  }

  async function listVendorTags(uid) {
    const snap = await db.collection(`users/${uid}/vendorTag`).get();
    const items = [];
    snap.forEach((doc) => {
      const data = doc.data() || {};
      items.push({
        id: doc.id,
        vendor: data.vendor == null ? null : data.vendor,
        tag: data.tag == null ? null : data.tag,
      });
    });
    return {ok: true, value: {items}};
  }

  async function getTagConfig(uid) {
    const snap = await db.doc(`users/${uid}/config/tags`).get();
    const data = snap.exists ? snap.data() || {} : {};
    return {
      ok: true,
      value: {
        tagList: Array.isArray(data.tagList) ? data.tagList : [],
        legacyTagList: Array.isArray(data.legacyTagList) ? data.legacyTagList : [],
      },
    };
  }

  return {
    listExpenses,
    patchExpense,
    batchUpdate,
    listVendorTags,
    getTagConfig,
    resolvePatchTags,
    publicExpense,
    encodeCursor,
    decodeCursor,
    PATCH_WRITE_KEYS,
    ITEM_FIELDS,
  };
}

module.exports = {
  createExpenseApi,
  resolvePatchTags,
  publicExpense,
  encodeCursor,
  decodeCursor,
  unionExtras,
  PATCH_WRITE_KEYS,
  ITEM_FIELDS,
};
