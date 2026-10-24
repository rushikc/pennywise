/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {detect, mergedTag, defaultRules} = require('../dedupe/rules');
const {shouldScanExpense, shouldWriteKeepTag, pickReviewSurvivor, mergeRuleset} =
  require('../dedupe/apply');
const {advanceCursor, readCursor} = require('./cursor');
const {
  addedMessageIds,
  getMessage,
  getProfile,
  listHistory,
  listMessages,
} = require('./gmailClient');

function loadParse() {
  return require('../lib/parse');
}

function expenseRef(db, uid, messageId) {
  return db.doc(`users/${uid}/expense/${messageId}`);
}

function processedIdRef(db, uid, messageId) {
  return db.doc(`users/${uid}/private/processedIds/${messageId}`);
}

function isAlreadyExists(error) {
  return Boolean(error) && (
    error.code === 6 ||
    error.code === 'already-exists' ||
    error.code === 'ALREADY_EXISTS'
  );
}

function gmailListFailed() {
  const err = new Error('gmail_list_failed');
  err.code = 'failed-precondition';
  return err;
}

async function loadUserBanks(db, uid) {
  const snap = await db.doc(`users/${uid}/config/emailParseBanks`).get();
  if (!snap.exists) {
    return [];
  }
  return Array.isArray(snap.data().banks) ? snap.data().banks : [];
}

async function loadVendorTags(db, uid) {
  const snap = await db.collection(`users/${uid}/vendorTag`).get();
  const tags = [];
  snap.forEach((doc) => tags.push({id: doc.id, ...doc.data()}));
  return tags;
}

async function saveParsedExpense(db, uid, message, parsed, vendorTags, nowMs) {
  const parse = loadParse();
  const messageId = message.id;
  const markerRef = processedIdRef(db, uid, messageId);
  try {
    await markerRef.create({mailId: messageId, at: nowMs});
  } catch (error) {
    if (isAlreadyExists(error)) {
      return {created: false};
    }
    throw error;
  }
  const vendor = parse.canonicalizeVendor(parsed.vendor);
  const tag = parse.resolveVendorTag(vendor, vendorTags);
  const expense = {
    cost: parsed.cost,
    costType: parsed.costType,
    vendor,
    tag: tag || null,
    type: parsed.type,
    date: parse.mailDateFromMessage(message, nowMs),
    modifiedDate: nowMs,
    mailId: messageId,
    operation: 'add',
    user: parse.extractUsername(parse.getMailSenderReceiver(message).receiverEmail),
  };
  try {
    await expenseRef(db, uid, messageId).create(expense);
  } catch (error) {
    if (isAlreadyExists(error)) {
      return {created: false};
    }
    throw error;
  }
  return {created: true, expense: {id: messageId, ...expense}};
}

async function applyDedupe(db, uid, nowMs) {
  const cutoff = nowMs - 7 * 24 * 60 * 60 * 1000;
  const snap = await db.collection(`users/${uid}/expense`).where('date', '>=', cutoff).get();
  const expenses = [];
  snap.forEach((doc) => {
    const data = doc.data() || {};
    if (!shouldScanExpense(data)) {
      return;
    }
    expenses.push({id: doc.id, ...data});
  });
  let ruleset = defaultRules;
  try {
    const rulesDoc = await db.doc(`users/${uid}/config/dedupeRules`).get();
    if (rulesDoc.exists && rulesDoc.data()) {
      ruleset = mergeRuleset(defaultRules, rulesDoc.data());
    }
  } catch (error) {
    ruleset = defaultRules;
  }
  const {pairs, needsReview} = detect(expenses, ruleset);
  const writes = [];
  for (const pair of pairs) {
    const inheritedTag = mergedTag(pair.keep, pair.drop);
    if (shouldWriteKeepTag(pair.keep, inheritedTag)) {
      writes.push({
        ref: expenseRef(db, uid, pair.keep.id),
        data: {tag: inheritedTag, modifiedDate: nowMs},
      });
    }
    writes.push({
      ref: expenseRef(db, uid, pair.drop.id),
      data: {
        duplicateOf: pair.keep.id,
        dupeStatus: 'auto',
        dupeRule: pair.rule,
        modifiedDate: nowMs,
      },
    });
  }
  for (const review of needsReview) {
    const {keep, drop} = pickReviewSurvivor(review.a, review.b);
    writes.push({
      ref: expenseRef(db, uid, drop.id),
      data: {
        dupeCandidateOf: keep.id,
        dupeStatus: 'pending',
        dupeRule: `review:${review.reason}`,
        modifiedDate: nowMs,
      },
    });
  }
  for (const write of writes) {
    await write.ref.set(write.data, {merge: true});
  }
  return {pairCount: pairs.length, reviewCount: needsReview.length};
}

