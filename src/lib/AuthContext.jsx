"use client";

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { authClient } from '@/api/auth';
import { walletClient } from '@/api/wallet';
import { mockPublicSettings } from '@/api/mockClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(mockPublicSettings);
  const [walletAvailableBalance, setWalletAvailableBalance] = useState(0);

  const applySession = useCallback((session) => {
    setUser(session?.user || null);
    setIsAuthenticated(Boolean(session?.accessToken && session?.user));
  }, []);

  const loadWalletBalance = useCallback(async () => {
    try {
      const balances = await walletClient.getBalances();
      const brlBalance = balances.find((item) => item.currency === 'BRL');
      setWalletAvailableBalance(brlBalance?.available ?? 0);
    } catch (error) {
      setWalletAvailableBalance(0);
    }
  }, []);

  const checkUserAuth = useCallback(async () => {
    setIsLoadingAuth(true);
    try {
      const session = authClient.getSession();
      if (session?.accessToken) {
        applySession(session);
        const profile = await authClient.getProfile();
        if (profile) {
          applySession({ ...session, user: profile });
        }
        await loadWalletBalance();
        setAuthError(null);
        return;
      }
      if (session?.refreshToken) {
        const refreshed = await authClient.refresh();
        applySession(refreshed);
        const profile = await authClient.getProfile();
        if (profile) {
          applySession({ ...refreshed, user: profile });
        }
        await loadWalletBalance();
        setAuthError(null);
        return;
      }
      setUser(null);
      setIsAuthenticated(false);
      setWalletAvailableBalance(0);
      setAuthError({
        type: 'auth_required',
        message: 'Login required to continue.'
      });
    } catch (error) {
      console.error('User auth check failed:', error);
      authClient.clearSession();
      setUser(null);
      setIsAuthenticated(false);
      setWalletAvailableBalance(0);
      setAuthError({
        type: 'auth_required',
        message: 'Login required to continue.'
      });
    } finally {
      setIsLoadingAuth(false);
    }
  }, [applySession]);

  const checkAppState = useCallback(async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);
      setAppPublicSettings(mockPublicSettings);
      await checkUserAuth();
    } finally {
      setIsLoadingPublicSettings(false);
    }
  }, [checkUserAuth]);

  useEffect(() => {
    checkAppState();
  }, [checkAppState]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handler = () => {
      const session = authClient.getSession();
      applySession(session);
      if (session?.accessToken) {
        loadWalletBalance();
      } else {
        setWalletAvailableBalance(0);
      }
    };
    window.addEventListener('predictx:auth-changed', handler);
    return () => window.removeEventListener('predictx:auth-changed', handler);
  }, [applySession, loadWalletBalance]);

  const logout = async (shouldRedirect = true) => {
    await authClient.logout();
    setUser(null);
    setIsAuthenticated(false);
    setWalletAvailableBalance(0);
    if (shouldRedirect && typeof window !== 'undefined') {
      window.location.href = '/Login';
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      walletAvailableBalance,
      logout,
      refreshSession: checkUserAuth,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

