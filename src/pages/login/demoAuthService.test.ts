/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

jest.mock('../../utility/buildMode', () => ({
  IS_DEMO_BUILD: true,
}));

import {AuthService} from './AuthService';

describe('AuthService demo implementation', () => {
  it('reports a signed-out user', async () => {
    const user = await new Promise((resolve) => {
      const unsubscribe = AuthService.onAuthStateChanged((next) => {
        resolve(next);
        unsubscribe();
      });
    });
    expect(user).toBeNull();
  });

  it('rejects Google sign-in', async () => {
    await expect(AuthService.signInWithGoogle()).rejects.toThrow(
      'Sign-in is disabled in the demo',
    );
  });

  it('resolves sign-out', async () => {
    await expect(AuthService.signOut()).resolves.toBeUndefined();
  });
});
