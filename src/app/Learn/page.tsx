'use client';

import React from 'react';
import Layout from '@/Layout';
import Learn from '@/views/Learn';

export default function LearnPage(): JSX.Element {
  return (
    <Layout currentPageName="Learn">
      <Learn />
    </Layout>
  );
}
