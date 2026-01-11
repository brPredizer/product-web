'use client';

import React from 'react';
import Layout from '@/Layout';
import Wallet from '@/views/Wallet';

export default function WalletPage(): JSX.Element {
  return (
    <Layout currentPageName="Wallet">
      <Wallet />
    </Layout>
  );
}