function metadataHaystack(message) {
  const parse = loadParse();
  const subject = parse.getMailSubject(message);
  const snippet = message && message.snippet ? String(message.snippet) : '';
  return `${subject}\n${snippet}`;
}

async function parseAndSaveMessage({db, uid, message, banks, vendorTags, geminiKey, fetchImpl, nowMs}) {
  const parse = loadParse();
  const subject = parse.getMailSubject(message);
  const text = parse.messagePlainText(message);
  const haystack = `${subject}\n${text}`;
  if (!parse.findEmailParseBankMatch(haystack, banks)) {
    return {skipped: true, reason: 'bank'};
  }
  let parsed = parse.parseExpenseWithRegex(haystack);
  if (!parsed && geminiKey) {
    parsed = await parse.parseExpenseWithGemini(text, subject, geminiKey, fetchImpl);
  }
  if (!parsed) {
    return {skipped: true, reason: 'unparsed'};
  }
  return saveParsedExpense(db, uid, message, parsed, vendorTags, nowMs);
}

async function ingestMessageById({
  db, uid, id, accessToken, banks, vendorTags, geminiKey, fetchImpl, nowMs,
}) {
  const parse = loadParse();
  const meta = await getMessage({accessToken, id, format: 'metadata', fetchImpl});
  if (!meta.ok) {
    return {skipped: true, reason: 'fetch'};
  }
  if (!parse.findEmailParseBankMatch(metadataHaystack(meta.payload), banks)) {
    return {skipped: true, reason: 'bank'};
  }
  const full = await getMessage({accessToken, id, format: 'full', fetchImpl});
  if (!full.ok) {
    return {skipped: true, reason: 'fetch'};
  }
  return parseAndSaveMessage({
    db,
    uid,
    message: full.payload,
    banks,
    vendorTags,
    geminiKey,
    fetchImpl,
    nowMs,
  });
}

async function collectHistoryIds({accessToken, startHistoryId, fetchImpl}) {
  const ids = [];
  let pageToken;
  let latestHistoryId = startHistoryId;
  for (;;) {
    const result = await listHistory({accessToken, startHistoryId, pageToken, fetchImpl});
    if (!result.ok && result.status === 404) {
      return {stale: true, ids: []};
    }
    if (!result.ok) {
      const err = new Error('gmail_history_failed');
      err.code = 'failed-precondition';
      throw err;
    }
    ids.push(...addedMessageIds(result.payload));
    if (result.payload.historyId) {
      latestHistoryId = String(result.payload.historyId);
    }
    pageToken = result.payload.nextPageToken;
    if (!pageToken) {
      break;
    }
  }
  return {stale: false, ids: [...new Set(ids)], latestHistoryId};
}

async function fallbackList({accessToken, banks, lastProcessedAt, fetchImpl}) {
  const parse = loadParse();
  const q = parse.gmailSearchQuery(banks, lastProcessedAt);
  const ids = [];
  let pageToken;
  for (;;) {
    const result = await listMessages({accessToken, q, pageToken, fetchImpl});
    if (!result.ok) {
      throw gmailListFailed();
    }
    ids.push(...((result.payload.messages || []).map((item) => item.id).filter(Boolean)));
    pageToken = result.payload.nextPageToken || null;
    if (!pageToken) {
      break;
    }
  }
  return {ids: [...new Set(ids)]};
}

