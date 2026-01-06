"use client";

import React, { useState, useEffect, isValidElement } from 'react';
import { useRouter } from 'next/navigation';
import { mockApi } from '@/api/mockClient';
import Header from '@/components/layout/Header';

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    const handler = () => loadUser();
    window.addEventListener('predictx:auth-changed', handler);
    return () => window.removeEventListener('predictx:auth-changed', handler);
  }, []);

  const loadUser = async () => {
    try {
      const userData = await mockApi.auth.me();
      setUser(userData);
    } catch (error) {
      // User not logged in
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await mockApi.auth.logout('/Login');
    setUser(null);
    router.push('/Login');
  };

  const content = isValidElement(children)
    ? React.cloneElement(children, { user, refreshUser: loadUser })
    : children;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header 
        currentPage={currentPageName} 
        user={user} 
        onLogout={handleLogout}
      />
      <main>
        {content}
      </main>
    </div>
  );
}