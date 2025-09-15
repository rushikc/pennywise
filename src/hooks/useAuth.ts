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

import {useEffect, useState} from 'react';
import {onAuthStateChanged, User} from 'firebase/auth';
import {auth} from '../firebase/firebaseConfig';
import {useNavigate} from 'react-router-dom';
import {FinanceIndexDB} from '../api/FinanceIndexDB';

export interface UserProfile {
  name: string;
  email: string;
  photoUrl: string | null;
  uid: string | null;
}

/**
 * Custom hook to handle authentication state and user profile
 */
export const useAuth = (redirectToLogin = true) => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Loading...',
    email: 'Loading...',
    photoUrl: null,
    uid: null
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsLoading(false);

      if (user) {
        // User is signed in - enhance the profile image quality
        const photoUrl = user.photoURL;

        // if (photoUrl && photoUrl.includes('googleusercontent.com')) {
        //   photoUrl = photoUrl.replace(/=s\d+-c/, '=s400-c');
        // }

        setUserProfile({
          name: user.displayName || 'User',
          email: user.email || 'No email',
          photoUrl: photoUrl,
          uid: user.uid
        });
      } else if (redirectToLogin) {
        // User is signed out, redirect if needed
        setUserProfile({
          name: 'Not signed in',
          email: 'Please sign in',
          photoUrl: null,
          uid: null
        });
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate, redirectToLogin]);

  // Sign out function
  const signOut = async () => {
    try {
      // Clear IndexedDB data before signing out using the method from FinanceIndexDB
      await FinanceIndexDB.clearIndexedDBData();
      FinanceIndexDB.initDB();
      // Then sign out from Firebase
      await auth.signOut();
      return {success: true};
    } catch (error) {
      console.error('Error signing out:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during sign out'
      };
    }
  };

  return {currentUser, userProfile, isLoading, signOut};
};
