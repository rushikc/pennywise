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

/*
This file contains the Firebase configuration for the application.
It uses environment variables to set the configuration values.

This configuration is intended for client-side use in a React application,
where Firebase services need to be initialized in the browser.
These configuration values are considered public information and do not
pose a security risk when exposed in client-side code.

Firebase enforces security through:
- Firebase Authentication rules
- Firestore/Database security rules
- Storage security rules
- Project-level API restrictions

For more information on Firebase configuration and security best practices:
- https://firebase.google.com/docs/web/setup
- https://firebase.google.com/docs/projects/api-keys
- https://firebase.google.com/docs/rules
*/

export const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || '',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.REACT_APP_FIREBASE_APP_ID || ''
};

console.log('Firebase config loaded:', firebaseConfig);
