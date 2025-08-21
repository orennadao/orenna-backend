'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PrivacyPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to existing privacy-notice page
    router.replace("/privacy-notice");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading Privacy Notice...</p>
      </div>
    </div>
  );
}