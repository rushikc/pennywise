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
  const ref = expenseRef(db, uid, messageId);
  const existing = await ref.get();
  if (existing.exists) {
    return {created: false};
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
  await ref.set(expense);
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
  const result = await listMessages({accessToken, q, fetchImpl});
  if (!result.ok) {
    return {ids: [], pageToken: null};
  }
  const ids = (result.payload.messages || []).map((item) => item.id).filter(Boolean);
  return {ids, pageToken: result.payload.nextPageToken || null};
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
    const got = await getMessage({accessToken, id, fetchImpl});
    if (!got.ok) {
      continue;
    }
    const result = await parseAndSaveMessage({
      db,
      uid,
      message: got.payload,
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
      nextHistoryId = profile.payload.historyId ? String(profile.payload.historyId) : startedHistoryId;
    } else {
      messageIds = history.ids;
      nextHistoryId = history.latestHistoryId || startedHistoryId;
    }
  }
  const limited = messageIds.slice(0, messageCap);
  let created = 0;
  for (const id of limited) {
    const got = await getMessage({accessToken, id, fetchImpl});
    if (!got.ok) {
      continue;
    }
    const result = await parseAndSaveMessage({
      db,
      uid,
      message: got.payload,
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
  const processed = limited.length + (backfill.processed || 0);
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
