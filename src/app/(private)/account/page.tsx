'use client';

import React from 'react';
import Layout from '@/components/layout/AppLayout';
import AccountView from '@/components/pages/Account';

export default function AccountPage(): JSX.Element {
  return (
    <Layout currentPageName="Account">
      <AccountView />
    </Layout>
  );
}
