'use client';

import React from 'react';
import Layout from '@/components/layout/AppLayout';
import Wallet from '@/components/pages/wallet/Wallet';

export default function WalletPage(): JSX.Element {
  return (
    <Layout currentPageName="Wallet">
      <Wallet />
    </Layout>
  );
}
