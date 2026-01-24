'use client';

import React, { ReactNode, useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { queryClientInstance } from '@/lib/query-client';
import NavigationTracker from '@/lib/NavigationTracker';
import { Toaster } from '@/components/ui/toaster';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onWheel = (e: WheelEvent) => {
      try {
        const active = document.activeElement as HTMLElement | null;
        if (active && active.tagName === 'INPUT' && (active as HTMLInputElement).type === 'number') {
          e.preventDefault();
        }
      } catch (err) {
        // ignore
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      try {
        const target = e.target as HTMLElement | null;
        if (target && target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'number') {
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
          }
        }
      } catch (err) {
        // ignore
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <NavigationTracker />
        {children}
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}
