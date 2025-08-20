'use client'

import { ProtectedRoute } from "@/components/auth/protected-route";
import { MainLayout } from "@/components/layout/main-layout";
import { LiftTokensDashboard } from "@/components/lift-tokens/lift-tokens-dashboard";
export default function LiftTokensPage() {
  return (
    <ProtectedRoute>
      <MainLayout
        title="My Lift Tokens"
        description="View and manage your ecosystem function lift tokens representing verified environmental improvements"
      >
        <LiftTokensDashboard />
      </MainLayout>
    </ProtectedRoute>
  );
}