"use client";

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { mockApi, mockPublicSettings } from '@/api/mockClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(mockPublicSettings);

  const checkUserAuth = useCallback(async () => {
    try {
      setIsLoadingAuth(true);
      const currentUser = await mockApi.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setAuthError(null);
      setIsLoadingAuth(false);
    } catch (error) {
      console.error('User auth check failed:', error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthError({
        type: error.status === 403 ? 'user_not_registered' : 'auth_required',
        message: 'Faça login para continuar'
      });
    }
  }, []);

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
      checkUserAuth();
    };
    window.addEventListener('predictx:auth-changed', handler);
    return () => window.removeEventListener('predictx:auth-changed', handler);
  }, [checkUserAuth]);

  const logout = async (shouldRedirect = true) => {
    await mockApi.auth.logout(window.location.href);
    setUser(null);
    setIsAuthenticated(false);
    if (shouldRedirect) {
      navigateToLogin();
    }
  };

  const navigateToLogin = async () => {
    try {
      const session = await mockApi.auth.redirectToLogin(window.location.href);
      setUser(session);
      setIsAuthenticated(true);
      setAuthError(null);
    } catch (error) {
      console.error('Failed to redirect to login:', error);
      setAuthError({
        type: 'auth_required',
        message: 'Não foi possível iniciar sessão'
      });
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
      logout,
      navigateToLogin,
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
