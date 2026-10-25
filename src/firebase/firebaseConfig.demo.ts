/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const disabled = (): never => {
  throw new Error('Firebase is disabled in the demo build');
};

export const getFirebaseApp = disabled;
export const getFirebaseAuth = disabled;
export const getGoogleProvider = disabled;
