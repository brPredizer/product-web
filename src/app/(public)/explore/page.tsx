'use client';

import React from 'react';
import Layout from '@/components/layout/AppLayout';
import Explore from '@/components/pages/Explore';

export default function ExplorePage(): JSX.Element {
  return (
    <Layout currentPageName="Explore">
      <Explore />
    </Layout>
  );
}
