'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ExplorePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home page with scroll to browsing section
    // Since we're implementing the landing page as a single page with all public content
    // the /explore route just redirects back to / 
    router.replace("/#guest-browsing");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Taking you to browse mode...</p>
      </div>
    </div>
  );
}