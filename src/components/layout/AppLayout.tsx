"use client";

import React, { isValidElement, ReactElement, ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

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

  const footerVariant = currentPageName === 'Explore' ? 'compact' : 'default';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        currentPage={currentPageName}
        user={user}
        walletAvailableBalance={walletAvailableBalance}
        onLogout={handleLogout}
      />
      <main className="flex-1">
        {content}
      </main>
      <Footer variant={footerVariant} />
    </div>
  );
}
