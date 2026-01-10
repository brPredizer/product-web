'use client';

import React from 'react';
import Layout from '@/Layout';
import CreateMarket from '@/views/CreateMarket';

export default function CreateMarketPage(): JSX.Element {
  return (
    <Layout currentPageName="CreateMarket">
      <CreateMarket />
    </Layout>
  );
}
