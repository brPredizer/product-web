'use client';

import React from 'react';
import Layout from '@/components/layout/AppLayout';
import Home from '@/components/pages/Home';

export default function HomePage(): JSX.Element {
  return (
    <Layout currentPageName="Home">
      <Home />
    </Layout>
  );
}
