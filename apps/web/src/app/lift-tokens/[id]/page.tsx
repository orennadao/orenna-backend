'use client'

import { use } from 'react'
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { LiftTokenDetail } from "@/components/lift-tokens/lift-token-detail";

interface PageProps {
  params: Promise<{ id: string }>
}

export default function LiftTokenDetailPage({ params }: PageProps) {
  const { id } = use(params)

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-7xl mx-auto">
              <LiftTokenDetail liftTokenId={parseInt(id)} />
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </ProtectedRoute>
  );
}