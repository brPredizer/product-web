'use client';

import React from 'react';
import Layout from '@/components/layout/AppLayout';
import RiskControls from '@/components/pages/RiskControls';

export default function RiskControlsPage(): JSX.Element {
  return (
    <Layout currentPageName="RiskControls">
      <RiskControls />
    </Layout>
  );
}
