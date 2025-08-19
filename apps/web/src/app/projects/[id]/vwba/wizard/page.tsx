'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { VWBAVerificationWizard } from '../../../../../components/verification/vwba-verification-wizard';
import { useProject, useSubmitVerification } from '@orenna/api-client';
import { Card, CardContent } from '@orenna/ui';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export default function VWBAWizardPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = parseInt(params?.id as string);
  
  const { data: project, isLoading, error } = useProject(projectId);
  const submitVerification = useSubmitVerification();
  const [wizardData, setWizardData] = useState<any>(null);

  useEffect(() => {
    // Load any existing wizard data from localStorage
    const savedData = localStorage.getItem(`vwba-wizard-${projectId}`);
    if (savedData) {
      try {
        setWizardData(JSON.parse(savedData));
      } catch (error) {
        console.error('Failed to parse saved wizard data:', error);
      }
    }
  }, [projectId]);

  const handleWizardSave = (data: any) => {
    // Save draft to localStorage
    localStorage.setItem(`vwba-wizard-${projectId}`, JSON.stringify(data));
    setWizardData(data);
  };

  const handleWizardComplete = async (data: any) => {
    try {
      // Submit VWBA verification request using the verification API
      await submitVerification.mutateAsync({
        liftTokenId: data.liftTokenId, // This would come from the wizard data
        methodId: 'vwba-v2.0',
        validatorAddress: data.validatorAddress,
        validatorName: data.validatorName || 'VWBA Wizard',
        notes: `VWBA verification submitted via wizard for project ${projectId}`,
        evidence: data.evidence || [],
      });
      
      // Clear saved draft
      localStorage.removeItem(`vwba-wizard-${projectId}`);
      
      // Navigate back to project with success message
      router.push(`/projects/${projectId}?vwba=success`);
    } catch (error) {
      console.error('Failed to submit VWBA verification:', error);
      throw error; // Let the wizard handle the error display
    }
  };

  const handleExit = () => {
    const hasUnsavedChanges = wizardData && Object.keys(wizardData).length > 0;
    
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to exit? Your progress will be saved as a draft.'
      );
      if (!confirmed) return;
    }
    
    router.push(`/projects/${projectId}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="space-y-4">
          <div className="h-8 bg-muted rounded animate-pulse" />
          <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
          <div className="h-64 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="h-6 w-6" />
              <div>
                <h3 className="font-semibold">Project Not Found</h3>
                <p className="text-sm text-muted-foreground">
                  The project you're looking for doesn't exist or you don't have access to it.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleExit}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back to Project</span>
            </button>
            <div className="h-4 border-l border-border" />
            <div>
              <h1 className="text-xl font-semibold">VWBA Verification Wizard</h1>
              <p className="text-sm text-muted-foreground">
                {project.name} • Volumetric Water Benefit Accounting
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Wizard Content */}
      <div className="container mx-auto px-4 py-6">
        <VWBAVerificationWizard
          projectId={projectId}
          project={project}
          initialData={wizardData}
          onSave={handleWizardSave}
          onComplete={handleWizardComplete}
          onExit={handleExit}
          isSubmitting={submitVerification.isPending}
        />
      </div>
    </div>
  );
}