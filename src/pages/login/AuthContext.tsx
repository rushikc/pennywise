/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import React, {createContext, useContext, useEffect, useState} from 'react';
import type {User} from 'firebase/auth';
import {AuthService} from './AuthService';
import Loading from '../../components/Loading';
import {DataMode, getDataMode, resolveModeForAuth} from './dataMode';
import {IS_DEMO_BUILD} from '../../utility/buildMode';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  dataMode: DataMode;
  signInWithGoogle: () => Promise<User>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!(__DEMO_BUILD__ || IS_DEMO_BUILD));
  const [dataMode, setModeState] = useState<DataMode>(getDataMode);

  useEffect(() => {
    return AuthService.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (__DEMO_BUILD__ || IS_DEMO_BUILD) {
      return;
    }
    if (loading) {
      return;
    }
    let cancelled = false;
    if (currentUser) {
      setModeState('checking');
    }
    void resolveModeForAuth(currentUser).then((mode) => {
      if (!cancelled) {
        setModeState(mode);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [loading, currentUser]);

  const value = {
    currentUser,
    loading,
    dataMode,
    signInWithGoogle: AuthService.signInWithGoogle,
    signOut: AuthService.signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? <Loading/> : children}
    </AuthContext.Provider>
  );
};
