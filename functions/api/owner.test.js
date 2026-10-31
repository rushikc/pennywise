/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {describe, it} = require('node:test');
const assert = require('node:assert/strict');
const {createOwnerResolver} = require('./owner');

function memoryDb(allowedEmails) {
  const allowed = new Set(allowedEmails);
  return {
    doc(path) {
      return {
        path,
        async get() {
          const prefix = 'allowedUsers/';
          if (path.startsWith(prefix)) {
            return {exists: allowed.has(path.slice(prefix.length)), data: () => ({})};
          }
          return {exists: false, data: () => undefined};
        },
      };
    },
  };
}

function authStub(users) {
  return {
    async getUserByEmail(email) {
      const user = users[email];
      if (!user) {
        const err = new Error('not found');
        err.code = 'auth/user-not-found';
        throw err;
      }
      return user;
    },
  };
}

describe('createOwnerResolver', () => {
  it('trims and lowercases the configured email', async () => {
    let lookedUp;
    const auth = {
      async getUserByEmail(email) {
        lookedUp = email;
        return {uid: 'uid-1', emailVerified: true, disabled: false};
      },
    };
    const resolver = createOwnerResolver({
      db: memoryDb(['owner@example.com']),
      auth,
      ownerEmail: '  Owner@Example.com  ',
      now: () => 1_000,
    });
    const result = await resolver.resolveOwner();
    assert.equal(result.ok, true);
    assert.equal(result.uid, 'uid-1');
    assert.equal(lookedUp, 'owner@example.com');
  });

  it('returns 503 when the owner is not allowlisted', async () => {
    const warnings = [];
    const resolver = createOwnerResolver({
      db: memoryDb([]),
      auth: authStub({}),
      ownerEmail: 'owner@example.com',
      now: () => 1_000,
      logger: {warn: (entry) => warnings.push(entry)},
    });
    const result = await resolver.resolveOwner();
    assert.equal(result.status, 503);
    assert.equal(result.code, 'owner_unavailable');
    assert.equal(warnings[0].reason, 'not_allowlisted');
    assert.equal(JSON.stringify(warnings).includes('owner@example.com'), false);
  });

  it('returns 503 when the account is unverified or disabled', async () => {
    const unverified = createOwnerResolver({
      db: memoryDb(['owner@example.com']),
      auth: authStub({'owner@example.com': {uid: 'u', emailVerified: false, disabled: false}}),
      ownerEmail: 'owner@example.com',
      now: () => 1_000,
      logger: {warn() {}},
    });
    assert.equal((await unverified.resolveOwner()).status, 503);

    const disabled = createOwnerResolver({
      db: memoryDb(['owner@example.com']),
      auth: authStub({'owner@example.com': {uid: 'u', emailVerified: true, disabled: true}}),
      ownerEmail: 'owner@example.com',
      now: () => 1_000,
      logger: {warn() {}},
    });
    assert.equal((await disabled.resolveOwner()).status, 503);
  });

  it('caches a successful uid for five minutes', async () => {
    let lookups = 0;
    const auth = {
      async getUserByEmail() {
        lookups += 1;
        return {uid: 'uid-1', emailVerified: true, disabled: false};
      },
    };
    let nowMs = 1_000;
    const resolver = createOwnerResolver({
      db: memoryDb(['owner@example.com']),
      auth,
      ownerEmail: 'owner@example.com',
      now: () => nowMs,
    });
    assert.equal((await resolver.resolveOwner()).uid, 'uid-1');
    nowMs = 1_000 + (5 * 60 * 1000) - 1;
    assert.equal((await resolver.resolveOwner()).uid, 'uid-1');
    assert.equal(lookups, 1);
    nowMs = 1_000 + (5 * 60 * 1000) + 1;
    assert.equal((await resolver.resolveOwner()).uid, 'uid-1');
    assert.equal(lookups, 2);
  });

  it('does not read uid or email from a request object', async () => {
    const request = {
      body: {uid: 'attacker', email: 'attacker@example.com'},
      headers: {authorization: 'Bearer nope', 'x-user-email': 'attacker@example.com'},
    };
    const resolver = createOwnerResolver({
      db: memoryDb(['owner@example.com']),
      auth: authStub({'owner@example.com': {uid: 'uid-owner', emailVerified: true, disabled: false}}),
      ownerEmail: 'owner@example.com',
      now: () => 1_000,
    });
    const result = await resolver.resolveOwner(request);
    assert.equal(result.uid, 'uid-owner');
  });
});
