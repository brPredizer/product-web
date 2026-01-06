"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthContext';
import { mockApi } from '@/api/mockClient';
import { pagesConfig, resolvePageKeyFromPath } from '@/pages.config';

export default function NavigationTracker() {
    const pathname = usePathname();
    const { isAuthenticated } = useAuth();
    const { Pages, mainPage } = pagesConfig;
    const mainPageKey = mainPage ?? Object.keys(Pages)[0];

    useEffect(() => {
        const pageName = resolvePageKeyFromPath(pathname) || mainPageKey;

        if (isAuthenticated && pageName) {
            mockApi.appLogs.logUserInApp(pageName).catch(() => {
                // Ignore logging failures to avoid breaking navigation
            });
        }
    }, [pathname, isAuthenticated, mainPageKey]);

    return null;
}