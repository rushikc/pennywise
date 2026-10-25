/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {getFirebaseAuth} from '../firebase/firebaseConfig';

export function currentUid(): string {
  const uid = getFirebaseAuth().currentUser?.uid;
  if (!uid) {
    const err = new Error('unauthenticated') as Error & {code: string};
    err.code = 'unauthenticated';
    throw err;
  }
  return uid;
}
