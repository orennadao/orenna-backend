'use client';

import { useState, useEffect } from 'react';
import { useTermsAcceptance } from '@/hooks/use-terms-acceptance';
import { TermsOfServiceModal } from './terms-of-service-modal';

interface TermsRequiredWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onTermsDeclined?: () => void;
  requireAcceptance?: boolean;
}

export function TermsRequiredWrapper({ 
  children, 
  fallback,
  onTermsDeclined,
  requireAcceptance = true 
}: TermsRequiredWrapperProps) {
  const { needsAcceptance, isLoading, acceptTerms } = useTermsAcceptance();
  const [showTerms, setShowTerms] = useState(false);

  useEffect(() => {
    if (!isLoading && requireAcceptance && needsAcceptance) {
      setShowTerms(true);
    }
  }, [isLoading, requireAcceptance, needsAcceptance]);

  const handleAccept = () => {
    acceptTerms();
    setShowTerms(false);
  };

  const handleDecline = () => {
    setShowTerms(false);
    onTermsDeclined?.();
  };

  // Show loading state while checking terms acceptance
  if (isLoading) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      )
    );
  }

  // Show children if terms are accepted or not required
  if (!requireAcceptance || !needsAcceptance) {
    return <>{children}</>;
  }

  // Show ToS modal
  return (
    <>
      {children}
      <TermsOfServiceModal
        isOpen={showTerms}
        onAccept={handleAccept}
        onDecline={handleDecline}
        showSummary={true}
      />
    </>
  );
}