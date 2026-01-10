"use client";

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';
import { mockApi as mockApiImport } from '@/api/mockClient';
import { pagesConfig, resolvePageKeyFromPath } from '@/pages.config';

const mockApi: any = mockApiImport as any;

export default function NavigationTracker(): null {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoadingAuth } = useAuth() as { isAuthenticated?: boolean; isLoadingAuth?: boolean };
  const { Pages, mainPage } = pagesConfig as any;
  const mainPageKey = mainPage ?? Object.keys(Pages)[0];

  const isPublicRoute = (path?: string | null): boolean => {
    if (!path) return true;
    const p = String(path).toLowerCase();

    const authPrefixes = [
      '/sign-in',
      '/sign-up',
      '/forgot-password',
      '/reset-password',
      '/confirm-email'
    ];
    if (authPrefixes.some((prefix) => p === prefix || p.startsWith(`${prefix}/`))) return true;

    const protectedPrefixes = [
      '/portfolio',
      '/wallet',
      '/account',
      '/admin',
      '/riskcontrols'
    ];
    if (protectedPrefixes.some((prefix) => p === prefix || p.startsWith(`${prefix}/`))) return false;

    return true;
  };

  useEffect(() => {
    const pageName = resolvePageKeyFromPath(pathname) || mainPageKey;

    if (isAuthenticated && pageName) {
      mockApi.appLogs?.logUserInApp(pageName).catch(() => {
        // Ignore logging failures to avoid breaking navigation
      });
    }
  }, [pathname, isAuthenticated, mainPageKey]);

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!isAuthenticated && !isPublicRoute(pathname)) {
      // Replace navigation to sign-in when user is not authenticated
      router.replace('/sign-in');
    }
  }, [pathname, isAuthenticated, isLoadingAuth, router]);

  return null;
}
