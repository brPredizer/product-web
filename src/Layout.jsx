"use client";

import React, { isValidElement } from 'react';
import { useAuth } from '@/lib/AuthContext';
import Header from '@/components/layout/Header';

export default function Layout({ children, currentPageName }) {
  const { user, refreshSession, logout, walletAvailableBalance } = useAuth();

  const handleLogout = async () => {
    await logout(true);
  };

  const content = isValidElement(children)
    ? React.cloneElement(children, { user, refreshUser: refreshSession })
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
