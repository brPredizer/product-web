"use client";

import React, { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { mockApi as mockApiImport } from '@/app/api/mockClient';
import {
  pagesConfig,
  resolvePageKeyFromPath,
  PUBLIC_ROUTE_PREFIXES,
  PRIVATE_ROUTE_PREFIXES,
  ROUTES
} from '@/routes';

const mockApi: any = mockApiImport as any;

export default function NavigationTracker(): null {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, isLoadingAuth } = useAuth() as { isAuthenticated?: boolean; isLoadingAuth?: boolean };
  const { Pages, mainPage } = pagesConfig as any;
  const mainPageKey = mainPage ?? Object.keys(Pages)[0];

  const isPublicRoute = (path?: string | null): boolean => {
    if (!path) return true;
    const p = String(path).toLowerCase();

    if (PUBLIC_ROUTE_PREFIXES.some((prefix) => p === prefix || p.startsWith(`${prefix}/`))) {
      return true;
    }

    if (PRIVATE_ROUTE_PREFIXES.some((prefix) => p === prefix || p.startsWith(`${prefix}/`))) {
      return false;
    }

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
      const query = searchParams?.toString();
      const nextPath = query ? `${pathname}?${query}` : pathname;
      // Replace navigation to sign-in when user is not authenticated
      router.replace(`${ROUTES.signIn}?next=${encodeURIComponent(nextPath ?? '/')}`);
    }
  }, [pathname, searchParams, isAuthenticated, isLoadingAuth, router]);

  return null;
}
