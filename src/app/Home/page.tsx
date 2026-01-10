'use client';

import React from 'react';
import Layout from '@/Layout';
import Home from '@/views/Home';

export default function HomeAliasPage(): JSX.Element {
  return (
    <Layout currentPageName="Home">
      <Home />
    </Layout>
  );
}
