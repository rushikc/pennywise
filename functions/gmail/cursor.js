/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

function gmailPrivateRef(db, uid) {
  return db.doc(`users/${uid}/private/gmail`);
}

async function readCursor(db, uid) {
  const snap = await gmailPrivateRef(db, uid).get();
  return snap.exists ? snap.data() : null;
}

async function advanceCursor(db, uid, expectedHistoryId, nextHistoryId, extra = {}) {
  const ref = gmailPrivateRef(db, uid);
  return db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    const current = snap.exists ? String(snap.data().historyId || '') : '';
    if (expectedHistoryId != null && current !== String(expectedHistoryId)) {
      return {advanced: false, current};
    }
    transaction.set(ref, {
      historyId: String(nextHistoryId),
      ...extra,
    }, {merge: true});
    return {advanced: true, current: String(nextHistoryId)};
  });
}

module.exports = {
  gmailPrivateRef,
  readCursor,
  advanceCursor,
};
