'use client';

import { useState, useEffect } from 'react';

const TERMS_ACCEPTANCE_KEY = 'orenna_terms_accepted';
const TERMS_VERSION_KEY = 'orenna_terms_version';
const CURRENT_TERMS_VERSION = '2024.01'; // Update this when ToS changes

interface TermsAcceptanceState {
  hasAccepted: boolean;
  version: string | null;
  needsAcceptance: boolean;
}

export function useTermsAcceptance() {
  const [state, setState] = useState<TermsAcceptanceState>({
    hasAccepted: false,
    version: null,
    needsAcceptance: true
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for existing acceptance
    const checkAcceptance = () => {
      try {
        const accepted = localStorage.getItem(TERMS_ACCEPTANCE_KEY) === 'true';
        const version = localStorage.getItem(TERMS_VERSION_KEY);
        
        // User needs to accept if:
        // 1. They haven't accepted before, OR
        // 2. They accepted an older version of the terms
        const needsAcceptance = !accepted || version !== CURRENT_TERMS_VERSION;

        setState({
          hasAccepted: accepted,
          version,
          needsAcceptance
        });
      } catch (error) {
        console.error('Error checking terms acceptance:', error);
        // Default to requiring acceptance on error
        setState({
          hasAccepted: false,
          version: null,
          needsAcceptance: true
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkAcceptance();
  }, []);

  const acceptTerms = () => {
    try {
      localStorage.setItem(TERMS_ACCEPTANCE_KEY, 'true');
      localStorage.setItem(TERMS_VERSION_KEY, CURRENT_TERMS_VERSION);
      
      setState({
        hasAccepted: true,
        version: CURRENT_TERMS_VERSION,
        needsAcceptance: false
      });

      // Optional: Track acceptance analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'terms_accepted', {
          event_category: 'onboarding',
          terms_version: CURRENT_TERMS_VERSION
        });
      }
    } catch (error) {
      console.error('Error saving terms acceptance:', error);
      throw new Error('Failed to save terms acceptance');
    }
  };

  const revokeAcceptance = () => {
    try {
      localStorage.removeItem(TERMS_ACCEPTANCE_KEY);
      localStorage.removeItem(TERMS_VERSION_KEY);
      
      setState({
        hasAccepted: false,
        version: null,
        needsAcceptance: true
      });
    } catch (error) {
      console.error('Error revoking terms acceptance:', error);
      throw new Error('Failed to revoke terms acceptance');
    }
  };

  const getAcceptanceDate = (): Date | null => {
    try {
      const timestamp = localStorage.getItem(`${TERMS_ACCEPTANCE_KEY}_timestamp`);
      return timestamp ? new Date(timestamp) : null;
    } catch {
      return null;
    }
  };

  const setAcceptanceTimestamp = () => {
    try {
      localStorage.setItem(`${TERMS_ACCEPTANCE_KEY}_timestamp`, new Date().toISOString());
    } catch (error) {
      console.error('Error setting acceptance timestamp:', error);
    }
  };

  return {
    ...state,
    isLoading,
    currentVersion: CURRENT_TERMS_VERSION,
    acceptTerms: () => {
      acceptTerms();
      setAcceptanceTimestamp();
    },
    revokeAcceptance,
    getAcceptanceDate
  };
}