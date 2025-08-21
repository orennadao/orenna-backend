'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TermsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to existing terms-of-service page
    router.replace("/terms-of-service");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading Terms of Service...</p>
      </div>
    </div>
  );
}