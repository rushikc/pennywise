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


export interface UserProfile {
  name: string;
  email: string;
  photoUrl: string | null;
  uid: string | null;
}

/**
 * Custom hook to handle authentication state and user profile
 * This is a mock implementation for development purposes
 */
export const useAuth = (redirectToLogin = true) => {

  // Mock user profile data
  const userProfile: UserProfile = {
    name: 'Test User',
    email: 'test@example.com',
    photoUrl: null,
    uid: 'test-uid-123'
  };

  // Mock sign out function
  const signOut = async () => {
    try {
      // In a real implementation, this would clear data and sign out
      console.log('Mock sign out called');
      return { success: true };
    } catch (error) {
      console.error('Error in mock sign out:', error);
      return {
        success: false,
        error: 'Mock sign out error'
      };
    }
  };

  return {
    currentUser: 'test',
    userProfile,
    isLoading: false,
    signOut
  };
};
