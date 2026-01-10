'use client';

import React from 'react';
import Layout from '@/Layout';
import Portfolio from '@/views/Portfolio';

export default function PortfolioPage(): JSX.Element {
  return (
    <Layout currentPageName="Portfolio">
      <Portfolio />
    </Layout>
  );
}
