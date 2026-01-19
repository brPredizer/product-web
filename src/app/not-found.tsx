'use client';

import React from 'react';
import Layout from '@/components/layout/AppLayout';
import PageNotFound from '@/lib/PageNotFound';

export default function NotFound(): JSX.Element {
  return (
    <Layout>
      <PageNotFound />
    </Layout>
  );
}
