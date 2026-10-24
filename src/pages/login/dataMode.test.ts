/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const mockGetDoc = jest.fn();
const mockHandleApiError = jest.fn();
const mockShowAccessDeniedModal = jest.fn();

jest.mock('firebase/app', () => ({
  getApp: jest.fn(() => ({})),
}));

const mockDoc = jest.fn((_db: unknown, ...path: string[]) => ({path}));

jest.mock('firebase/firestore/lite', () => ({
  getFirestore: jest.fn(() => ({})),
  doc: (...args: unknown[]) => mockDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
}));

jest.mock('../../firebase/firebaseConfig', () => ({
  auth: {currentUser: null},
}));

jest.mock('../../components/ErrorHandlers', () => ({
  ErrorHandlers: {
    handleApiError: (...args: unknown[]) => mockHandleApiError(...args),
    showAccessDeniedModal: (...args: unknown[]) => mockShowAccessDeniedModal(...args),
  },
}));

import {getDataMode, resolveModeForAuth, setDataMode} from './dataMode';

describe('dataMode', () => {
  beforeEach(() => {
    mockGetDoc.mockReset();
    mockDoc.mockClear();
    mockHandleApiError.mockReset();
    mockShowAccessDeniedModal.mockReset();
    setDataMode('checking');
  });

  it('resolves to demo without a probe when there is no user', async () => {
    const mode = await resolveModeForAuth(null);
    expect(mode).toBe('demo');
    expect(getDataMode()).toBe('demo');
    expect(mockGetDoc).not.toHaveBeenCalled();
  });

  it('resolves to live when the probe succeeds', async () => {
    mockGetDoc.mockResolvedValue({exists: () => false});
    const mode = await resolveModeForAuth({uid: 'user-1'});
    expect(mode).toBe('live');
    expect(mockGetDoc).toHaveBeenCalledTimes(1);
    expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'users', 'user-1', 'meta', 'profile');
  });

  it.each(['permission-denied', 'unauthenticated', 'firestore/permission-denied'])(
    'resolves to demo when the probe fails with %s',
    async (code) => {
      mockGetDoc.mockRejectedValue({code});
      const mode = await resolveModeForAuth({uid: 'user-1'});
      expect(mode).toBe('demo');
    },
  );

  it.each(['unavailable', 'deadline-exceeded'])(
    'resolves to live when the probe fails with %s',
    async (code) => {
      mockGetDoc.mockRejectedValue({code});
      const mode = await resolveModeForAuth({uid: 'user-1'});
      expect(mode).toBe('live');
    },
  );

  it('resolves to live on a network error', async () => {
    mockGetDoc.mockRejectedValue(new TypeError('Failed to fetch'));
    const mode = await resolveModeForAuth({uid: 'user-1'});
    expect(mode).toBe('live');
  });

  it('re-runs the probe when the signed-in user changes', async () => {
    mockGetDoc.mockResolvedValue({});
    await resolveModeForAuth({uid: 'user-1'});
    await resolveModeForAuth({uid: 'user-2'});
    expect(mockGetDoc).toHaveBeenCalledTimes(2);
  });

  it('never opens the access modal from the probe', async () => {
    mockGetDoc.mockRejectedValue({code: 'permission-denied'});
    await resolveModeForAuth({uid: 'user-1'});
    expect(mockHandleApiError).not.toHaveBeenCalled();
    expect(mockShowAccessDeniedModal).not.toHaveBeenCalled();
  });
});
