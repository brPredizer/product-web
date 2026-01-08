'use client';

import Layout from '@/Layout';
import AccountView from '@/views/Account';

export default function AccountPage() {
  return (
    <Layout currentPageName="Account">
      <AccountView />
    </Layout>
  );
}
