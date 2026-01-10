'use client';

import React from 'react';
import Layout from '@/Layout';
import Admin from '@/views/Admin';

export default function AdminPage(): JSX.Element {
  return (
    <Layout currentPageName="Admin">
      <Admin />
    </Layout>
  );
}
