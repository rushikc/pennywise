/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import type {FirebaseApp} from 'firebase/app';
import {connectAuthEmulator, getAuth} from 'firebase/auth';
import {connectFirestoreEmulator, getFirestore} from 'firebase/firestore/lite';

/** Ports match firebase.json `emulators`. Only used when built with `vite --mode e2e`. */
export const E2E_EMULATOR_HOST = '127.0.0.1';
export const E2E_FIRESTORE_PORT = 8080;
export const E2E_AUTH_PORT = 9099;

const connected = new WeakSet<FirebaseApp>();

/**
 * Points Auth and the lite Firestore SDK at the local emulators. A no-op (and dead code)
 * outside e2e builds. Must run before the first Firestore request on this app.
 */
export function connectEmulators(app: FirebaseApp): void {
  if (!__E2E_EMULATORS__ || connected.has(app)) {
    return;
  }
  connected.add(app);
  connectAuthEmulator(getAuth(app), `http://${E2E_EMULATOR_HOST}:${E2E_AUTH_PORT}`, {disableWarnings: true});
  connectFirestoreEmulator(getFirestore(app), E2E_EMULATOR_HOST, E2E_FIRESTORE_PORT);
}

type FullFirestoreModule = {
  connectFirestoreEmulator: (db: never, host: string, port: number) => void;
};

const connectedFull = new WeakSet<object>();

/** Same as connectEmulators, for the lazily loaded full SDK used by transactions. */
export function connectFullFirestoreEmulator(firestore: FullFirestoreModule, db: object): void {
  if (!__E2E_EMULATORS__ || connectedFull.has(db)) {
    return;
  }
  connectedFull.add(db);
  firestore.connectFirestoreEmulator(db as never, E2E_EMULATOR_HOST, E2E_FIRESTORE_PORT);
}
