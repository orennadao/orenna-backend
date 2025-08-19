import * as React from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../button';
import { Card, CardContent, CardHeader, CardTitle } from '../card';

interface WizardStep {
  id: string;
  title: string;
  description?: string;
  isValid?: boolean;
  isOptional?: boolean;
}

interface WizardProps {
  steps: WizardStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onFinish?: () => void;
  children: React.ReactNode;
  canNext?: boolean;
  canFinish?: boolean;
  isLoading?: boolean;
}

const WizardContext = React.createContext<{
  currentStep: number;
  steps: WizardStep[];
  goToStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  canNext: boolean;
  canFinish: boolean;
  isLoading: boolean;
} | null>(null);

export function useWizard() {
  const context = React.useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within a Wizard component');
  }
  return context;
}

export function Wizard({
  steps,
  currentStep,
  onStepChange,
  onNext,
  onPrevious,
  onFinish,
  children,
  canNext = true,
  canFinish = false,
  isLoading = false,
}: WizardProps) {
  const goToStep = (step: number) => {
    if (step >= 0 && step < steps.length) {
      onStepChange(step);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      goToStep(currentStep + 1);
      onNext?.();
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
      onPrevious?.();
    }
  };

  const contextValue = {
    currentStep,
    steps,
    goToStep,
    nextStep,
    previousStep,
    canNext,
    canFinish,
    isLoading,
  };

  return (
    <WizardContext.Provider value={contextValue}>
      <div className="wizard">
        <WizardSteps />
        <div className="wizard-content mt-6">
          {children}
        </div>
        <WizardControls onFinish={onFinish} />
      </div>
    </WizardContext.Provider>
  );
}

function WizardSteps() {
  const { currentStep, steps, goToStep } = useWizard();

  return (
    <div className="wizard-steps">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div
              className={cn(
                'flex items-center gap-2 cursor-pointer transition-colors',
                index === currentStep && 'text-primary',
                index < currentStep && 'text-success',
                index > currentStep && 'text-muted-foreground'
              )}
              onClick={() => goToStep(index)}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-colors',
                  index === currentStep && 'border-primary bg-primary text-primary-foreground',
                  index < currentStep && 'border-success bg-success text-white',
                  index > currentStep && 'border-muted-foreground text-muted-foreground'
                )}
              >
                {index < currentStep ? '✓' : index + 1}
              </div>
              <div className="hidden sm:block">
                <div className="font-medium text-sm">{step.title}</div>
                {step.description && (
                  <div className="text-xs text-muted-foreground">{step.description}</div>
                )}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-4 transition-colors',
                  index < currentStep ? 'bg-success' : 'bg-muted'
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function WizardControls({ onFinish }: { onFinish?: () => void }) {
  const { currentStep, steps, nextStep, previousStep, canNext, canFinish, isLoading } = useWizard();

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="wizard-controls flex justify-between items-center mt-8 pt-6 border-t">
      <Button
        variant="outline"
        onClick={previousStep}
        disabled={isFirstStep || isLoading}
      >
        Previous
      </Button>

      <div className="flex gap-2">
        {!isLastStep && (
          <Button
            onClick={nextStep}
            disabled={!canNext || isLoading}
          >
            {isLoading ? 'Loading...' : 'Next'}
          </Button>
        )}
        
        {isLastStep && (
          <Button
            onClick={onFinish}
            disabled={!canFinish || isLoading}
            variant="default"
          >
            {isLoading ? 'Processing...' : 'Finish'}
          </Button>
        )}
      </div>
    </div>
  );
}

export function WizardStep({
  children,
  stepId,
}: {
  children: React.ReactNode;
  stepId: string;
}) {
  const { currentStep, steps } = useWizard();
  const step = steps.find(s => s.id === stepId);
  const stepIndex = steps.findIndex(s => s.id === stepId);

  if (stepIndex !== currentStep) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{step?.title}</CardTitle>
        {step?.description && (
          <p className="text-muted-foreground">{step.description}</p>
        )}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}