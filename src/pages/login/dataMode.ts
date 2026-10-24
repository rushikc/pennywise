/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {getApp} from 'firebase/app';
import {doc, getDoc, getFirestore} from 'firebase/firestore/lite';
import '../../firebase/firebaseConfig';

export type DataMode = 'demo' | 'live' | 'checking';

let dataMode: DataMode = 'checking';

export const getDataMode = (): DataMode => dataMode;

export const setDataMode = (mode: DataMode): void => {
  dataMode = mode;
};

const isDeniedCode = (code: unknown): boolean => {
  if (typeof code !== 'string') {
    return false;
  }
  return code.includes('permission-denied') || code.includes('unauthenticated');
};

export const probeFirestoreAccess = async (): Promise<'demo' | 'live'> => {
  try {
    await getDoc(doc(getFirestore(getApp()), 'config', 'darkMode'));
    return 'live';
  } catch (error) {
    const code = typeof error === 'object' && error !== null
      ? (error as {code?: unknown}).code
      : undefined;
    if (isDeniedCode(code)) {
      return 'demo';
    }
    return 'live';
  }
};

export const resolveModeForAuth = async (
  user: {uid: string} | null,
): Promise<'demo' | 'live'> => {
  if (!user) {
    setDataMode('demo');
    return 'demo';
  }
  setDataMode('checking');
  const mode = await probeFirestoreAccess();
  setDataMode(mode);
  return mode;
};
