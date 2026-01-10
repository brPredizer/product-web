"use client";

import React, { isValidElement, ReactElement, ReactNode } from 'react';
import { useAuth } from '@/lib/AuthContext';
import Header from '@/components/layout/Header';

interface LayoutProps {
  children: ReactNode;
  currentPageName?: string;
}

export default function Layout({ children, currentPageName }: LayoutProps) {
  const { user, refreshSession, logout, walletAvailableBalance } = useAuth() as any;

  const handleLogout = async () => {
    await logout(true);
  };

  const content = isValidElement(children)
    ? React.cloneElement(children as ReactElement, { user, refreshUser: refreshSession })
    : children;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        currentPage={currentPageName}
        user={user}
        walletAvailableBalance={walletAvailableBalance}
        onLogout={handleLogout}
      />
      <main>
        {content}
      </main>
    </div>
  );
}
