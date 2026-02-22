"use client";

import React from "react";
import Layout from "@/components/layout/AppLayout";
import FaqPage from "@/components/pages/FaqPage";

export default function PublicFaqPage(): JSX.Element {
  return (
    <Layout currentPageName="Learn">
      <FaqPage />
    </Layout>
  );
}
