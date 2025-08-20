'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from "@/components/auth/protected-route";
import { MainLayout } from "@/components/layout/main-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Info } from "lucide-react";
import Link from "next/link";

export default function CreateLiftTokenRedirectPage() {
  const router = useRouter();

  // Auto-redirect after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/mint-requests/create');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <ProtectedRoute>
      <MainLayout
        title="Lift Token Creation"
        description="Understanding the proper workflow for creating lift tokens"
      >
        <div className="max-w-2xl mx-auto">
          <Card className="p-8">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <Info className="h-8 w-8 text-blue-600" />
              </div>
              
              <div className="space-y-3">
                <h2 className="text-xl font-semibold text-gray-900">
                  Lift Tokens Are Created Automatically
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  Lift tokens cannot be created manually. They are automatically generated when:
                </p>
                <ol className="text-left text-gray-600 space-y-2 list-decimal list-inside">
                  <li>You submit a mint request for verified environmental improvements</li>
                  <li>A verifier reviews and approves your evidence</li>
                  <li>The tokens are minted on-chain through the proper verification workflow</li>
                </ol>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700 font-medium mb-3">
                  To create lift tokens, start with a mint request:
                </p>
                <div className="space-y-3">
                  <Link href="/mint-requests/create">
                    <Button className="w-full">
                      Submit Mint Request
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/projects">
                    <Button variant="outline" className="w-full">
                      Browse Projects First
                    </Button>
                  </Link>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                Redirecting to mint request form in 5 seconds...
              </p>
            </div>
          </Card>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}