"use client";

import React from "react";
import Layout from "@/components/layout/AppLayout";
import LegalPageShell from "@/components/pages/legal/LegalPageShell";
import { LEGAL_PAGE_CONTENT } from "@/components/pages/legal/legalContent";

export default function ResolutionRulesPage(): JSX.Element {
  return (
    <Layout currentPageName="Learn">
      <LegalPageShell content={LEGAL_PAGE_CONTENT.resolutionRules} />
    </Layout>
  );
}
