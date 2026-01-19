'use client';

import React from 'react';
import Layout from '@/components/layout/AppLayout';
import CreateMarket from '@/components/pages/CreateMarket';

export default function CreateMarketPage(): JSX.Element {
  return (
    <Layout currentPageName="CreateMarket">
      <CreateMarket />
    </Layout>
  );
}
