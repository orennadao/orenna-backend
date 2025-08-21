'use client'

import { ProtectedRoute } from "@/components/auth/protected-route";
import { MainLayout } from "@/components/layout/main-layout";
import { LiftTokensDashboard } from "@/components/lift-tokens/lift-tokens-dashboard";
export default function LiftTokensPage() {
  return (
    <ProtectedRoute 
      allowGuest={true}
      guestMessage="Browse available Lift Tokens publicly. Connect your wallet to purchase tokens and manage your portfolio."
    >
      <MainLayout
        title="Lift Tokens"
        description="View ecosystem function lift tokens representing verified environmental improvements"
      >
        <LiftTokensDashboard />
      </MainLayout>
    </ProtectedRoute>
  );
}