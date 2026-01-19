'use client';

import React from 'react';
import Layout from '@/components/layout/AppLayout';
import Portfolio from '@/components/pages/Portfolio';

export default function PortfolioPage(): JSX.Element {
  return (
    <Layout currentPageName="Portfolio">
      <Portfolio />
    </Layout>
  );
}
