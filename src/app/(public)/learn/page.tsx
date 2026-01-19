'use client';

import React from 'react';
import Layout from '@/components/layout/AppLayout';
import Learn from '@/components/pages/Learn';

export default function LearnPage(): JSX.Element {
  return (
    <Layout currentPageName="Learn">
      <Learn />
    </Layout>
  );
}
