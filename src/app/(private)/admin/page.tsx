'use client';

import React from 'react';
import Layout from '@/components/layout/AppLayout';
import Admin from '@/components/pages/Admin';

export default function AdminPage(): JSX.Element {
  return (
    <Layout currentPageName="Admin">
      <Admin />
    </Layout>
  );
}
