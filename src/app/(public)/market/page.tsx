"use client";

export const dynamic = 'force-dynamic';
import React from 'react';
import Layout from '@/components/layout/AppLayout';
import Market from '@/components/pages/Market';

export default function MarketPage(): JSX.Element {
  return (
    <Layout currentPageName="Market">
      <Market />
    </Layout>
  );
}
