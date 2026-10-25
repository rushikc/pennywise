/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {initializeApp, type FirebaseApp} from 'firebase/app';
import {getAuth, GoogleAuthProvider, type Auth} from 'firebase/auth';
import {firebaseConfig} from './firebase-public';
import {IS_DEMO_BUILD} from '../utility/buildMode';

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let googleProvider: GoogleAuthProvider | undefined;

const assertLiveBuild = (): void => {
  if (IS_DEMO_BUILD) {
    throw new Error('Firebase is disabled in the demo build');
  }
};

export const getFirebaseApp = (): FirebaseApp => {
  assertLiveBuild();
  if (!app) {
    app = initializeApp(firebaseConfig);
  }
  return app;
};

export const getFirebaseAuth = (): Auth => {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
};

export const getGoogleProvider = (): GoogleAuthProvider => {
  assertLiveBuild();
  if (!googleProvider) {
    googleProvider = new GoogleAuthProvider();
  }
  return googleProvider;
};
