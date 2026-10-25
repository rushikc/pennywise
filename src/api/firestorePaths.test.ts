/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const mockAuth = {currentUser: null as {uid: string} | null};

jest.mock('../firebase/firebaseConfig', () => ({
  getFirebaseAuth: () => mockAuth,
}));

import {currentUid} from './liveCurrentUid';
import {
  indexedDbName,
  profileProbeSegments,
  userCollectionSegments,
  userDocSegments,
} from './firestorePaths';

describe('firestorePaths', () => {
  beforeEach(() => {
    mockAuth.currentUser = null;
  });

  it('builds per-user collection and document segments', () => {
    expect(userCollectionSegments('abc', 'expense')).toEqual(['users', 'abc', 'expense']);
    expect(userDocSegments('abc', 'config', 'tags')).toEqual(['users', 'abc', 'config', 'tags']);
    expect(profileProbeSegments('abc')).toEqual(['users', 'abc', 'meta', 'profile']);
  });

  it('namespaces IndexedDB by uid', () => {
    expect(indexedDbName('abc')).toBe('Finance-abc');
  });

  it('returns the signed-in uid', () => {
    mockAuth.currentUser = {uid: 'abc'};
    expect(currentUid()).toBe('abc');
  });

  it('throws unauthenticated when there is no user', () => {
    expect(() => currentUid()).toThrow('unauthenticated');
    try {
      currentUid();
    } catch (error) {
      expect((error as {code?: string}).code).toBe('unauthenticated');
    }
  });
});
