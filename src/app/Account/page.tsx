'use client';

import React from 'react';
import Layout from '@/Layout';
import AccountView from '@/views/Account';

export default function AccountPage(): JSX.Element {
  return (
    <Layout currentPageName="Account">
      <AccountView />
    </Layout>
  );
}
