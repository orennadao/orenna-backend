'use client'

import { MainLayout } from '@/components/layout/main-layout';
import { BlockchainDashboard } from "@/components/blockchain/blockchain-dashboard";

export default function BlockchainPage() {
  return (
    <MainLayout>
      <BlockchainDashboard />
    </MainLayout>
  );
}