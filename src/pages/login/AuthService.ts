/*
Copyright (C) 2025 <rushikc> <rushikc.dev@gmail.com>

This program is free software; you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the
Free Software Foundation; version 3 of the License.

This program is distributed in the hope that it will be useful, but
WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details, or get a copy at
<https://www.gnu.org/licenses/gpl-3.0.txt>.
*/

import {onAuthStateChanged, signInWithPopup, signOut, User} from 'firebase/auth';
import {auth, googleProvider} from '../../firebase/firebaseConfig';
import {FinanceIndexDB} from '../../api/FinanceIndexDB';

export const AuthService = {
  // Sign in with Google
  signInWithGoogle: async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      console.error('Error signing in with Google', error);
      throw error;
    }
  },

  // Sign out
  signOut: async () => {
    try {
      await FinanceIndexDB.clearIndexedDBData();
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out', error);
      throw error;
    }
  },

  // Get current user
  getCurrentUser: () => {
    return auth.currentUser;
  },

  // Listen to auth state changes
  onAuthStateChanged: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
  }
};
