/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {auth} from '../firebase/firebaseConfig';

export const USERS_COLLECTION = 'users';
export const ALLOWED_USERS_COLLECTION = 'allowedUsers';
export const GMAIL_CONNECTIONS_COLLECTION = 'gmailConnections';

export type UserCollection = 'expense' | 'vendorTag' | 'budget' | 'config' | 'meta' | 'private';

export function currentUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    const err = new Error('unauthenticated') as Error & {code: string};
    err.code = 'unauthenticated';
    throw err;
  }
  return uid;
}

export function userCollectionSegments(
  uid: string,
  collectionName: UserCollection,
): [string, string, string] {
  return [USERS_COLLECTION, uid, collectionName];
}

export function userDocSegments(
  uid: string,
  collectionName: UserCollection,
  docId: string,
): [string, string, string, string] {
  return [USERS_COLLECTION, uid, collectionName, docId];
}

export function profileProbeSegments(uid: string): [string, string, string, string] {
  return userDocSegments(uid, 'meta', 'profile');
}

export function indexedDbName(uid: string): string {
  return `Finance-${uid}`;
}
