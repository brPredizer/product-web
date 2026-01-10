'use client';

import React from 'react';
import Layout from '@/Layout';
import Market from '@/views/Market';

export default function MarketPage(): JSX.Element {
  return (
    <Layout currentPageName="Market">
      <Market />
    </Layout>
  );
}