async function runBackfillPage({
  db,
  uid,
  cursor,
  accessToken,
  banks,
  vendorTags,
  geminiKey,
  fetchImpl,
  nowMs,
  messageCap,
}) {
  if (!cursor.backfillAfterMs || cursor.backfillDone) {
    return {ran: false, created: 0, processed: 0};
  }
  const parse = loadParse();
  const q = parse.gmailSearchQuery(banks, cursor.backfillAfterMs);
  const listed = await listMessages({
    accessToken,
    q,
    pageToken: cursor.backfillPageToken || undefined,
    fetchImpl,
  });
  if (!listed.ok) {
    return {ran: true, created: 0, processed: 0};
  }
  const ids = ((listed.payload && listed.payload.messages) || []).map((item) => item.id).filter(Boolean)
    .slice(0, messageCap);
  let created = 0;
  for (const id of ids) {
    const result = await ingestMessageById({
      db,
      uid,
      id,
      accessToken,
      banks,
      vendorTags,
      geminiKey,
      fetchImpl,
      nowMs,
    });
    if (result && result.created) {
      created += 1;
    }
  }
  const nextToken = listed.payload && listed.payload.nextPageToken;
  await db.doc(`users/${uid}/private/gmail`).set({
    backfillPageToken: nextToken || null,
    backfillDone: !nextToken,
    lastProcessedAt: nowMs,
  }, {merge: true});
  return {ran: true, created, processed: ids.length};
}

async function processConnectedUser({
  db,
  uid,
  accessToken,
  geminiKey,
  fetchImpl,
  nowMs = Date.now(),
  messageCap = 50,
}) {
  const cursor = await readCursor(db, uid);
  if (!cursor || cursor.status !== 'connected') {
    return {processed: 0, skipped: true};
  }
  const banks = await loadUserBanks(db, uid);
  const vendorTags = await loadVendorTags(db, uid);
  const backfill = await runBackfillPage({
    db,
    uid,
    cursor,
    accessToken,
    banks,
    vendorTags,
    geminiKey,
    fetchImpl,
    nowMs,
    messageCap,
  });
  const startedHistoryId = cursor.historyId;
  let messageIds = [];
  let nextHistoryId = startedHistoryId;
  if (startedHistoryId) {
    const history = await collectHistoryIds({
      accessToken,
      startHistoryId: startedHistoryId,
      fetchImpl,
    });
    if (history.stale) {
      const listed = await fallbackList({
        accessToken,
        banks,
        lastProcessedAt: cursor.lastProcessedAt,
        fetchImpl,
      });
      messageIds = listed.ids;
      const profile = await getProfile({accessToken, fetchImpl});
      if (!profile.ok) {
        throw gmailListFailed();
      }
      nextHistoryId = profile.payload.historyId ? String(profile.payload.historyId) : startedHistoryId;
    } else {
      messageIds = history.ids;
      nextHistoryId = history.latestHistoryId || startedHistoryId;
    }
  }
  let created = 0;
  for (const id of messageIds) {
    const result = await ingestMessageById({
      db,
      uid,
      id,
      accessToken,
      banks,
      vendorTags,
      geminiKey,
      fetchImpl,
      nowMs,
    });
    if (result && result.created) {
      created += 1;
    }
  }
  if (created > 0) {
    await applyDedupe(db, uid, nowMs);
  }
  if (nextHistoryId) {
    await advanceCursor(db, uid, startedHistoryId, nextHistoryId, {lastProcessedAt: nowMs});
  }
  const processed = messageIds.length + (backfill.processed || 0);
  const createdTotal = created + (backfill.created || 0);
  return {processed, created: createdTotal, noop: processed === 0};
}

module.exports = {
  processConnectedUser,
  parseAndSaveMessage,
  saveParsedExpense,
  applyDedupe,
  runBackfillPage,
};
