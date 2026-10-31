/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

/**
 * Deterministic emulator seed shared by Playwright (global setup + per-test reseed) and
 * `npm run test:e2e:seed`. Refuses to run unless both emulator hosts are set, so it can
 * never touch a real Firebase project.
 */
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {getApps, initializeApp, type App} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore, type Firestore} from 'firebase-admin/firestore';
import {
  E2E_AUTH_HOST,
  E2E_FIRESTORE_HOST,
  E2E_NOW,
  E2E_PASSWORD,
  E2E_PROJECT_ID,
  E2E_WORKER_USERS,
  POPUP_USER_EMAIL,
  userForWorker,
} from './constants.ts';

// Resolved from the repo root: Playwright and the npm script both run from there.
const seedDir = path.resolve('tests/fixtures/seed');
const readSeed = <T>(name: string): T => JSON.parse(readFileSync(path.join(seedDir, name), 'utf8')) as T;

type SeedDoc = Record<string, unknown> & {id: string};
export const seed = {
  expenses: readSeed<SeedDoc[]>('expenses.json'),
  vendorTags: readSeed<SeedDoc[]>('vendorTags.json'),
  budgets: readSeed<SeedDoc[]>('budgets.json'),
  config: readSeed<Record<string, Record<string, unknown>>>('config.json'),
};

/** Aborts unless this process is explicitly pointed at the local emulators and demo project. */
export function assertEmulatorEnv(): void {
  const problems: string[] = [];
  if (process.env.FIRESTORE_EMULATOR_HOST !== E2E_FIRESTORE_HOST) problems.push('FIRESTORE_EMULATOR_HOST');
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST !== E2E_AUTH_HOST) problems.push('FIREBASE_AUTH_EMULATOR_HOST');
  if (process.env.GCLOUD_PROJECT !== E2E_PROJECT_ID) problems.push('GCLOUD_PROJECT');
  if (problems.length) {
    throw new Error(`Refusing to seed: ${problems.join(', ')} must point at the local emulator / ${E2E_PROJECT_ID}`);
  }
}

let app: App | undefined;
const adminApp = (): App => {
  assertEmulatorEnv();
  app ??= getApps().find((item) => item.name === 'e2e-seed') ?? initializeApp({projectId: E2E_PROJECT_ID}, 'e2e-seed');
  return app;
};
export const adminDb = (): Firestore => getFirestore(adminApp());
export const adminAuth = () => getAuth(adminApp());

const emulatorDelete = async (url: string): Promise<void> => {
  const res = await fetch(url, {method: 'DELETE'});
  if (!res.ok) {
    throw new Error(`Emulator reset failed (${res.status}) for ${url}`);
  }
};

/** Wipes every document and auth account in the demo project. */
export async function resetEmulators(): Promise<void> {
  assertEmulatorEnv();
  await emulatorDelete(`http://${E2E_FIRESTORE_HOST}/emulator/v1/projects/${E2E_PROJECT_ID}/databases/(default)/documents`);
  await emulatorDelete(`http://${E2E_AUTH_HOST}/emulator/v1/projects/${E2E_PROJECT_ID}/accounts`);
}

/** Creates the worker users (verified email + password) and allowlists them. */
export async function seedUsers(): Promise<void> {
  const auth = getAuth(adminApp());
  const db = adminDb();
  for (let index = 0; index < E2E_WORKER_USERS; index += 1) {
    const {uid, email} = userForWorker(index);
    await auth.createUser({uid, email, password: E2E_PASSWORD, emailVerified: true});
    await db.doc(`allowedUsers/${email.toLowerCase()}`).set({addedAt: E2E_NOW});
  }
  await db.doc(`allowedUsers/${POPUP_USER_EMAIL}`).set({addedAt: E2E_NOW});
}

/** Replaces one user's subtree with the fixture data. */
export async function seedUserData(uid: string): Promise<void> {
  const db = adminDb();
  const root = db.doc(`users/${uid}`);
  await db.recursiveDelete(root);
  const batch = db.batch();
  for (const {id, ...data} of seed.expenses) batch.set(root.collection('expense').doc(id), data);
  for (const {id, ...data} of seed.vendorTags) batch.set(root.collection('vendorTag').doc(id), data);
  for (const {id, ...data} of seed.budgets) batch.set(root.collection('budget').doc(id), data);
  for (const [key, data] of Object.entries(seed.config)) batch.set(root.collection('config').doc(key), data);
  batch.set(root.collection('meta').doc('profile'), {migratedAt: E2E_NOW});
  await batch.commit();
}

export async function seedAll(): Promise<void> {
  await resetEmulators();
  await seedUsers();
  for (let index = 0; index < E2E_WORKER_USERS; index += 1) {
    await seedUserData(userForWorker(index).uid);
  }
}

const isMain = /seedEmulator\.ts$/.test(process.argv[1] ?? '');
if (isMain) {
  seedAll()
    .then(() => console.log(`Seeded ${E2E_WORKER_USERS} users with ${seed.expenses.length} expenses each.`))
    .catch((error: unknown) => {
      console.error(error);
      process.exit(1);
    });
}
