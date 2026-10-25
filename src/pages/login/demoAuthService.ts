/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import type {User} from 'firebase/auth';

export const demoAuthService = {
  signInWithGoogle: async (): Promise<User> => {
    throw new Error('Sign-in is disabled in the demo');
  },

  signOut: async (): Promise<void> => {
    return;
  },

  getCurrentUser: (): User | null => null,

  onAuthStateChanged: (callback: (user: User | null) => void): (() => void) => {
    const timer = setTimeout(() => {
      callback(null);
    }, 0);
    return () => {
      clearTimeout(timer);
    };
  },
};
