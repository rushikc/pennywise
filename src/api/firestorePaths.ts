/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

export const USERS_COLLECTION = 'users';
export const ALLOWED_USERS_COLLECTION = 'allowedUsers';
export const GMAIL_CONNECTIONS_COLLECTION = 'gmailConnections';

export type UserCollection = 'expense' | 'vendorTag' | 'budget' | 'config' | 'meta' | 'private';
export type ClientUserCollection = Exclude<UserCollection, 'private'>;

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
