/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {signInWithEmailAndPassword} from 'firebase/auth';
import {getFirebaseAuth} from './firebaseConfig';

export interface PennywiseE2EHooks {
  /** Signs in an emulator user created by tests/fixtures/seedEmulator.ts. */
  signIn: (email: string, password: string) => Promise<string>;
}

declare global {
  interface Window {
    __pennywiseE2E?: PennywiseE2EHooks;
  }
}

/** Only loaded by e2e builds (see src/index.tsx); never part of production bundles. */
export function installE2EHooks(): void {
  window.__pennywiseE2E = {
    signIn: async (email, password) => {
      const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
      return credential.user.uid;
    },
  };
}
