/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {onAuthStateChanged, signInWithPopup, signOut, type User} from 'firebase/auth';
import {getFirebaseAuth, getGoogleProvider} from '../../firebase/firebaseConfig';
import {FinanceIndexDB} from '../../api/FinanceIndexDB';

export const liveAuthService = {
  signInWithGoogle: async (): Promise<User> => {
    try {
      const result = await signInWithPopup(getFirebaseAuth(), getGoogleProvider());
      return result.user;
    } catch (error) {
      console.error('Error signing in with Google', error);
      throw error;
    }
  },

  signOut: async (): Promise<void> => {
    try {
      await FinanceIndexDB.clearIndexedDBData();
      await signOut(getFirebaseAuth());
    } catch (error) {
      console.error('Error signing out', error);
      throw error;
    }
  },

  getCurrentUser: (): User | null => {
    return getFirebaseAuth().currentUser;
  },

  onAuthStateChanged: (callback: (user: User | null) => void): (() => void) => {
    return onAuthStateChanged(getFirebaseAuth(), callback);
  },
};
