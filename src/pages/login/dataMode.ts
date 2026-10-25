/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {IS_DEMO_BUILD} from '../../utility/buildMode';
import {profileProbeSegments} from '../../api/firestorePaths';

export type DataMode = 'demo' | 'live' | 'checking';

let dataMode: DataMode = (__DEMO_BUILD__ || IS_DEMO_BUILD) ? 'demo' : 'checking';

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

const probeLiveFirestore = async (uid: string): Promise<'demo' | 'live'> => {
  if (__DEMO_BUILD__) {
    return 'demo';
  }
  const {getApp} = await import('firebase/app');
  const {doc, getDoc, getFirestore} = await import('firebase/firestore/lite');
  try {
    await getDoc(doc(getFirestore(getApp()), ...profileProbeSegments(uid)));
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

export const probeFirestoreAccess = async (uid: string): Promise<'demo' | 'live'> => {
  if (__DEMO_BUILD__ || IS_DEMO_BUILD) {
    return 'demo';
  }
  return probeLiveFirestore(uid);
};

export const resolveModeForAuth = async (
  user: {uid: string} | null,
): Promise<'demo' | 'live'> => {
  if (__DEMO_BUILD__ || IS_DEMO_BUILD || !user) {
    setDataMode('demo');
    return 'demo';
  }
  setDataMode('checking');
  const mode = await probeFirestoreAccess(user.uid);
  setDataMode(mode);
  return mode;
};
