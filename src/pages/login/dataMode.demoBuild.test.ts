/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const mockGetDoc = jest.fn();

jest.mock('../../utility/buildMode', () => ({
  IS_DEMO_BUILD: true,
}));

jest.mock('firebase/app', () => ({
  getApp: jest.fn(() => {
    throw new Error('Firestore must not load in a demo build');
  }),
}));

jest.mock('firebase/firestore/lite', () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
}));

import {getDataMode, resolveModeForAuth} from './dataMode';

describe('dataMode demo build', () => {
  it('starts in demo and skips Firestore for signed-out and signed-in users', async () => {
    expect(getDataMode()).toBe('demo');
    expect(await resolveModeForAuth(null)).toBe('demo');
    expect(await resolveModeForAuth({uid: 'x'})).toBe('demo');
    expect(mockGetDoc).not.toHaveBeenCalled();
  });
});
