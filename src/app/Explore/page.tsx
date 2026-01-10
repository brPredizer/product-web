'use client';

import React from 'react';
import Layout from '@/Layout';
import Explore from '@/views/Explore';

export default function ExplorePage(): JSX.Element {
  return (
    <Layout currentPageName="Explore">
      <Explore />
    </Layout>
  );
}
