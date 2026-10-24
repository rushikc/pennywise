/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {getApp} from 'firebase/app';
import {getFunctions, httpsCallable} from 'firebase/functions';
import {doc, getDoc, getFirestore} from 'firebase/firestore/lite';
import gcpNames from '../../shared/gcpNames.json';

export type GmailStatus = 'connected' | 'disconnected' | 'unknown';

export type GmailStatusDoc = {
  status: GmailStatus;
  email: string | null;
  lastError: string | null;
};

const GIS_SRC = 'https://accounts.google.com/gsi/client';

function oauthClientId(): string {
  return process.env.REACT_APP_GOOGLE_OAUTH_CLIENT_ID || '';
}

function functionsClient() {
  return getFunctions(getApp(), gcpNames.functionsRegion);
}

export async function readGmailStatus(uid: string): Promise<GmailStatusDoc> {
  const snap = await getDoc(doc(getFirestore(getApp()), 'users', uid, 'meta', 'gmailStatus'));
  if (!snap.exists()) {
    return {status: 'unknown', email: null, lastError: null};
  }
  const data = snap.data() as Partial<GmailStatusDoc>;
  const status = data.status === 'connected' || data.status === 'disconnected'
    ? data.status
    : 'unknown';
  return {
    status,
    email: typeof data.email === 'string' ? data.email : null,
    lastError: typeof data.lastError === 'string' ? data.lastError : null,
  };
}

export function loadGisScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }
  if (window.google?.accounts?.oauth2) {
    return Promise.resolve();
  }
  const existing = document.querySelector(`script[src="${GIS_SRC}"]`);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('gis_load_failed')));
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GIS_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('gis_load_failed'));
    document.head.appendChild(script);
  });
}

export function requestGmailCode(): Promise<string> {
  const clientId = oauthClientId();
  if (!clientId) {
    return Promise.reject(new Error('missing_oauth_client_id'));
  }
  return new Promise((resolve, reject) => {
    const client = window.google?.accounts?.oauth2.initCodeClient({
      client_id: clientId,
      scope: gcpNames.gmailReadonlyScope,
      ux_mode: 'popup',
      access_type: 'offline',
      prompt: 'consent',
      callback: (response) => {
        if (response.error || !response.code) {
          reject(new Error(response.error || 'gmail_code_missing'));
          return;
        }
        resolve(response.code);
      },
    });
    if (!client) {
      reject(new Error('gis_unavailable'));
      return;
    }
    client.requestCode();
  });
}

export async function connectGmail(code: string): Promise<{status: string; email?: string}> {
  const callable = httpsCallable<{code: string}, {status: string; email?: string}>(
    functionsClient(),
    'connectGmail',
  );
  const result = await callable({code});
  return result.data;
}

export async function disconnectGmail(): Promise<{status: string}> {
  const callable = httpsCallable<Record<string, never>, {status: string}>(
    functionsClient(),
    'disconnectGmail',
  );
  const result = await callable({});
  return result.data;
}
