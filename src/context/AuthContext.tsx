"use client";

import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import { authClient as authClientImport } from '@/app/api/auth';
import { walletClient as walletClientImport } from '@/app/api/wallet';
import { mockPublicSettings as mockPublicSettingsImport } from '@/app/api/mockClient';

// Relax external imports typing for initial conversion
const authClient: any = authClientImport as any;
const walletClient: any = walletClientImport as any;
const mockPublicSettings: any = mockPublicSettingsImport as any;

interface AuthContextValue {
  user?: any | null;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  isLoadingPublicSettings: boolean;
  authError?: any | null;
  appPublicSettings?: any;
  walletAvailableBalance: number;
  logout: (shouldRedirect?: boolean) => Promise<void>;
  refreshSession: () => Promise<void>;
  checkAppState: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState<boolean>(false);
  const [authError, setAuthError] = useState<any | null>(null);
  const [appPublicSettings, setAppPublicSettings] = useState<any>(mockPublicSettings);
  const [walletAvailableBalance, setWalletAvailableBalance] = useState<number>(0);

  const applySession = useCallback((session?: any) => {
    setUser(session?.user || null);
    setIsAuthenticated(Boolean(session?.user));
  }, []);

  const loadWalletBalance = useCallback(async () => {
    try {
      const balances = await walletClient.getBalances();
      const brlBalance = balances.find((item: any) => item.currency === 'BRL');
      setWalletAvailableBalance(brlBalance?.available ?? 0);
    } catch (error) {
      setWalletAvailableBalance(0);
    }
  }, []);

  const checkUserAuth = useCallback(async () => {
    setIsLoadingAuth(true);
    try {
      const session = authClient.getSession();
      if (session?.user) {
        applySession(session);
      }

      let profile = null;
      try {
        profile = await authClient.getManageInfo();
      } catch (e) {
        profile = null;
      }

      if (!profile) {
        try {
          profile = await authClient.getProfile();
        } catch (e) {
          profile = null;
        }
      }

      if (profile) {
        try {
          authClient.setSession({ user: profile });
        } catch (e) {}
        const updated = authClient.getSession();
        applySession(updated);
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
  }, [applySession, loadWalletBalance]);

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
      if (session?.user) {
        loadWalletBalance();
      } else {
        setWalletAvailableBalance(0);
      }
    };
    window.addEventListener('predizer:auth-changed', handler);
    return () => window.removeEventListener('predizer:auth-changed', handler);
  }, [applySession, loadWalletBalance]);

  const logout = async (shouldRedirect = true) => {
    await authClient.signOut();
    setUser(null);
    setIsAuthenticated(false);
    setWalletAvailableBalance(0);
    if (shouldRedirect && typeof window !== 'undefined') {
      window.location.href = '/sign-in';
    }
  };

  const value: AuthContextValue = {
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
