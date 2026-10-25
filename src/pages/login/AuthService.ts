/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import type {User} from 'firebase/auth';
import {IS_DEMO_BUILD} from '../../utility/buildMode';
import {demoAuthService} from './demoAuthService';

type AuthServiceApi = {
  signInWithGoogle: () => Promise<User>;
  signOut: () => Promise<void>;
  getCurrentUser: () => User | null;
  onAuthStateChanged: (callback: (user: User | null) => void) => () => void;
};

const loadLiveAuthService = () => {
  if (__DEMO_BUILD__) {
    return Promise.resolve({liveAuthService: demoAuthService});
  }
  return import('./liveAuthService');
};

const liveAuthServiceProxy: AuthServiceApi = {
  signInWithGoogle: async () => {
    const {liveAuthService} = await loadLiveAuthService();
    return liveAuthService.signInWithGoogle();
  },
  signOut: async () => {
    const {liveAuthService} = await loadLiveAuthService();
    return liveAuthService.signOut();
  },
  getCurrentUser: () => {
    return null;
  },
  onAuthStateChanged: (callback) => {
    let unsubscribe = (): void => undefined;
    let cancelled = false;
    void loadLiveAuthService().then(({liveAuthService}) => {
      if (!cancelled) {
        unsubscribe = liveAuthService.onAuthStateChanged(callback);
      }
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  },
};

export const AuthService: AuthServiceApi = (__DEMO_BUILD__ || IS_DEMO_BUILD)
  ? demoAuthService
  : liveAuthServiceProxy;
