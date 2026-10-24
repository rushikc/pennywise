/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

function connectionEmailKey(email) {
  return String(email || '').trim().toLowerCase();
}

function connectedPrivateDoc({email, nowMs}) {
  return {
    email,
    connectedAt: nowMs,
    status: 'connected',
    historyId: null,
    watchExpiration: null,
    lastProcessedAt: null,
    lastError: null,
    backfillUntil: nowMs,
    backfillAfterMs: nowMs - 30 * 24 * 60 * 60 * 1000,
    backfillPageToken: null,
  };
}

function disconnectedPrivateDoc({email, lastError, nowMs}) {
  return {
    email: email || null,
    status: 'disconnected',
    historyId: null,
    watchExpiration: null,
    lastProcessedAt: nowMs,
    lastError: lastError || null,
  };
}

function publicStatusDoc(privateDoc) {
  return {
    status: privateDoc.status,
    email: privateDoc.email || null,
    lastError: privateDoc.lastError || null,
  };
}

function connectionIndexDoc({uid, status}) {
  return {uid, status};
}

async function writeConnectedState(db, {uid, email, nowMs}) {
  const privateDoc = connectedPrivateDoc({email, nowMs});
  const statusDoc = publicStatusDoc(privateDoc);
  const emailKey = connectionEmailKey(email);
  const privateRef = db.doc(`users/${uid}/private/gmail`);
  const statusRef = db.doc(`users/${uid}/meta/gmailStatus`);
  const connRef = db.doc(`gmailConnections/${emailKey}`);
  return db.runTransaction(async (transaction) => {
    const existing = await transaction.get(connRef);
    if (existing.exists) {
      const data = existing.data() || {};
      if (data.status === 'connected' && data.uid && data.uid !== uid) {
        const err = new Error('gmail_already_connected');
        err.code = 'already-exists';
        throw err;
      }
    }
    const currentPrivate = await transaction.get(privateRef);
    const oldEmail = currentPrivate.exists && currentPrivate.data() ?
      currentPrivate.data().email :
      null;
    const oldKey = oldEmail ? connectionEmailKey(oldEmail) : '';
    transaction.set(privateRef, privateDoc);
    transaction.set(statusRef, statusDoc);
    transaction.set(connRef, connectionIndexDoc({uid, status: 'connected'}));
    if (oldKey && oldKey !== emailKey) {
      transaction.set(
        db.doc(`gmailConnections/${oldKey}`),
        connectionIndexDoc({uid, status: 'disconnected'}),
      );
    }
    return {privateDoc, statusDoc};
  });
}

async function writeDisconnectedState(db, {uid, email, lastError, nowMs}) {
  const privateDoc = disconnectedPrivateDoc({email, lastError, nowMs});
  const statusDoc = publicStatusDoc(privateDoc);
  const batch = db.batch();
  batch.set(db.doc(`users/${uid}/private/gmail`), privateDoc, {merge: true});
  batch.set(db.doc(`users/${uid}/meta/gmailStatus`), statusDoc);
  if (email) {
    batch.set(
      db.doc(`gmailConnections/${connectionEmailKey(email)}`),
      connectionIndexDoc({uid, status: 'disconnected'}),
    );
  }
  await batch.commit();
  return {privateDoc, statusDoc};
}

async function assertAllowlisted(db, email) {
  if (!email) {
    return false;
  }
  const snap = await db.doc(`allowedUsers/${connectionEmailKey(email)}`).get();
  return snap.exists;
}

module.exports = {
  connectionEmailKey,
  connectedPrivateDoc,
  disconnectedPrivateDoc,
  publicStatusDoc,
  connectionIndexDoc,
  writeConnectedState,
  writeDisconnectedState,
  assertAllowlisted,
};
