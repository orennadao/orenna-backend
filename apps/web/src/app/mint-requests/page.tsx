'use client'

import dynamic from 'next/dynamic'
import { ProtectedRoute } from "@/components/auth/protected-route";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Plus, Shield } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";

const MintRequestList = dynamic(
  () => import("@/components/mint-requests/mint-request-list").then(mod => ({ default: mod.MintRequestList })),
  { ssr: false }
)

const VerificationQueue = dynamic(
  () => import("@/components/mint-requests/verification-queue").then(mod => ({ default: mod.VerificationQueue })),
  { ssr: false }
)

export default function MintRequestsPage() {
  const { user } = useAuth();
  
  // Check if user has verifier permissions
  const userRoles = [
    ...(user?.roles?.projectRoles || []),
    ...(user?.roles?.systemRoles || [])
  ];
  
  const isVerifier = userRoles.includes('VERIFIER') || userRoles.includes('PLATFORM_ADMIN');

  return (
    <ProtectedRoute>
      <MainLayout
        title={isVerifier ? "Verification Queue" : "My Mint Requests"}
        description={
          isVerifier 
            ? "Review and approve mint requests for environmental improvements"
            : "Submit and track verification requests for environmental improvements that will generate lift tokens"
        }
        actions={
          <div className="flex items-center gap-3">
            {isVerifier && (
              <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                <Shield className="h-4 w-4" />
                Verifier Access
              </div>
            )}
            <Link href="/mint-requests/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Submit Request
              </Button>
            </Link>
          </div>
        }
      >
        {isVerifier ? (
          <VerificationQueue userRoles={userRoles} />
        ) : (
          <MintRequestList />
        )}
      </MainLayout>
    </ProtectedRoute>
  );
}