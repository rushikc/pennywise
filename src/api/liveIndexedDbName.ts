/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {getFirebaseAuth} from '../firebase/firebaseConfig';
import {indexedDbName} from './firestorePaths';

export const liveIndexedDbName = (): string => {
  const uid = getFirebaseAuth().currentUser?.uid;
  return uid ? indexedDbName(uid) : 'Finance';
};
