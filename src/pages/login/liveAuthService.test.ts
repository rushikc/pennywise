/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const mockSignOut = jest.fn().mockResolvedValue(undefined);
const mockClear = jest.fn().mockResolvedValue(undefined);

jest.mock('firebase/auth', () => ({
  signOut: (...args: unknown[]) => mockSignOut(...args),
  signInWithPopup: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

jest.mock('../../firebase/firebaseConfig', () => ({
  getFirebaseAuth: () => ({currentUser: null}),
  getGoogleProvider: () => ({}),
}));

jest.mock('../../api/FinanceIndexDB', () => ({
  FinanceIndexDB: {
    clearIndexedDBData: (...args: unknown[]) => mockClear(...args),
  },
}));

import {liveAuthService} from './liveAuthService';

describe('liveAuthService.signOut', () => {
  beforeEach(() => {
    mockSignOut.mockClear();
    mockClear.mockClear();
  });

  it('clears IndexedDB before signing out', async () => {
    await liveAuthService.signOut();
    expect(mockClear).toHaveBeenCalledTimes(1);
    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(mockClear.mock.invocationCallOrder[0]).toBeLessThan(mockSignOut.mock.invocationCallOrder[0]);
  });
});
