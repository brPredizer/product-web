'use client';

import React from 'react';
import Layout from '@/Layout';
import RiskControls from '@/views/RiskControls';

export default function RiskControlsPage(): JSX.Element {
  return (
    <Layout currentPageName="RiskControls">
      <RiskControls />
    </Layout>
  );
}
