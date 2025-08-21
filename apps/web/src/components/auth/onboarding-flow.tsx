'use client';

import { useState } from 'react';
import { WelcomeModal } from './welcome-modal';
import { TermsOfServiceModal } from './terms-of-service-modal';
import { PrivacyNoticeModal } from './privacy-notice-modal';
import { FinalConsentModal } from './final-consent-modal';
import { useTermsAcceptance } from '@/hooks/use-terms-acceptance';

export enum OnboardingStep {
  WELCOME = 'welcome',
  TERMS = 'terms',
  PRIVACY = 'privacy',
  CONSENT = 'consent',
  COMPLETED = 'completed'
}

interface OnboardingFlowProps {
  isOpen: boolean;
  onComplete: () => void;
  onClose: () => void;
  startStep?: OnboardingStep;
}

export function OnboardingFlow({ 
  isOpen, 
  onComplete, 
  onClose, 
  startStep = OnboardingStep.WELCOME 
}: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(startStep);
  const { acceptTerms } = useTermsAcceptance();

  const handleWelcomeNext = () => {
    setCurrentStep(OnboardingStep.TERMS);
  };

  const handleTermsAccept = () => {
    setCurrentStep(OnboardingStep.PRIVACY);
  };

  const handleTermsDecline = () => {
    onClose();
  };

  const handlePrivacyAccept = () => {
    setCurrentStep(OnboardingStep.CONSENT);
  };

  const handlePrivacyBack = () => {
    setCurrentStep(OnboardingStep.TERMS);
  };

  const handleFinalConsent = async () => {
    try {
      // Accept terms and complete onboarding
      await acceptTerms();
      setCurrentStep(OnboardingStep.COMPLETED);
      onComplete();
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      // Could show error modal here
    }
  };

  const handleConsentBack = () => {
    setCurrentStep(OnboardingStep.PRIVACY);
  };

  if (!isOpen || currentStep === OnboardingStep.COMPLETED) {
    return null;
  }

  return (
    <>
      {/* Progress Indicator */}
      {isOpen && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4">
          <div className="bg-white rounded-full px-3 py-2 shadow-lg border border-gray-200 max-w-xs">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {/* Step indicators */}
                {[
                  { step: OnboardingStep.WELCOME, label: '1' },
                  { step: OnboardingStep.TERMS, label: '2' },
                  { step: OnboardingStep.PRIVACY, label: '3' },
                  { step: OnboardingStep.CONSENT, label: '4' }
                ].map((item, index) => (
                  <div key={item.step} className="flex items-center gap-1">
                    <div
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                        getCurrentStepIndex(currentStep) > index
                          ? 'bg-green-500 text-white'
                          : getCurrentStepIndex(currentStep) === index
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {getCurrentStepIndex(currentStep) > index ? '✓' : item.label}
                    </div>
                    {index < 3 && (
                      <div
                        className={`w-2 sm:w-4 h-0.5 transition-colors ${
                          getCurrentStepIndex(currentStep) > index
                            ? 'bg-green-500'
                            : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
              <span className="text-xs text-gray-600 ml-1 sm:ml-2 hidden sm:inline">
                Step {getCurrentStepIndex(currentStep) + 1} of 4
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Step Components */}
      <WelcomeModal
        isOpen={currentStep === OnboardingStep.WELCOME}
        onNext={handleWelcomeNext}
        onClose={onClose}
      />

      <TermsOfServiceModal
        isOpen={currentStep === OnboardingStep.TERMS}
        onAccept={handleTermsAccept}
        onDecline={handleTermsDecline}
        showSummary={true}
      />

      <PrivacyNoticeModal
        isOpen={currentStep === OnboardingStep.PRIVACY}
        onAccept={handlePrivacyAccept}
        onBack={handlePrivacyBack}
        onClose={onClose}
      />

      <FinalConsentModal
        isOpen={currentStep === OnboardingStep.CONSENT}
        onEnterOrenna={handleFinalConsent}
        onBack={handleConsentBack}
        onClose={onClose}
      />
    </>
  );
}

// Helper function to get the current step index for progress tracking
function getCurrentStepIndex(step: OnboardingStep): number {
  const stepOrder = [
    OnboardingStep.WELCOME,
    OnboardingStep.TERMS,
    OnboardingStep.PRIVACY,
    OnboardingStep.CONSENT
  ];
  return stepOrder.indexOf(step);
}