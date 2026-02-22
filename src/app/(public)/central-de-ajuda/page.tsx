"use client";

import React from "react";
import Layout from "@/components/layout/AppLayout";
import HelpCenterPage from "@/components/pages/HelpCenterPage";

export default function PublicHelpCenterPage(): JSX.Element {
  return (
    <Layout currentPageName="Learn">
      <HelpCenterPage />
    </Layout>
  );
}

